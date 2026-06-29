import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { RoleCameraPlayer } from "../../repository/remote";
import { DUMMY_ROTATION_PLAYERS, buildCameraViewUrl, ROTATION_INTERVAL_MS } from "./cameraConfig";
import styles from "../view.module.css";

type Props = {
  player: RoleCameraPlayer | null;
  side: "left" | "right";
};

/* GLOBAL SYNC TIMER: both left and right rotate together */
let globalIndex = 0;
let globalTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();
const ICE_GATHERING_TIMEOUT_MS = 700;

function subscribeRotation(listener: () => void) {
  listeners.add(listener);

  if (!globalTimer) {
    globalTimer = setInterval(() => {
      globalIndex += 1;
      listeners.forEach((fn) => fn());
    }, ROTATION_INTERVAL_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && globalTimer) {
      clearInterval(globalTimer);
      globalTimer = null;
    }
  };
}

function getRotationSnapshot() {
  return globalIndex;
}

function waitForIceGatheringComplete(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", handleIceGatheringStateChange);
      resolve();
    }, ICE_GATHERING_TIMEOUT_MS);

    function handleIceGatheringStateChange() {
      if (pc.iceGatheringState !== "complete") return;

      window.clearTimeout(timeoutId);
      pc.removeEventListener("icegatheringstatechange", handleIceGatheringStateChange);
      resolve();
    }

    pc.addEventListener("icegatheringstatechange", handleIceGatheringStateChange);
  });
}

async function readIceServers(endpoint: string): Promise<RTCIceServer[]> {
  const response = await fetch(endpoint, { method: "OPTIONS" });
  const rawLinks = response.headers.get("Link");
  if (!rawLinks) return [];

  return rawLinks.split(",").reduce<RTCIceServer[]>((servers, part) => {
    const match = part.match(/<([^>]+)>;\s*rel="ice-server"(.*)/i);
    if (!match) return servers;

    const [, url, attributes] = match;
    const username = attributes.match(/username="([^"]+)"/i)?.[1];
    const credential = attributes.match(/credential="([^"]+)"/i)?.[1];

    servers.push({
      urls: [url],
      username,
      credential,
    });

    return servers;
  }, []);
}

function WhepCamera({
  uid,
  viewUrl,
  playerName,
  visible,
  onReady,
  onError,
}: {
  uid: string;
  viewUrl?: string;
  playerName: string;
  visible: boolean;
  onReady?: () => void;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraViewUrl = useMemo(() => normalizeCameraViewUrl(viewUrl, uid), [viewUrl, uid]);

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    let mediaStream: MediaStream | null = null;
    let stopped = false;

    async function start() {
      try {
        const iceServers = await readIceServers(cameraViewUrl);
        pc = new RTCPeerConnection({ iceServers });
        mediaStream = new MediaStream();

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
          if (stopped || !videoRef.current) return;

          mediaStream?.addTrack(event.track);

          const markReady = async () => {
            if (stopped || !videoRef.current) return;

            try {
              await videoRef.current.play();
            } catch {
              // The element is muted, so autoplay should usually pass. Keep the stream attached either way.
            }

            if (!stopped) onReady?.();
          };

          if (event.track.kind === "video") {
            videoRef.current.addEventListener("loadeddata", markReady, { once: true });
            void markReady();
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGatheringComplete(pc);

        const response = await fetch(cameraViewUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
          },
          body: pc.localDescription?.sdp || "",
        });

        if (!response.ok) {
          throw new Error(`WHEP endpoint error: ${response.status}`);
        }

        const answer = await response.text();

        if (!stopped) {
          await pc.setRemoteDescription({
            type: "answer",
            sdp: answer,
          });
        }
      } catch (error) {
        console.error("WHEP camera error:", uid, error);
        if (!stopped) onError?.();
      }
    }

    start();

    return () => {
      stopped = true;

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      mediaStream?.getTracks().forEach((track) => track.stop());
      pc?.close();
    };
  }, [uid, cameraViewUrl]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      controls={false}
      title={playerName}
      className={styles.videoFrame}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease-in-out",
        pointerEvents: "none",
        zIndex: visible ? 3 : 1,
      }}
    />
  );
}

