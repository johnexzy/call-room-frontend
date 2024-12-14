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


interface RecordingResponse {
  url: string;
  filename: string;
  contentType: string;
  isDownload: boolean;
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

      // Get the direct download URL
      const response = await axiosClient.get<RecordingResponse>(
        `/calls/${call.id}/recording?download=true&longLived=true`
      );

      if (!response.data?.url) {
        throw new Error("No download URL received");
      }

      // Start the download using the direct URL
      const downloadResponse = await fetch(response.data.url, {
        headers: {
          Accept: response.data.contentType,
        },
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download: ${downloadResponse.statusText}`);
      }

      // Get the total size for progress calculation
      const totalBytes = parseInt(
        downloadResponse.headers.get("content-length") || "0",
        10
      );
      let downloadedBytes = 0;

      // Create a ReadableStream from the response
      const reader = downloadResponse.body?.getReader();
      if (!reader) {
        throw new Error("Failed to initialize download stream");
      }

      // Create an array to store chunks
      const chunks: Uint8Array[] = [];

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value);
          downloadedBytes += value.length;

          // Calculate and update progress
          if (totalBytes > 0) {
            const progress = Math.round((downloadedBytes / totalBytes) * 100);
            setDownloadProgress(progress);

            // Update download status message
            const downloaded = (downloadedBytes / (1024 * 1024)).toFixed(2);
            const total = (totalBytes / (1024 * 1024)).toFixed(2);
            toast({
              title: "Downloading...",
              description: `${downloaded}MB of ${total}MB (${progress}%)`,
              duration: 2000,
            });
          }
        }
      }

      // Combine chunks into a single Uint8Array
      const allChunks = new Uint8Array(downloadedBytes);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Create blob and trigger download
      const blob = new Blob([allChunks], { type: response.data.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      const fileSizeMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
      toast({
        title: "Success",
        description: `Recording (${fileSizeMB}MB) downloaded successfully`,
      });
    } catch (error) {
      handleError(error, "Download");

      // More detailed error handling
      let errorMessage = "Please try refreshing the URL and downloading again";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Download timed out. Please try again.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        }
      }

      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
