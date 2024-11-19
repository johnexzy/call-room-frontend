"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";
import { WebRTCService } from "@/lib/webrtc-service";
import { FeedbackForm } from "@/components/feedback/feedback-form";

interface CallInterfaceProps {
  callId: string;
  onEndCall: () => void;
}

export function CallInterface({ callId, onEndCall }: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webRTCService = useRef<WebRTCService | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    initializeCall();
    return () => {
      webRTCService.current?.disconnect();
    };
  }, [callId]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      webRTCService.current = new WebRTCService(callId);
      const peerConnection = await webRTCService.current.initializePeerConnection(stream);

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      await webRTCService.current.createOffer();
    } catch (error) {
      console.error("Failed to initialize call:", error);
    }
  };

  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleEndCall = async () => {
    await onEndCall();
    setShowFeedback(true);
  };

  if (showFeedback) {
    return <FeedbackForm callId={callId} />;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm">
              You
            </div>
          </div>
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm">
              Customer
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className={isMuted ? "bg-red-100" : ""}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
            className={!isVideoEnabled ? "bg-red-100" : ""}
          >
            {isVideoEnabled ? <Video /> : <VideoOff />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndCall}
            className="bg-red-500 hover:bg-red-600"
          >
            <Phone className="rotate-[135deg]" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
