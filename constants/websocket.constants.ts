export const WS_NAMESPACES = {
  CALLS: 'calls',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  QUEUE: 'queue',
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
} as const; 