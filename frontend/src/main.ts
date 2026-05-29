import Phaser from 'phaser';
import { gameConfig } from './game/config';
import './styles.css';

const appElement = document.querySelector<HTMLElement>('#app');

if (!appElement) {
  throw new Error('Unable to mount game: #app element was not found.');
}

new Phaser.Game({
  ...gameConfig,
  parent: appElement,
});
