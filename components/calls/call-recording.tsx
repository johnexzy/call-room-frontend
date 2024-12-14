import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { axiosClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, DownloadIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CallDetails } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";

interface CallRecordingProps {
  call: CallDetails;
}

interface RecordingState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

interface DownloadProgressEvent {
  loaded: number;
  total?: number;
}

export function CallRecording({ call }: Readonly<CallRecordingProps>) {
  const transcript = call.transcripts;
  const [recordingState, setRecordingState] = useState<RecordingState>({
    url: call.recordingUrl,
    isLoading: false,
    error: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setRecordingState((prev) => ({ ...prev, url: call.recordingUrl }));
  }, [call.recordingUrl]);

  const handleError = (error: unknown, action: string) => {
    console.error(`${action} error:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    toast({
      title: `${action} Error`,
      description: errorMessage,
      variant: "destructive",
    });
    setRecordingState((prev) => ({ ...prev, error: errorMessage }));
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || recordingState.isLoading) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setRecordingState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));
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
      handleError(error, "Playback");
    } finally {
      setRecordingState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setRecordingState((prev) => ({ ...prev, error: null }));

      const response = await axiosClient.get<Blob>(
        `/calls/${call.id}/recording?download=true`,
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent: DownloadProgressEvent) => {
            const progress = progressEvent.total
              ? (progressEvent.loaded / progressEvent.total) * 100
              : 0;
            setDownloadProgress(progress);
          },
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], { type: "audio/wav" });
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-recording-${call.id}.wav`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError(error, "Download");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const refreshUrl = async () => {
    try {
      setIsRefreshing(true);
      setRecordingState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await axiosClient.post<{ url: string }>(
        `/calls/${call.id}/recording/refresh`
      );
      const newUrl = response.data.url;
      setRecordingState((prev) => ({ ...prev, url: newUrl }));

      // If audio element exists, update its source and play
      if (audioRef.current) {
        audioRef.current.src = newUrl;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      handleError(error, "URL refresh");
    } finally {
      setIsRefreshing(false);
      setRecordingState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const isLoading = recordingState.isLoading || isDownloading || isRefreshing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Recording & Transcript</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recordingState.error && (
          <div className="text-sm text-red-500 mb-2">
            {recordingState.error}
          </div>
        )}

        {recordingState.url && (
          <div className="flex items-center space-x-2 mb-4">
            <audio
              ref={audioRef}
              src={recordingState.url}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                setIsPlaying(false);
                setRecordingState((prev) => ({
                  ...prev,
                  error: "Failed to load audio. Try refreshing the URL.",
                }));
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isLoading ? (
                <Spinner className="h-4 w-4" />
              ) : isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px]">
              {isLoading ? "Loading..." : isPlaying ? "Playing" : "Paused"}
            </span>
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                disabled={isLoading}
                className="h-8 w-8"
              >
                {isDownloading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
              </Button>
              {isDownloading && (
                <div className="flex-1">
                  <Progress value={downloadProgress} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(downloadProgress)}%
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshUrl}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        )}

        <div className="h-[300px] overflow-y-auto space-y-2 border rounded-md p-4">
          {transcript.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No transcript available yet
            </div>
          ) : (
            transcript.map((entry, index) => (
              <div key={index} className="text-sm">
                <span className="text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString()}:
                </span>
                <span className="ml-2">{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
