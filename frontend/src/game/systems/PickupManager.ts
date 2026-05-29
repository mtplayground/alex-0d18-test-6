import Phaser from 'phaser';
import { Pickup, type PickupType } from '../entities/Pickup';

type DropChance = {
  chance: number;
  type: PickupType;
};

const DROP_TABLE: DropChance[] = [
  { chance: 0.14, type: 'weapon' },
  { chance: 0.12, type: 'shield' },
  { chance: 0.1, type: 'bomb' },
];

const MAX_PICKUPS = 12;

export class PickupManager {
  private readonly group: Phaser.GameObjects.Group;

  private readonly pickups: Pickup[] = [];

  constructor(scene: Phaser.Scene) {
    this.group = scene.add.group();

    for (let index = 0; index < MAX_PICKUPS; index += 1) {
      const pickup = new Pickup(scene);
      this.pickups.push(pickup);
      this.group.add(pickup);
    }
  }

  tryDrop(x: number, y: number): boolean {
    let roll = Phaser.Math.FloatBetween(0, 1);

    for (const entry of DROP_TABLE) {
      if (roll <= entry.chance) {
        return this.spawn(entry.type, x, y);
      }

      roll -= entry.chance;
    }

    return false;
  }

  spawn(type: PickupType, x: number, y: number): boolean {
    const pickup = this.pickups.find((candidate) => !candidate.active);

    if (!pickup) {
      return false;
    }

    pickup.spawn(type, x, y);
    return true;
  }

  update(deltaMs: number, bounds: Phaser.Geom.Rectangle): void {
    for (const pickup of this.pickups) {
      pickup.updatePickup(deltaMs, bounds);
    }
  }

  clearAll(): void {
    for (const pickup of this.pickups) {
      pickup.recycle();
    }
  }

  getGroup(): Phaser.GameObjects.Group {
    return this.group;
  }
}
