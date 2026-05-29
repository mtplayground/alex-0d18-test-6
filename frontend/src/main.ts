import Phaser from 'phaser';
import {
  registerGlobalErrorHandlers,
  renderFatalStartupError,
  reportClientError,
} from './errors/globalErrorHandlers';
import { gameConfig } from './game/config';
import './styles.css';

type E2EGlobal = typeof globalThis & {
  __alexE2EGame?: Phaser.Game;
};

registerGlobalErrorHandlers();

const startGame = (): Phaser.Game => {
  const appElement = document.querySelector<HTMLElement>('#app');

  if (!appElement) {
    throw new Error('Unable to mount game: #app element was not found.');
  }

  return new Phaser.Game({
    ...gameConfig,
    parent: appElement,
  });
};

try {
  const game = startGame();

  if (import.meta.env.VITE_E2E === '1') {
    (globalThis as E2EGlobal).__alexE2EGame = game;
  }
} catch (error) {
  reportClientError('bootstrap', error);
  renderFatalStartupError(document.querySelector<HTMLElement>('#app'));
}
