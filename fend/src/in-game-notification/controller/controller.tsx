import { useEffect, useRef, useState } from "react";
import { useGlobalWebsocket } from "../../GlobalWebsocket";
import type { MatchSnapshot } from "../../types";
import {
  getMainEquipmentImagePath,
  isMainEquipmentItem,
  mapSnapshotToLevelPlayers,
  type LevelPlayer,
  type TeamSide
} from "../repository/remote";

export type LevelNotification = {
  type: "level";
  id: string;
  playerId: string;
  playerName: string;
  teamSide: TeamSide;
  role: string;
  oldLevel: number;
  newLevel: number;
  slot: number;
};

export type EquipmentNotification = {
  type: "equipment";
  id: string;
  playerId: string;
  playerName: string;
  teamSide: TeamSide;
  role: string;
  heroId: string;
  heroImage: string;
  playerImage: string;
  itemId: string;
  itemImage: string;
  itemImages: string[];
  itemIndex: number;
  slot: number;
};

export type FirstItemNotification = {
  type: "firstItem";
  id: string;
  playerId: string;
  playerName: string;
  teamSide: TeamSide;
  role: string;
  itemId: string;
  itemImage: string;
  slot: number;
};

export type InGameNotification = LevelNotification | FirstItemNotification | EquipmentNotification;

const DISPLAY_MS = 3600;
const NOTIFICATION_LEVELS = new Set([4, 15]);

function laneKey(notification: Pick<InGameNotification, "teamSide" | "slot">) {
  return `${notification.teamSide}-${notification.slot}`;
}

function buildNotification(player: LevelPlayer, oldLevel: number): LevelNotification {
  return {
    type: "level",
    id: `${player.playerId}-${oldLevel}-${player.level}-${Date.now()}`,
    playerId: player.playerId,
    playerName: player.playerName,
    teamSide: player.teamSide,
    role: player.role,
    oldLevel,
    newLevel: player.level,
    slot: player.slot
  };
}

function shouldShowLevelNotification(level: number) {
  return NOTIFICATION_LEVELS.has(level);
}

function buildEquipmentNotification(player: LevelPlayer, itemId: string): EquipmentNotification {
  const itemImages = player.equipments
    .filter((equipment) => isMainEquipmentItem(equipment.id))
    .map((equipment) => getMainEquipmentImagePath(equipment.id))
    .slice(0, 6);

  return {
    type: "equipment",
    id: `${player.playerId}-equipment-${itemId}-${Date.now()}`,
    playerId: player.playerId,
    playerName: player.playerName,
    teamSide: player.teamSide,
    role: player.role,
    heroId: player.heroId,
    heroImage: `/Public/Heros/${player.heroId}.jpg`,
    playerImage: `/Public/Players/${player.playerId}.png`,
    itemId,
    itemImage: getMainEquipmentImagePath(itemId),
    itemImages,
    itemIndex: Math.max(0, itemImages.findIndex((itemImage) => itemImage.endsWith(`/${itemId}.png`))),
    slot: player.slot
  };
}

function buildFirstItemNotification(player: LevelPlayer, itemId: string): FirstItemNotification {
  return {
    type: "firstItem",
    id: `${player.playerId}-first-item-${itemId}-${Date.now()}`,
    playerId: player.playerId,
    playerName: player.playerName,
    teamSide: player.teamSide,
    role: player.role,
    itemId,
    itemImage: getMainEquipmentImagePath(itemId),
    slot: player.slot
  };
}

