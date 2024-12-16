export const WS_NAMESPACES = {
  CALLS: 'calls',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  QUEUE: 'queue',
  TRANSCRIPTION: 'transcription',
} as const;

export const WS_EVENTS = {
  CALLS: {
    CALL_ASSIGNED: 'call_assigned',
    CALL_ENDED: 'call_ended',
    CALL_UPDATE: 'call_update',
    VOICE_DATA: 'voiceData',
  },
  NOTIFICATIONS: {
    NEW_NOTIFICATION: 'new_notification',
  },
  ANALYTICS: {
    METRICS_UPDATE: 'metrics_update',
  },
  QUEUE: {
    QUEUE_UPDATE: 'queue_update',
    POSITION_UPDATE: 'position_update',
    YOUR_TURN: 'your_turn',
  },
  TRANSCRIPTION: {
    TRANSCRIPTION_UPDATE: 'transcription:update',
    AUDIO_DATA: 'transcription:audio_data',
    ERROR: 'transcription:error',
    TRANSCRIPT: 'transcription:transcript',
  },
} as const;
