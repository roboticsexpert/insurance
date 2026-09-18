import * as migration_20260918_092331_initial from './20260918_092331_initial'
import * as migration_20260918_103137_home_design from './20260918_103137_home_design'

export const migrations = [
  {
    up: migration_20260918_092331_initial.up,
    down: migration_20260918_092331_initial.down,
    name: '20260918_092331_initial',
  },
  {
    up: migration_20260918_103137_home_design.up,
    down: migration_20260918_103137_home_design.down,
    name: '20260918_103137_home_design',
  },
]
