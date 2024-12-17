"use client";

import { toast } from "@/hooks/use-toast";
import { AgoraVoiceChat } from "./agora-voice-chat";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { JoinConfig } from "@/types";

interface CallInterfaceProps {
  callId: string;
  targetUserId: string;
  isRep: boolean;
  onEndCall?: () => void;
  onTranscriptReceived?: (userId: string, transcript: string) => void;
}


export default function CallInterface({
  callId,
  targetUserId,
  isRep,
  onEndCall,
  onTranscriptReceived,
}: Readonly<CallInterfaceProps>) {
  const [joinConfig, setJoinConfig] = useState<JoinConfig>();

  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await apiClient.get(`/calls/${callId}/token`);
        if (!response.ok) throw new Error("Failed to get token");
        const { token, uid, channel } = await response.json();
  
        if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
          throw new Error("Agora App ID not configured");
        }
        console.clear();
        console.log("token", token);
        console.log("uid", uid);
  
        setJoinConfig({
          appid: process.env.NEXT_PUBLIC_AGORA_APP_ID,
          channel,
          token,
          uid,
        });
      } catch (error) {
        console.error("Failed to get token:", error);
        toast({
          title: "Error",
          description: "Failed to get connection token",
          variant: "destructive",
        });
      }
    };
    getToken();
  }, [callId]);

  return (
    <>
      {joinConfig ? (
        <AgoraVoiceChat
          callId={callId}
          isRep={isRep}
          userId={targetUserId}
          onCallEnd={onEndCall}
          onTranscriptReceived={onTranscriptReceived}
          joinConfig={joinConfig}
        />
      ) : null}
    </>
  );
}
