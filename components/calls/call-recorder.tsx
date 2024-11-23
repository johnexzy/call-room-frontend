"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

interface Transcription {
  text: string;
  timestamp: Date;
  speaker: 'customer' | 'representative';
}

interface CallRecorderProps {
  callId: string;
  isActive: boolean;
}

export function CallRecorder({ callId, isActive }: CallRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (isActive) {
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/calls/${callId}/transcription-stream`
      );

      eventSource.onmessage = (event) => {
        const transcription = JSON.parse(event.data);
        setTranscriptions(prev => [...prev, transcription]);
      };

      return () => eventSource.close();
    }
  }, [callId, isActive]);

  const toggleRecording = async () => {
    try {
      const endpoint = isRecording ? 'stop' : 'start';
      const response = await apiClient.post(`/calls/${callId}/recording/${endpoint}`, {});
      
      if (response.ok) {
        setIsRecording(!isRecording);
        toast({
          title: isRecording ? "Recording Stopped" : "Recording Started",
          description: isRecording ? 
            "Call recording has been saved" : 
            "Call is now being recorded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle recording",
        variant: "destructive",
      });
    }
  };

  const downloadRecording = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calls/${callId}/recording/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-${callId}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Call Recording & Transcription</span>
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
            onClick={toggleRecording}
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
            <Button
              onClick={downloadRecording}
              variant="outline"
              disabled={!transcriptions.length}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="h-[300px] overflow-y-auto space-y-2 bg-muted p-4 rounded-md">
          {transcriptions.map((transcription, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 ${
                transcription.speaker === 'customer' ? 'justify-end' : ''
              }`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg ${
                  transcription.speaker === 'customer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                }`}
              >
                <p className="text-sm">{transcription.text}</p>
                <span className="text-xs opacity-70">
                  {new Date(transcription.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 