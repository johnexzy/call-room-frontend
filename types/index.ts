import { Socket } from "socket.io-client";

interface DefaultEventsMap {
  [event: string]: (...args: any[]) => void;
}
export type ISocket = Socket<DefaultEventsMap, DefaultEventsMap>;

export interface JoinConfig {
  appid: string;
  channel: string;
  token: string;
  uid: string;
}
    
export interface CallDetails {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  representative: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startTime: string;
  endTime?: string;
  recordingUrl: string;
  recordingStatus: string;
  status: string;
  transcripts: Array<{
    text: string;
    speaker: string;
    timestamp: string;
  }>;
}