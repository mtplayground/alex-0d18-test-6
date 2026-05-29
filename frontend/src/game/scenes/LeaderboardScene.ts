import Phaser from 'phaser';
import { getLeaderboard, type LeaderboardEntry } from '../../api/scores';
import { AssetKeys, SceneKeys } from '../keys';

const LEVELS = [1, 2, 3] as const;
const LEADERBOARD_LIMIT = 50;
const FIRST_ROW_Y = 222;
const ROW_HEIGHT = 14;
const ROWS_PER_COLUMN = 25;
type LeaderboardLevel = (typeof LEVELS)[number];

export class LeaderboardScene extends Phaser.Scene {
  private selectedLevel: LeaderboardLevel = LEVELS[0];
  private loadRequestId = 0;
  private levelButtons: Phaser.GameObjects.Text[] = [];
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Leaderboard);
  }

  create(): void {
    const { width, height } = this.scale;

    this.loadRequestId = 0;

    this.add
      .image(width / 2, height / 2, AssetKeys.MenuBackground)
      .setDisplaySize(width, height);
    this.add.rectangle(0, 0, width, height, 0x020617, 0.56).setOrigin(0, 0);

    this.add
      .text(width / 2, 62, 'LEADERBOARD', {
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 104, 'TOP 50 BY LEVEL', {
        color: '#bae6fd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.createLevelButtons(width);
    this.createHeaders();
    this.createNavigation(width, height);
    this.bindKeyboardControls();

    void this.loadLeaderboard();
  }

  private bindKeyboardControls(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      return;
    }

    const selectPreviousLevel = (): void => {
      this.selectAdjacentLevel(-1);
    };
    const selectNextLevel = (): void => {
      this.selectAdjacentLevel(1);
    };
    const openMainMenu = (): void => {
      this.scene.start(SceneKeys.MainMenu);
    };

    keyboard.on('keydown-LEFT', selectPreviousLevel);
    keyboard.on('keydown-RIGHT', selectNextLevel);
    keyboard.once('keydown-ESC', openMainMenu);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-LEFT', selectPreviousLevel);
      keyboard.off('keydown-RIGHT', selectNextLevel);
      keyboard.off('keydown-ESC', openMainMenu);
    });
  }

  private createLevelButtons(width: number): void {
    const spacing = 112;
    const startX = width / 2 - spacing;

    this.levelButtons = LEVELS.map((level, index) => {
      const button = this.add
        .text(startX + index * spacing, 154, `LEVEL ${level}`, {
          backgroundColor: '#164e63',
          color: '#e0f2fe',
          fixedWidth: 96,
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          padding: { x: 10, y: 9 },
        })
        .setAlign('center')
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on('pointerdown', () => {
        this.selectLevel(level);
      });

      return button;
    });

    this.updateLevelButtons();
  }

  private createHeaders(): void {
    this.add
      .text(34, 194, 'RANK  NAME          SCORE', {
        color: '#fef3c7',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(264, 194, 'RANK  NAME          SCORE', {
        color: '#fef3c7',
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
  }

  private createNavigation(width: number, height: number): void {
    this.statusText = this.add
      .text(width / 2, height - 86, '', {
        color: '#bae6fd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);

    this.createButton(width / 2 - 92, height - 40, 'BACK', () => {
      this.scene.start(SceneKeys.MainMenu);
    });
    this.createButton(width / 2 + 92, height - 40, 'RETRY', () => {
      void this.loadLeaderboard();
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        backgroundColor: '#0f766e',
        color: '#ffffff',
        fixedWidth: 148,
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        padding: { x: 14, y: 10 },
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

    return button;
  }

  private selectAdjacentLevel(direction: -1 | 1): void {
    const currentIndex = LEVELS.indexOf(this.selectedLevel);
    const nextIndex =
      (currentIndex + direction + LEVELS.length) % LEVELS.length;

    this.selectLevel(LEVELS[nextIndex]);
  }

  private selectLevel(level: LeaderboardLevel): void {
    if (this.selectedLevel === level) {
      return;
    }

    this.selectedLevel = level;
    this.updateLevelButtons();
    void this.loadLeaderboard();
  }

  private updateLevelButtons(): void {
    this.levelButtons.forEach((button, index) => {
      const isSelected = LEVELS[index] === this.selectedLevel;

      button.setBackgroundColor(isSelected ? '#facc15' : '#164e63');
      button.setColor(isSelected ? '#0f172a' : '#e0f2fe');
    });
  }

  private async loadLeaderboard(): Promise<void> {
    const level = this.selectedLevel;
    const requestId = ++this.loadRequestId;

    this.clearRows();
    this.setStatus(`Loading level ${level} scores...`, '#bae6fd');

    try {
      const entries = await getLeaderboard({
        level,
        limit: LEADERBOARD_LIMIT,
      });

      if (!this.isCurrentLoad(requestId, level)) {
        return;
      }

      this.renderEntries(entries);
    } catch (error) {
      if (!this.isCurrentLoad(requestId, level)) {
        return;
      }

      this.setStatus(this.getErrorMessage(error), '#fecdd3');
    }
  }

  private isCurrentLoad(requestId: number, level: LeaderboardLevel): boolean {
    return requestId === this.loadRequestId && level === this.selectedLevel;
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    this.clearRows();

    if (entries.length === 0) {
      this.setStatus('No scores for this level yet.', '#fbbf24');
      return;
    }

    this.setStatus(`Showing ${entries.length} scores.`, '#bbf7d0');

    entries.slice(0, LEADERBOARD_LIMIT).forEach((entry, index) => {
      const column = index < ROWS_PER_COLUMN ? 0 : 1;
      const row = index % ROWS_PER_COLUMN;
      const x = column === 0 ? 34 : 264;
      const y = FIRST_ROW_Y + row * ROW_HEIGHT;
      const text = this.add
        .text(x, y, this.formatEntry(entry), {
          color: index < 3 ? '#fef08a' : '#e2e8f0',
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
        })
        .setOrigin(0, 0.5);

      this.rowTexts.push(text);
    });
  }

  private formatEntry(entry: LeaderboardEntry): string {
    const rank = entry.rank.toString().padStart(2, ' ');
    const nickname = this.truncate(entry.nickname, 12).padEnd(12, ' ');
    const score = entry.score.toString().padStart(6, ' ');

    return `${rank}. ${nickname} ${score}`;
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return value.slice(0, maxLength - 3) + '...';
  }

  private clearRows(): void {
    this.rowTexts.forEach((text) => {
      text.destroy();
    });
    this.rowTexts = [];
  }

  private setStatus(message: string, color: string): void {
    this.statusText?.setText(message);
    this.statusText?.setColor(color);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load leaderboard.';
  }
}
