import * as migration_20260918_092331_initial from './20260918_092331_initial'
import * as migration_20260918_103137_home_design from './20260918_103137_home_design'
import * as migration_20260918_223130_motor_tpl_design from './20260918_223130_motor_tpl_design'
import * as migration_20260919_093315_travel_home_pages from './20260919_093315_travel_home_pages'

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
  {
    up: migration_20260918_223130_motor_tpl_design.up,
    down: migration_20260918_223130_motor_tpl_design.down,
    name: '20260918_223130_motor_tpl_design',
  },
  {
    up: migration_20260919_093315_travel_home_pages.up,
    down: migration_20260919_093315_travel_home_pages.down,
    name: '20260919_093315_travel_home_pages',
  },
]
