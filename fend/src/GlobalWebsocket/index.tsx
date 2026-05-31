import { useEffect, useMemo, useState } from "react";
import { BACKEND_WS_BASE } from "../main/routes/apiRoutes";
import type { WsEnvelope } from "../types";
import { mapSocketMessage } from "./globalSocketDatamapper";

export type SocketStatus = "connecting" | "open" | "closed" | "error";

export function getWsUrl(endpoint: string) {
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "") || "data";
  return `${BACKEND_WS_BASE}?endpoint=${encodeURIComponent(cleanEndpoint)}`;
}

export function useGlobalWebsocket<T = unknown>(endpoint: string) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [message, setMessage] = useState<WsEnvelope<T> | null>(null);

  const url = useMemo(() => getWsUrl(endpoint), [endpoint]);

  useEffect(() => {
    let active = true;
    setStatus("connecting");
    const socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      if (!active) {
        socket.close();
        return;
      }
      setStatus("open");
      socket.send(JSON.stringify({ type: "subscribe", endpoint }));
    });
    socket.addEventListener("message", (event) => {
      if (!active) return;
      setMessage(mapSocketMessage(event.data) as WsEnvelope<T>);
    });
    socket.addEventListener("close", () => {
      if (active) setStatus("closed");
    });
    socket.addEventListener("error", () => {
      if (active) setStatus("error");
    });

    return () => {
      active = false;
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [endpoint, url]);

  return { status, message, url };
}
