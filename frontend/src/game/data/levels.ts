import type { BossType } from '../entities/Boss';
import type { WaveScript } from '../systems/WaveSystem';
import {
  levelOneWaveScript,
  levelThreeWaveScript,
  levelTwoWaveScript,
} from './waves';

export type LevelConfig = {
  bossType: BossType;
  id: number;
  name: string;
  waveScript: WaveScript;
};

export const levelConfigs: LevelConfig[] = [
  {
    bossType: 'command',
    id: 1,
    name: 'Level 1',
    waveScript: levelOneWaveScript,
  },
  {
    bossType: 'command',
    id: 2,
    name: 'Level 2',
    waveScript: levelTwoWaveScript,
  },
  {
    bossType: 'command',
    id: 3,
    name: 'Level 3',
    waveScript: levelThreeWaveScript,
  },
];
