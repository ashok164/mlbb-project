import type { InGameNotification } from "../../controller/controller";
import type { CSSProperties } from "react";
import styles from "../view.module.css";

type Props = {
  notification: InGameNotification;
};

export function LevelUpCard({ notification }: Props) {
  const isRight = notification.teamSide === "right";
  const roleIcon = (
    <div className={styles.roleArea}>
      <img alt={notification.role} src={`/Public/Roles/${notification.role}.png`} />
    </div>
  );

  if (notification.type === "firstItem") {
    return (
      <article className={`${styles.firstItemCard} ${isRight ? styles.rightFirstItemCard : styles.leftFirstItemCard}`}>
        <header className={styles.firstItemHeader}>{roleIcon}</header>
        <div className={styles.firstItemStripe}>{notification.playerName}</div>
        <div className={styles.firstItemContent}>
          <strong>FIRST ITEM PRIORITY</strong>
          <div className={styles.firstItemFrame}>
            <img alt={`Item ${notification.itemId}`} src={notification.itemImage} />
          </div>
        </div>
      </article>
    );
  }

  if (notification.type === "equipment") {
    const displaySlotOrder = isRight ? [2, 1, 0, 5, 4, 3] : [0, 1, 2, 3, 4, 5];
    const orderedItemImages = displaySlotOrder.map((sourceIndex) =>
      sourceIndex === notification.itemIndex ? "" : notification.itemImages[sourceIndex] || "",
    );
    const itemSlots = Array.from({ length: 6 }, (_, index) => orderedItemImages[index] || "");
    const displayItemIndex = Math.max(0, displaySlotOrder.indexOf(notification.itemIndex));
    const leftTargets = [
      { x: -150, y: -15 },
      { x: -115, y: -15 },
      { x: -76, y: -15 },
      { x: -154, y: -15 },
      { x: -115, y: -15 },
      { x: -76, y: -15 }
    ];
    const rightTargets = [
      { x: 76, y: -15 },
      { x: 115, y: -15 },
      { x: 154, y: -15 },
      { x: 76, y: 15 },
      { x: 115, y: 15 },
      { x: 154, y: 15 }
    ];
    const target = (isRight ? rightTargets : leftTargets)[displayItemIndex] || { x: 0, y: 0 };
    const flyingItemStyle = {
      "--item-travel-x": `${target.x}px`,
      "--item-travel-y": `${target.y}px`
    } as CSSProperties;

    return (
      <article className={`${styles.equipmentCard} ${isRight ? styles.rightEquipmentCard : styles.leftEquipmentCard}`}>
        <div className={styles.equipmentHero}>
          <img
            alt={`${notification.playerName} hero`}
            src={notification.heroImage}
            onError={(event) => {
              const image = event.currentTarget;
              if (image.src.endsWith(".jpg")) {
                image.src = `/Public/Heros/${notification.heroId}.png`;
              }
            }}
          />
        </div>
        <div className={styles.equipmentPlayer}>
          <img
            alt={notification.playerName}
            src={notification.playerImage}
            onError={(event) => {
              event.currentTarget.src = "/Public/Players/default.png";
            }}
          />
        </div>
        <header className={styles.equipmentHeader}>
          <img alt={notification.role} src={`/Public/Roles/${notification.role}.png`} />
        </header>
        <div className={styles.equipmentStripe}>{notification.playerName}</div>
        <div className={styles.prioritySlots}>
          {itemSlots.map((itemImage, index) => {
            return (
              <div className={styles.prioritySlot} key={`${notification.id}-${index}`}>
                {itemImage && <img alt="" src={itemImage} />}
              </div>
            );
          })}
        </div>
        <div className={styles.equipmentContent}>
          <div className={styles.itemFrame}>
            <img className={styles.finalPriorityItem} alt="" src={notification.itemImage} />
            <img className={styles.flyingItem} style={flyingItemStyle} alt={`Item ${notification.itemId}`} src={notification.itemImage} />
          </div>
        </div>
      </article>
    );
  }

  const levelText = <strong>LV.{notification.newLevel}</strong>;
  const playerText = <span>{notification.playerName}</span>;
  const nameArea = <div className={styles.nameArea}>{isRight ? <>{levelText}{playerText}</> : <>{playerText}{levelText}</>}</div>;

  return (
    <article className={`${styles.card} ${isRight ? styles.rightCard : styles.leftCard}`}>
      {isRight ? nameArea : roleIcon}
      {isRight ? roleIcon : nameArea}
    </article>
  );
}
