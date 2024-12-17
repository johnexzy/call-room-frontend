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
  ILocalAudioTrack,
  IRemoteAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from "agora-rtc-sdk-ng";
import {
  useState,
  useCallback,
  createContext,
  useMemo,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { JoinConfig } from "@/types";
import { Badge } from "@/components/ui/badge";
import { axiosClient } from "@/lib/api-client";
import { AudioProcessor } from "@/lib/audio-processor";

interface AgoraContextType {
  localMicrophoneTrack: ILocalAudioTrack | null;
  children: React.ReactNode;
}

interface AgoraManagerProps {
  callId: string;
  isRep: boolean;
  onCallEnd?: () => void;
  onTranscriptReceived?: (userId: string, transcript: string) => void;
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
  onTranscriptReceived,
  joinConfig,
  isRep,
}: Readonly<AgoraManagerProps>) {
  const agoraEngine = useRTCClient();

  const { toast } = useToast();

  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const [participants, setParticipants] = useState<
    { uid: UID; name: string }[]
  >([]);

  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingResourceId, setRecordingResourceId] = useState<string | null>(
    null
  );
  const [recordingSid, setRecordingSid] = useState<string | null>(null);
  const audioProcessors = useRef<Map<string, AudioProcessor>>(new Map());

  const remoteUsers = useRemoteUsers();

  usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : []);

  const { isConnected, isLoading } = useJoin({
    ...joinConfig,
  });

  const initializeAudioProcessor = useCallback(
    async (userId: string, track: ILocalAudioTrack | IRemoteAudioTrack) => {
      try {
        const processor = new AudioProcessor(
          `${callId}-${userId}`,
          callId,
          userId
        );
        await processor.init();
        await processor.processTrack(track);

        processor.onTranscript((transcript) => {
          onTranscriptReceived?.(userId, transcript);
        });

        audioProcessors.current.set(String(userId), processor);
      } catch (error) {
        console.error("Failed to initialize audio processor:", error);
      }
    },
    [callId, onTranscriptReceived]
  );

  const handleRemoteTrack = useCallback(
    async (user: IAgoraRTCRemoteUser) => {
      if (!isConnected) return;

      const audioTrack = user.audioTrack;
      if (!audioTrack) return;

      try {
        await initializeAudioProcessor(String(user.uid), audioTrack);
      } catch (error) {
        console.error(
          `Failed to initialize remote audio processor for user ${user.uid}:`,
          error
        );
      }
    },
    [isConnected, initializeAudioProcessor]
  );

  // Initialize audio processing for local track
  useEffect(() => {
    if (!localMicrophoneTrack || !isConnected) return;

    const initLocalAudioProcessor = async () => {
      try {
        await initializeAudioProcessor("local", localMicrophoneTrack);
      } catch (error) {
        console.error("Failed to initialize local audio processor:", error);
        toast({
          title: "Error",
          description: "Failed to initialize audio processing",
          variant: "destructive",
        });
      }
    };

    initLocalAudioProcessor();

    return () => {
      const processor = audioProcessors.current.get("local");
      if (processor) {
        processor.stopProcessing();
        audioProcessors.current.delete("local");
      }
    };
  }, [localMicrophoneTrack, isConnected, initializeAudioProcessor, toast]);

  // Handle remote users' audio tracks
  useEffect(() => {
    if (!isConnected) return;

    remoteUsers.forEach((user) => {
      handleRemoteTrack(user).catch((error) => {
        console.error(
          `Failed to handle remote track for user ${user.uid}:`,
          error
        );
      });
    });

    return () => {
      remoteUsers.forEach((user) => {
        const processor = audioProcessors.current.get(String(user.uid));
        if (processor) {
          processor.stopProcessing();
          audioProcessors.current.delete(String(user.uid));
        }
      });
    };
  }, [remoteUsers, handleRemoteTrack, isConnected]);

  useClientEvent(agoraEngine, "user-joined", (user: IAgoraRTCRemoteUser) => {
    setParticipants((prevParticipants) => [
      ...prevParticipants,
      { uid: user.uid, name: `User ${user.uid}` },
    ]);
  });

  useClientEvent(agoraEngine, "user-left", (user: IAgoraRTCRemoteUser) => {
    setParticipants((prevParticipants) =>
      prevParticipants.filter((participant) => participant.uid !== user.uid)
    );
  });

  useClientEvent(
    agoraEngine,
    "user-published",
    (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      console.log(
        "The user",
        user.uid,
        "has published",
        mediaType,
        "in the channel"
      );
      if (mediaType === "audio") {
        void handleRemoteTrack(user);
      }
    }
  );

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
      if (isRecording) {
        await handleStopRecording();
      }

      // Stop all audio processors
      audioProcessors.current.forEach((processor) => {
        processor.stopProcessing();
      });
      audioProcessors.current.clear();

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
  }, [agoraEngine, localMicrophoneTrack, onCallEnd, toast, isRecording]);

  useClientEvent(agoraEngine, "volume-indicator", (volumes) => {
    volumes.forEach((volume) => {
      if (volume.level > 50) {
        console.log(`${volume.uid} is speaking`);
      }
    });
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
      const response = await axiosClient.post(
        `/calls/${callId}/recording/start`
      );
      const { resourceId, sid } = response.data as {
        resourceId: string;
        sid: string;
      };

      // Clear previous chunks
      setIsRecording(true);
      setRecordingResourceId(resourceId);
      setRecordingSid(sid);

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
      const response = await axiosClient.post(
        `/calls/${callId}/recording/stop`,
        { resourceId: recordingResourceId, sid: recordingSid }
      );

      if (![200, 201, 204].includes(response.status)) {
        throw new Error("Failed to save recording");
      }

      setIsRecording(false);

      toast({
        title: "Recording Stopped",
        description: "Call recording has been saved",
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

  useEffect(() => {
    if (isConnected && isRep) {
      setTimeout(() => {
        handleStartRecording();
      }, 2000);
    }
  }, [isConnected, isRep]);

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

            {isConnected && isRep && (
              <div className="text-center text-muted-foreground">
                {participants.length} participants
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            {isConnected && isRep && (
              <>
                <Button
                  onClick={
                    isRecording ? handleStopRecording : handleStartRecording
                  }
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
