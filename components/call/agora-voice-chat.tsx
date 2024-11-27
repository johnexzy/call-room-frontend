"use client";

import {
  AgoraRTCProvider,
  useClientEvent,
//   useRTCClient,
} from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { AgoraManager } from "./agora-manager";
import { JoinConfig } from "@/types";
import { useMemo } from 'react';

interface AgoraVoiceChatProps {
  callId: string;
  userId: string;
  onCallEnd?: () => void;
  joinConfig: JoinConfig;
}

export function AgoraVoiceChat({
  callId,
  userId,
  onCallEnd,
  joinConfig,
}: Readonly<AgoraVoiceChatProps>) {
  const agoraEngine = useMemo(() => {
    const client = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });
    client.enableAudioVolumeIndicator();
    return client;
  }, []);

  useClientEvent(agoraEngine, "user-left", (user) => {
    console.log("User left:", user.uid);
    if (user.uid.toString() === userId) {
      onCallEnd?.();
    }
  });

  return (
    <AgoraRTCProvider client={agoraEngine}>
      <AgoraManager
        callId={callId}
        userId={userId}
        onCallEnd={onCallEnd}
        joinConfig={joinConfig}
      />
    </AgoraRTCProvider>
  );
}
