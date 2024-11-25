"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, axiosClient } from "@/lib/api-client";
import { AgoraService } from "@/lib/agora-service";


interface CallRecorderProps {
  callId: string;
  isActive: boolean;
}

export function CallRecorder({
  callId,
  isActive,
}: Readonly<CallRecorderProps>) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { toast } = useToast();
  const agoraRef = useRef<AgoraService | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Start recording on the server
      await apiClient.post(`/calls/${callId}/recording/start`);

      // Get Agora token
      const response = await apiClient.get(`/calls/${callId}/token`);
      if (!response.ok) throw new Error("Failed to get token");

      const { token, channel } = await response.json();

      // Initialize Agora recording client
      agoraRef.current = new AgoraService();
      await agoraRef.current.join(channel, token, callId);

      // Start local recording
      await agoraRef.current.startRecording();

      setIsRecording(true);
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

  const stopRecording = async () => {
    try {
      if (agoraRef.current) {
        const recordingBlob = await agoraRef.current.stopRecording();
        if (!recordingBlob) {
          throw new Error("No recording data available");
        }
        setIsRecording(false);
        setRecordingDuration(0);

        // Create form data with the recording file
        const formData = new FormData();

        formData.append("recording", recordingBlob);

        // Use apiClient instead of fetch for consistency
        const response = await axiosClient.post(
          `/calls/${callId}/recording/stop`,
          formData
        );
        if (response.status !== 200) {
          throw new Error((response.data as any).message || "Failed to stop recording");
        }

        await agoraRef.current.leave();
        agoraRef.current = null;

        setIsRecording(false);
        setRecordingDuration(0);

        toast({
          title: "Recording Stopped",
          description: "Call recording has been saved",
        });
      }
    } catch (error: any) {
      console.error("Failed to stop recording:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop recording",
        variant: "destructive",
      });
    }
  };

  const downloadRecording = async () => {
    try {
      // Get signed URL first
      const response = await apiClient.get(`/calls/${callId}/recording/url`);

      if (response.ok) {
        const { url } = await response.json();

        // Download using the signed URL
        const recordingResponse = await fetch(url);
        if (recordingResponse.ok) {
          const blob = await recordingResponse.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `call-${callId}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download recording",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActive) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Call Recording</span>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              REC {formatDuration(recordingDuration)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            className="flex-1"
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
          {!isRecording && (
            <Button onClick={downloadRecording} variant="outline">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
