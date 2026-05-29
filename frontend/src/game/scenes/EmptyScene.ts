import Phaser from 'phaser';

export class EmptyScene extends Phaser.Scene {
  constructor() {
    super('EmptyScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1020');
  }
}
