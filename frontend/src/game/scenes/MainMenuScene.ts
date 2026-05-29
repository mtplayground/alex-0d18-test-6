import Phaser from 'phaser';
import { AssetKeys, SceneKeys } from '../keys';
import { SaveSystem } from '../systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MainMenu);
  }

  create(): void {
    const { width, height } = this.scale;
    const saveData = new SaveSystem().read();
    const startGame = (): void => {
      this.scene.start(SceneKeys.Game);
    };
    const openLeaderboard = (): void => {
      this.scene.start(SceneKeys.Leaderboard);
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

    this.add
      .text(
        width / 2,
        height * 0.56,
        `BEST SCORE ${saveData.bestScore.toString().padStart(6, '0')}`,
        {
          color: '#fef3c7',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.61,
        `UNLOCKED LEVEL ${saveData.highestLevel}`,
        {
          color: '#e0f2fe',
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.createButton(width / 2, height * 0.72, 'START', startGame);
    this.createButton(width / 2, height * 0.83, 'LEADERBOARD', openLeaderboard);

    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-L', openLeaderboard);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): void {
    const button = this.add
      .text(x, y, label, {
        backgroundColor: '#0f766e',
        color: '#ffffff',
        fixedWidth: 220,
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        padding: { x: 18, y: 12 },
      })
      .setAlign('center')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setBackgroundColor('#0d9488');
    });

    button.on('pointerout', () => {
      button.setBackgroundColor('#0f766e');
    });

    button.on('pointerdown', onClick);
  }
}
