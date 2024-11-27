"use client";

import {
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
  useClientEvent,
} from "agora-rtc-react";
import {
  useState,
  useCallback,
  createContext,
  useMemo,
  useContext,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { JoinConfig } from "@/types";
import { IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { Badge } from "@/components/ui/badge";
import { apiClient, axiosClient } from "@/lib/api-client";

interface AgoraContextType {
  localMicrophoneTrack: IMicrophoneAudioTrack | null;
  children: React.ReactNode;
}

interface AgoraManagerProps {
  callId: string;
  userId: string;
  onCallEnd?: () => void;
  joinConfig: JoinConfig;
}
const AgoraContext = createContext<AgoraContextType | null>(null);

// AgoraProvider component to provide the Agora context to its children
export const AgoraProvider: React.FC<AgoraContextType> = ({
  children,
  localMicrophoneTrack,
}) => {
  const value = useMemo(
    () => ({ localMicrophoneTrack, children }),
    [localMicrophoneTrack, children]
  );

  return (
    <AgoraContext.Provider value={value}>{children}</AgoraContext.Provider>
  );
};

// Custom hook to access the Agora context
export const useAgoraContext = () => {
  const context = useContext(AgoraContext);
  if (!context)
    throw new Error("useAgoraContext must be used within an AgoraProvider");
  return context;
};
export function AgoraManager({
  callId,
  onCallEnd,
  joinConfig,
}: Readonly<AgoraManagerProps>) {
  const agoraEngine = useRTCClient();

  const { toast } = useToast();

  //   agoraEngine.enableAudioVolumeIndicator();

  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const [participants, setParticipants] = useState<any[]>([]);

  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingChunks, setRecordingChunks] = useState<BlobPart[]>([]);

  const remoteUsers = useRemoteUsers();

  usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);

  const { isConnected, isLoading } = useJoin({
    ...joinConfig,
  });

  useClientEvent(agoraEngine, "user-joined", (user) => {
    setParticipants((prevParticipants) => [
      ...prevParticipants,
      { uid: user.uid, name: `User ${user.uid}` },
    ]);
  });

  useClientEvent(agoraEngine, "user-left", (user) => {
    setParticipants((prevParticipants) =>
      prevParticipants.filter((participant) => participant.uid !== user.uid)
    );
  });

  const toggleMute = () => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack
        .setEnabled(isMuted)
        .then(() => {
          setIsMuted(!isMuted);
        })
        .catch((error) => {
          console.error("Failed to toggle mute:", error);
        });
    }
  };

  const handleEndCall = useCallback(async () => {
    try {
      if (localMicrophoneTrack) {
        localMicrophoneTrack.close();
      }
      await agoraEngine.leave();
      onCallEnd?.();
    } catch (error) {
      console.error("Failed to end call:", error);
      toast({
        title: "Error",
        description: "Failed to end call properly",
        variant: "destructive",
      });
    }
  }, [agoraEngine, localMicrophoneTrack, onCallEnd, toast]);

  useClientEvent(agoraEngine, "volume-indicator", (volumes) => {
    volumes.forEach((volume) => {
      if (volume.level > 50) {
        console.log(`${volume.uid} is speaking`);
      }
    });
  });

  useClientEvent(agoraEngine, "user-published", (user) => {
    console.log("The user", user.uid, " has published media in the channel");
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      await apiClient.post(`/calls/${callId}/recording/start`);
      
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      if (localMicrophoneTrack) {
        const localStream = new MediaStream([localMicrophoneTrack.getMediaStreamTrack()]);
        const localSource = audioContext.createMediaStreamSource(localStream);
        localSource.connect(destination);
      }

      remoteUsers.forEach(user => {
        if (user.audioTrack) {
          const remoteStream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
          const remoteSource = audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(destination);
        }
      });

      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Clear previous chunks
      setRecordingChunks([]);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordingChunks(prev => [...prev, e.data]);
        }
      };

      // Request data every second
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      // Store the mediaRecorder instance
      (window as any).mediaRecorder = mediaRecorder;

      toast({
        title: "Recording Started",
        description: "Call is now being recorded",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      const mediaRecorder = (window as any).mediaRecorder;
      if (!mediaRecorder) throw new Error("No recording in progress");

      return new Promise<void>((resolve, reject) => {
        mediaRecorder.onstop = async () => {
          try {
            const blob = new Blob(recordingChunks, { 
              type: "audio/webm;codecs=opus" 
            });
            
            const formData = new FormData();
            formData.append("recording", blob, "recording.webm");

            const response = await axiosClient.post(
              `/calls/${callId}/recording/stop`,
              formData
            );

            if (![200, 201, 204].includes(response.status)) {
              throw new Error("Failed to save recording");
            }

            setIsRecording(false);
            setRecordingDuration(0);
            setRecordingChunks([]);
            (window as any).mediaRecorder = null;

            toast({
              title: "Recording Stopped",
              description: "Call recording has been saved",
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.stop();
      });
    } catch (error: any) {
      console.error("Failed to stop recording:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop recording",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AgoraProvider localMicrophoneTrack={localMicrophoneTrack}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              onClick={toggleMute}
              disabled={!isConnected || isLoading}
            >
              {isLoading ? (
                "Connecting..."
              ) : (
                <>
                  {isMuted ? (
                    <MicOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Mic className="h-4 w-4 mr-2" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndCall}
              disabled={!isConnected || isLoading}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>

            {isConnected && (
              <div className="text-center text-muted-foreground">
                {participants.length} participants
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            {isConnected && (
              <>
                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant={isRecording ? "destructive" : "default"}
                  disabled={!isConnected || isLoading}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </>
                  )}
                </Button>
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    REC {formatDuration(recordingDuration)}
                  </Badge>
                )}
              </>
            )}
          </div>

          {(!isConnected || isLoading) && (
            <div className="text-center text-muted-foreground">
              Connecting to call...
            </div>
          )}
        </CardContent>
      </Card>

      <div className="hidden">
        {remoteUsers.map((user) => (
          <RemoteUser key={user.uid} user={user} playAudio />
        ))}
      </div>
    </AgoraProvider>
  );
}
