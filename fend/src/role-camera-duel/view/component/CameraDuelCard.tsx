import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { RoleCameraPlayer } from "../../repository/remote";
import { DUMMY_ROTATION_PLAYERS, buildCameraViewUrl, ROTATION_INTERVAL_MS } from "./cameraconfig";
import styles from "../view.module.css";

type Props = {
  player: RoleCameraPlayer | null;
  side: "left" | "right";
};

/* GLOBAL SYNC TIMER: both left and right rotate together */
let globalIndex = 0;
let globalTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

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

function WhepCamera({
  uid,
  playerName,
  visible,
  onReady,
  onError,
}: {
  uid: string;
  playerName: string;
  visible: boolean;
  onReady?: () => void;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    let stopped = false;

    async function start() {
      try {
        pc = new RTCPeerConnection();

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
          if (stopped || !videoRef.current) return;

          videoRef.current.srcObject = event.streams[0];

          videoRef.current.onplaying = () => {
            if (!stopped) onReady?.();
          };
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(buildCameraViewUrl(uid), {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
          },
          body: offer.sdp || "",
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

      pc?.close();
    };
  }, [uid]);

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