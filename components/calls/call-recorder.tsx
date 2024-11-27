"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, axiosClient } from "@/lib/api-client";
import { useAgora } from "@/contexts/agora-context";

interface CallRecorderProps {
  callId: string;
  isActive: boolean;
}

export default function CallRecorder({
  callId,
  isActive,
}: Readonly<CallRecorderProps>) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { toast } = useToast();
  const { joinCall, leaveCall, startRecording, stopRecording } = useAgora();

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
      await joinCall(callId);
      await startRecording();

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

  const handleStopRecording = async () => {
    try {
      const recordingBlob = await stopRecording();
      if (!recordingBlob) {
        throw new Error("No recording data available");
      }

      const formData = new FormData();
      formData.append("recording", recordingBlob);

      const response = await axiosClient.post(
        `/calls/${callId}/recording/stop`,
        formData
      );

      if (![200, 201, 204].includes(response.status)) {
        throw new Error(
          (response.data as { message?: string })?.message ||
            "Failed to stop recording"
        );
      }

      await leaveCall();
      setIsRecording(false);
      setRecordingDuration(0);

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
            onClick={isRecording ? handleStopRecording : handleStartRecording}
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
