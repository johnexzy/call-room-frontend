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
    