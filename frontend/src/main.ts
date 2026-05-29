import Phaser from 'phaser';
import { gameConfig } from './game/config';
import './styles.css';

type E2EGlobal = typeof globalThis & {
  __alexE2EGame?: Phaser.Game;
};

const appElement = document.querySelector<HTMLElement>('#app');

if (!appElement) {
  throw new Error('Unable to mount game: #app element was not found.');
}

const game = new Phaser.Game({
  ...gameConfig,
  parent: appElement,
});

if (import.meta.env.VITE_E2E === '1') {
  (globalThis as E2EGlobal).__alexE2EGame = game;
}
