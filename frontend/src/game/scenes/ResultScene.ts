import Phaser from 'phaser';
import { AssetKeys, SceneKeys } from '../keys';
import type { RunOutcome, RunResult } from '../state/GameState';
import type { SaveData } from '../systems/SaveSystem';
import { SaveSystem } from '../systems/SaveSystem';

type ResultSceneData = Partial<RunResult>;

const DEFAULT_OUTCOME: RunOutcome = 'game-over';

export class ResultScene extends Phaser.Scene {
  private result: RunResult = {
    currentLevel: 1,
    outcome: DEFAULT_OUTCOME,
    score: 0,
    totalLevels: 3,
  };

  private saveData: SaveData = {
    bestScore: 0,
    highestLevel: 1,
  };

  constructor() {
    super(SceneKeys.Result);
  }

  init(data: ResultSceneData): void {
    this.result = {
      currentLevel: data.currentLevel ?? 1,
      outcome: data.outcome ?? DEFAULT_OUTCOME,
      score: data.score ?? 0,
      totalLevels: data.totalLevels ?? 3,
    };
  }

  create(): void {
    const { width, height } = this.scale;
    const isVictory = this.result.outcome === 'victory';
    const title = isVictory ? 'MISSION COMPLETE' : 'GAME OVER';
    const accentColor = isVictory ? '#facc15' : '#fb7185';

    this.saveData = new SaveSystem().updateFromRun(this.result);

    this.add
      .image(width / 2, height / 2, AssetKeys.MenuBackground)
      .setDisplaySize(width, height);

    this.add.rectangle(0, 0, width, height, 0x020617, 0.44).setOrigin(0, 0);

    this.add
      .text(width / 2, height * 0.25, title, {
        color: accentColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.37, `SCORE ${this.formatScore()}`, {
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.45, this.getProgressText(), {
        color: '#bae6fd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.52, this.getRecordText(), {
        color: '#fef3c7',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.createButton(width / 2, height * 0.64, 'RESTART', () => {
      this.scene.start(SceneKeys.Game);
    });

    this.createButton(width / 2, height * 0.75, 'MENU', () => {
      this.scene.start(SceneKeys.MainMenu);
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start(SceneKeys.Game);
    });
    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start(SceneKeys.MainMenu);
    });
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
        fixedWidth: 190,
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

  private formatScore(): string {
    return this.result.score.toString().padStart(6, '0');
  }

  private getProgressText(): string {
    if (this.result.outcome === 'victory') {
      return `CLEARED ${this.result.totalLevels}/${this.result.totalLevels}`;
    }

    return `LEVEL ${this.result.currentLevel}/${this.result.totalLevels}`;
  }

  private getRecordText(): string {
    return `BEST ${this.saveData.bestScore
      .toString()
      .padStart(6, '0')} / LEVEL ${this.saveData.highestLevel}`;
  }
}
