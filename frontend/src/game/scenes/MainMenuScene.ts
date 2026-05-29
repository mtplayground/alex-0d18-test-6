import Phaser from 'phaser';
import { AssetKeys, SceneKeys } from '../keys';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MainMenu);
  }

  create(): void {
    const { width, height } = this.scale;
    const startGame = (): void => {
      this.scene.start(SceneKeys.Game);
    };

    this.add
      .image(width / 2, height / 2, AssetKeys.MenuBackground)
      .setDisplaySize(width, height);

    this.add
      .image(width / 2, height * 0.26, AssetKeys.MenuEmblem)
      .setScale(0.72);

    this.add
      .text(width / 2, height * 0.43, 'MAIN MENU', {
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.5, 'Ready for launch', {
        color: '#bae6fd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    const startButton = this.add
      .text(width / 2, height * 0.64, 'START', {
        backgroundColor: '#0f766e',
        color: '#ffffff',
        fixedWidth: 180,
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        padding: { x: 18, y: 12 },
      })
      .setAlign('center')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setBackgroundColor('#0d9488');
    });

    startButton.on('pointerout', () => {
      startButton.setBackgroundColor('#0f766e');
    });

    startButton.on('pointerdown', startGame);
    this.input.keyboard?.once('keydown-ENTER', startGame);
  }
}
