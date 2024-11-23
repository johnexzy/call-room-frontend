import { ISocket } from "@/types";
import Cookies from "js-cookie";

export * from "./calls";
export * from "./analytics";
export * from "./queue";
export * from "./notifications";

export const connectSocket = (socket: ISocket) => {
  const token = Cookies.get("token");
  console.log("token", token);
  if (token) {
    socket.io.opts.extraHeaders = {
      Authorization: `Bearer ${token}`,
    };
    socket.connect();
  }
};