function normalizeCameraViewUrl(cameraLink: string | undefined, uid: string) {
  const cleanLink = String(cameraLink || "").trim();
  if (!cleanLink) return buildCameraViewUrl(uid);

  try {
    const parsedUrl = new URL(cleanLink);
    const joinId = parsedUrl.pathname === "/join" ? parsedUrl.searchParams.get("id") : "";
    if (joinId) {
      return buildCameraViewUrl(joinId);
    }
  } catch {
    // Not a full URL. Fall through to the known endpoint checks.
  }

  if (cleanLink.includes("/whip")) {
    return cleanLink.replace("/whip", "/whep");
  }

  if (cleanLink.includes("/whep")) {
    return cleanLink;
  }

  return buildCameraViewUrl(uid);
}

export function CameraDuelCard({ player: livePlayer, side }: Props) {
  const configList = DUMMY_ROTATION_PLAYERS[side];

  const rotationTick = useSyncExternalStore(
    subscribeRotation,
    getRotationSnapshot,
    getRotationSnapshot
  );

  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, boolean>>({});
  const [liveErrored, setLiveErrored] = useState(false);

  useEffect(() => {
    setLiveErrored(false);
  }, [livePlayer?.uid]);

  const isUsingFallback = !livePlayer || liveErrored;

  const visibleIndex = useMemo(() => {
    if (!configList.length) return 0;
    return rotationTick % configList.length;
  }, [rotationTick, configList.length]);

  const activePlayer = useMemo(() => {
    if (!isUsingFallback && livePlayer) return livePlayer;
    return configList[visibleIndex];
  }, [isUsingFallback, livePlayer, configList, visibleIndex]);

  if (!activePlayer) return null;

  const kda = activePlayer.kda?.split("/") || [];

  return (
    <article className={`${styles.card} ${side === "right" ? styles.rightCard : styles.leftCard}`}>
      <div
        className={styles.mediaFrame}
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          aspectRatio: "16 / 9",
        }}
      >
        <div
          className={styles.fallbackMedia}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          <img
            alt={activePlayer.name}
            src={activePlayer.playerImage}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {!isUsingFallback && livePlayer?.uid && (
          <WhepCamera
            key={`live-${side}-${livePlayer.uid}`}
            uid={livePlayer.uid}
            viewUrl={livePlayer.cameraLink}
            playerName={livePlayer.name}
            visible={!liveErrored}
            onReady={() => {}}
            onError={() => setLiveErrored(true)}
          />
        )}

        {isUsingFallback &&
          configList.map((p, index) => {
            const isActive = index === visibleIndex;
            const isReady = readyMap[p.uid];
            const hasError = errorMap[p.uid];

            return (
              <WhepCamera
                key={`stack-${side}-${p.uid}`}
                uid={p.uid}
                viewUrl={p.cameraLink}
                playerName={p.name}
                visible={isActive && isReady && !hasError}
                onReady={() =>
                  setReadyMap((prev) => ({
                    ...prev,
                    [p.uid]: true,
                  }))
                }
                onError={() =>
                  setErrorMap((prev) => ({
                    ...prev,
                    [p.uid]: true,
                  }))
                }
              />
            );
          })}
      </div>

      <div className={styles.namePlate}>
        {side === "left" && (
          <img
            alt={activePlayer.role}
            className={styles.roleImage}
            src={activePlayer.roleImage}
          />
        )}

        <strong>{activePlayer.name}</strong>

        {side === "right" && (
          <img
            alt={activePlayer.role}
            className={styles.roleImage}
            src={activePlayer.roleImage}
          />
        )}

        <span className={styles.teamSide}>
          {side === "left" ? "LEFT" : "RIGHT"}
        </span>
      </div>

      <div className={styles.infoPanel}>
        <div className={styles.heroRail}>
          <img
            alt={`${activePlayer.name} hero`}
            className={styles.heroImage}
            src={activePlayer.heroImage || activePlayer.playerImage}
          />
        </div>

        <div className={styles.kdaPanel}>
          <div className={styles.kdaGrid}>
            <span>K</span>
            <strong>{kda[0]?.trim() || "0"}</strong>

            <span>D</span>
            <strong>{kda[1]?.trim() || "0"}</strong>

            <span>A</span>
            <strong>{kda[2]?.trim() || "0"}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
