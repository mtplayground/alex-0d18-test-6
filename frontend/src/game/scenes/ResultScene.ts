import Phaser from 'phaser';
import { submitScore } from '../../api/scores';
import { AssetKeys, SceneKeys } from '../keys';
import type { RunOutcome, RunResult } from '../state/GameState';
import type { SaveData } from '../systems/SaveSystem';
import { SaveSystem } from '../systems/SaveSystem';

type ResultSceneData = Partial<RunResult>;
type SubmissionState = 'idle' | 'submitting' | 'submitted';

const DEFAULT_OUTCOME: RunOutcome = 'game-over';
const MAX_NICKNAME_LENGTH = 16;
const MIN_NICKNAME_LENGTH = 1;

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

  private nicknameInput?: Phaser.GameObjects.DOMElement;
  private submitButton?: Phaser.GameObjects.Text;
  private submitStatusText?: Phaser.GameObjects.Text;
  private submissionState: SubmissionState = 'idle';

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
    this.submissionState = 'idle';
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
      .text(width / 2, height * 0.2, title, {
        color: accentColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.31, `SCORE ${this.formatScore()}`, {
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.39, this.getProgressText(), {
        color: '#bae6fd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.46, this.getRecordText(), {
        color: '#fef3c7',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.createScoreSubmission(width, height);

    this.createButton(width / 2, height * 0.82, 'RESTART', () => {
      this.scene.start(SceneKeys.Game);
    });

    this.createButton(width / 2, height * 0.92, 'MENU', () => {
      this.scene.start(SceneKeys.MainMenu);
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start(SceneKeys.MainMenu);
    });
  }

  private createScoreSubmission(width: number, height: number): void {
    this.add
      .text(width / 2, height * 0.525, 'NICKNAME', {
        color: '#cbd5e1',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const input = document.createElement('input');
    input.autocomplete = 'name';
    input.maxLength = MAX_NICKNAME_LENGTH;
    input.placeholder = 'Enter nickname';
    input.spellcheck = false;
    input.type = 'text';
    input.style.background = '#f8fafc';
    input.style.border = '2px solid #38bdf8';
    input.style.borderRadius = '4px';
    input.style.boxSizing = 'border-box';
    input.style.color = '#0f172a';
    input.style.font = 'bold 18px Arial, sans-serif';
    input.style.height = '44px';
    input.style.outline = 'none';
    input.style.padding = '0 12px';
    input.style.textAlign = 'center';
    input.style.width = '220px';

    input.addEventListener('keydown', (event) => {
      event.stopPropagation();

      if (event.key === 'Enter') {
        event.preventDefault();
        void this.handleSubmitScore();
      }
    });

    this.nicknameInput = this.add
      .dom(width / 2, height * 0.585, input)
      .setOrigin(0.5);

    this.submitButton = this.createButton(
      width / 2,
      height * 0.675,
      'SUBMIT SCORE',
      () => {
        void this.handleSubmitScore();
      },
    );

    this.submitStatusText = this.add
      .text(width / 2, height * 0.74, 'Submit your score to see your rank.', {
        color: '#bae6fd',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    input.focus();
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

    return button;
  }

  private async handleSubmitScore(): Promise<void> {
    if (this.submissionState !== 'idle') {
      return;
    }

    const nickname = this.getNickname();

    if (nickname.length < MIN_NICKNAME_LENGTH) {
      this.setSubmissionStatus(
        'Enter a nickname before submitting.',
        '#fbbf24',
      );
      return;
    }

    this.setSubmissionState('submitting');
    this.setSubmissionStatus('Submitting score...', '#bae6fd');

    try {
      const highestLevel = this.getSubmissionLevel();
      const result = await submitScore({
        highestLevel,
        level: highestLevel,
        nickname,
        score: this.result.score,
      });

      this.setSubmissionState('submitted');

      if (result.rank) {
        this.setSubmissionStatus(`Submitted. Rank #${result.rank}.`, '#bbf7d0');
      } else {
        this.setSubmissionStatus('Submitted. Rank pending.', '#bbf7d0');
      }
    } catch (error) {
      this.setSubmissionState('idle');
      this.setSubmissionStatus(this.getSubmissionError(error), '#fecdd3');
    }
  }

  private getNickname(): string {
    const node = this.nicknameInput?.node;

    if (!(node instanceof HTMLInputElement)) {
      return '';
    }

    return node.value.trim().slice(0, MAX_NICKNAME_LENGTH);
  }

  private setSubmissionState(state: SubmissionState): void {
    this.submissionState = state;

    const disabled = state !== 'idle';
    const node = this.nicknameInput?.node;

    if (node instanceof HTMLInputElement) {
      node.disabled = disabled;
    }

    if (!this.submitButton) {
      return;
    }

    this.submitButton.disableInteractive();

    if (state === 'idle') {
      this.submitButton.setInteractive({ useHandCursor: true });
      this.submitButton.setAlpha(1);
      this.submitButton.setText('SUBMIT SCORE');
      return;
    }

    this.submitButton.setAlpha(0.72);
    this.submitButton.setText(
      state === 'submitting' ? 'SUBMITTING' : 'SUBMITTED',
    );
  }

  private setSubmissionStatus(message: string, color: string): void {
    this.submitStatusText?.setText(message);
    this.submitStatusText?.setColor(color);
  }

  private getSubmissionError(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Score submission failed.';
  }

  private getSubmissionLevel(): number {
    const rawLevel =
      this.result.outcome === 'victory'
        ? this.result.totalLevels
        : this.result.currentLevel;
    const maxLevel = Math.max(1, Math.floor(this.result.totalLevels));

    if (!Number.isFinite(rawLevel)) {
      return 1;
    }

    return Math.min(maxLevel, Math.max(1, Math.floor(rawLevel)));
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