export function useInGameNotificationController() {
  const { status, message, url } = useGlobalWebsocket<MatchSnapshot>("ingame");
  const previousLevels = useRef<Map<string, number>>(new Map());
  const previousEquipments = useRef<Map<string, Set<string>>>(new Map());
  const notifiedItems = useRef<Record<string, Set<string>>>({});
  const initialized = useRef(false);
  const previewed = useRef(false);
  const queue = useRef<InGameNotification[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const [activeNotifications, setActiveNotifications] = useState<InGameNotification[]>([]);

  useEffect(() => {
    if (!message?.ok || !message.data) return;

    const players = mapSnapshotToLevelPlayers(message.data);
    const firstItemNotifications: FirstItemNotification[] = [];
    const itemNotifications: EquipmentNotification[] = [];
    const levelNotifications: LevelNotification[] = [];

    players.forEach((player) => {
      const previousLevel = previousLevels.current.get(player.playerId);
      const previousItems = previousEquipments.current.get(player.playerId) || new Set<string>();
      const currentItems = new Set(player.equipments.map((equipment) => equipment.id));
      const playerNotifiedItems = notifiedItems.current[player.playerId] || new Set<string>();

      notifiedItems.current[player.playerId] = playerNotifiedItems;

      const mainEquipments = player.equipments.filter((equipment) => isMainEquipmentItem(equipment.id));

      if (!initialized.current) {
        const firstMainItem = mainEquipments[0];
        const latestMainItem = mainEquipments[mainEquipments.length - 1];

        if (firstMainItem && !playerNotifiedItems.has(firstMainItem.id)) {
          firstItemNotifications.push(buildFirstItemNotification(player, firstMainItem.id));
        }

        if (latestMainItem && latestMainItem.id !== firstMainItem?.id) {
          itemNotifications.push(buildEquipmentNotification(player, latestMainItem.id));
        }

        mainEquipments.forEach((equipment) => playerNotifiedItems.add(equipment.id));
      } else {
        const firstNewMainItem = mainEquipments.find((equipment) => {
          const itemId = equipment.id;
          return !previousItems.has(itemId) && !playerNotifiedItems.has(itemId);
        });

        if (firstNewMainItem) {
          if (mainEquipments.length === 1) {
            firstItemNotifications.push(buildFirstItemNotification(player, firstNewMainItem.id));
          } else {
            itemNotifications.push(buildEquipmentNotification(player, firstNewMainItem.id));
          }

          playerNotifiedItems.add(firstNewMainItem.id);
        }
      }

      if (!initialized.current && !previewed.current && player.level > 0 && shouldShowLevelNotification(player.level)) {
        levelNotifications.push(buildNotification(player, Math.max(0, player.level - 1)));
      }

      if (
        initialized.current &&
        previousLevel !== undefined &&
        player.level > previousLevel &&
        shouldShowLevelNotification(player.level)
      ) {
        levelNotifications.push(buildNotification(player, previousLevel));
      }

      previousLevels.current.set(player.playerId, player.level);
      previousEquipments.current.set(player.playerId, currentItems);
    });

    initialized.current = true;
    previewed.current = true;

    const nextNotifications: InGameNotification[] = [...firstItemNotifications, ...itemNotifications, ...levelNotifications];

    if (nextNotifications.length) {
      queue.current.push(...nextNotifications);
      flushQueue();
    }
  }, [message]);

  function flushQueue() {
    setActiveNotifications((current) => {
      const busyLanes = new Set(current.map(laneKey));
      const ready: InGameNotification[] = [];
      const waiting: InGameNotification[] = [];

      queue.current.forEach((notification) => {
        const key = laneKey(notification);
        if (!busyLanes.has(key)) {
          busyLanes.add(key);
          ready.push(notification);
        } else {
          waiting.push(notification);
        }
      });

      queue.current = waiting;
      return ready.length ? [...current, ...ready] : current;
    });
  }

  useEffect(() => {
    const activeIds = new Set(activeNotifications.map((notification) => notification.id));

    activeNotifications.forEach((notification) => {
      if (timers.current.has(notification.id)) return;

      const timer = window.setTimeout(() => {
        timers.current.delete(notification.id);
        setActiveNotifications((current) => current.filter((item) => item.id !== notification.id));
        window.setTimeout(flushQueue, 80);
      }, DISPLAY_MS);

      timers.current.set(notification.id, timer);
    });

    timers.current.forEach((timer, id) => {
      if (activeIds.has(id)) return;
      window.clearTimeout(timer);
      timers.current.delete(id);
    });
  }, [activeNotifications]);

  useEffect(() => {
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current.clear();
    };
  }, []);

  const leftNotifications = activeNotifications.filter((item) => item.teamSide === "left");
  const rightNotifications = activeNotifications.filter((item) => item.teamSide === "right");

  return {
    status,
    url,
    leftNotifications,
    rightNotifications
  };
}
