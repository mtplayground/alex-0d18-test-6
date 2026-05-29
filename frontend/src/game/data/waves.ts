import type { WaveScript } from '../systems/WaveSystem';

export const openingWaveScript: WaveScript = {
  durationMs: 12_000,
  loop: true,
  spawns: [
    {
      atMs: 0,
      count: 3,
      enemy: 'straight',
      intervalMs: 420,
      xRatio: 0.22,
      xStepRatio: 0.28,
      y: -56,
    },
    {
      atMs: 2_200,
      count: 2,
      enemy: 'zigzag',
      intervalMs: 600,
      xRatio: 0.32,
      xStepRatio: 0.36,
      y: -84,
    },
    {
      atMs: 4_700,
      count: 2,
      enemy: 'dive',
      intervalMs: 760,
      xRatio: 0.75,
      xStepRatio: -0.5,
      y: -72,
    },
    {
      atMs: 8_200,
      count: 4,
      enemy: 'straight',
      intervalMs: 260,
      xRatio: 0.14,
      xStepRatio: 0.24,
      y: -56,
    },
  ],
};
