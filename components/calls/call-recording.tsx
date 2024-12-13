import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, DownloadIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CallDetails } from "@/types";

interface CallRecordingProps {
  call: CallDetails;
}

export function CallRecording({ call }: Readonly<CallRecordingProps>) {
  const transcript = call.transcripts;
  const [recordingUrl, setRecordingUrl] = useState<string | null>(
    call.recordingUrl
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Try to play, this will fail if the URL is expired
        const playPromise = audioRef.current.play();
        if (playPromise) {
          try {
            await playPromise;
            setIsPlaying(true);
          } catch (error) {
            // URL might be expired, try to refresh it
            await refreshUrl();
          }
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
      toast({
        title: "Playback Error",
        description: "Failed to play the recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(recordingUrl!);
      if (!response.ok) throw new Error('Failed to download recording');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-recording-${call.id}.wav`; // or .mp3 depending on your format
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Error",
        description: "Failed to download the recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const refreshUrl = async () => {
    try {
      const response = await apiClient.post(
        `/calls/${call.id}/recording/refresh-wav`
      );
      if (response.ok) {
        const newUrl = await response.text();
        setRecordingUrl(newUrl);

        // If audio element exists, update its source and play
        if (audioRef.current) {
          audioRef.current.src = newUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        throw new Error("Failed to refresh URL");
      }
    } catch (error) {
      console.error("URL refresh error:", error);
      toast({
        title: "Error",
        description: "Failed to refresh the recording URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Transcript</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recordingUrl && (
          <div className="flex items-center space-x-2 mb-4">
            <audio
              ref={audioRef}
              src={recordingUrl}
              onEnded={() => setIsPlaying(false)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPause}
              className="h-8 w-8"
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isPlaying ? "Playing" : "Paused"}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 w-8 ml-2"
            >
              <DownloadIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="h-[300px] overflow-y-auto space-y-2">
          {transcript.map((entry, index) => (
            <div key={index} className="text-sm">
              <span className="text-muted-foreground">
                {new Date(entry.timestamp).toLocaleTimeString()}:
              </span>
              <span className="ml-2">{entry.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
