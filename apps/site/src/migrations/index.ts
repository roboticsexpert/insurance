import * as migration_20260918_092331_initial from './20260918_092331_initial';

export const migrations = [
  {
    up: migration_20260918_092331_initial.up,
    down: migration_20260918_092331_initial.down,
    name: '20260918_092331_initial'
  },
];
