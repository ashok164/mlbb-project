import type { LiveAlertEvent } from "../../types";

export type AlertVisual = LiveAlertEvent & {
  title: string;
};

function titleFromTrigger(trigger: LiveAlertEvent["trigger"]) {
  const titleMap: Record<LiveAlertEvent["trigger"], string> = {
    single_kill: "KILL",
    first_blood: "FIRST BLOOD",
    double_kill: "DOUBLE KILL",
    triple_kill: "TRIPLE KILL",
    maniac: "MANIAC",
    savage: "SAVAGE",
    turtle_slain: "TURTLE SLAIN",
    lord_slain: "LORD SLAIN",
    turtle_spawn: "TURTLE SPAWN",
    lord_spawn: "LORD SPAWN",
    wipeout: "WIPEOUT",
    legendary: "LEGENDARY"
  };

  return titleMap[trigger];
}

export function mapAlertVisual(alert?: LiveAlertEvent | null): AlertVisual | null {
  if (!alert) return null;
  return {
    ...alert,
    title: titleFromTrigger(alert.trigger)
  };
}
