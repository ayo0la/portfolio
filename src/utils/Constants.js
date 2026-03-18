// Stadium dimensions
export const STADIUM = {
  PITCH_W: 105,
  PITCH_D: 68,
  BOWL_RADIUS: 80,
  BOWL_HEIGHT: 28,
  SEAT_ROWS: 22,
  SEAT_COLS: 80,
  SEAT_COUNT: 22 * 80 * 2, // two long sides
  FLOOR_Y: 0,
}

// Zone definitions
export const ZONES = {
  whoIAm:   { id: 'whoIAm',   label: 'Who I Am',  position: [0,   0, -45], radius: 18 },
  skills:   { id: 'skills',   label: 'Skills',    position: [-55, 0,   0], radius: 18 },
  projects: { id: 'projects', label: 'Projects',  position: [55,  0,   0], radius: 18 },
}

// NPC spawn data
export const NPCS = {
  ayoola:  { id: 'ayoola',  position: [0, 0, 10], color: 0xffd700, label: 'Ayoola',  role: 'Founder — MDFLD' },
  builder: { id: 'builder', position: [48, 0, 0], color: 0x00e5ff, label: 'Builder', role: 'What We Build' },
}

// Player config (kept for NPC proximity distances)
export const PLAYER = {
  HEIGHT: 1.7,
  SPEED: 14,
  ACCEL: 9,
  TURN_SPEED: 1.6,
  FRICTION: 0.82,
  BOB_FREQ: 7,
  BOB_AMP: 0.055,
  INTERACT_DISTANCE: 5,
  NPC_INTERACT_DISTANCE: 8,    // wider — car is bigger than a walking player
}

// ── Physics / Vehicle ─────────────────────────────────────────
export const PHYSICS = {
  GRAVITY:   -20,
  TIMESTEP:  1 / 60,
}

export const CAR = {
  // Chassis physics half-extents
  CHASSIS_HX:  0.85,
  CHASSIS_HY:  0.28,
  CHASSIS_HZ:  1.8,
  CHASSIS_MASS: 80,          // lighter → more responsive acceleration

  // Spawn — on pitch facing -Z (toward stadium centre)
  SPAWN_X: 0,
  SPAWN_Y: 1.2,
  SPAWN_Z: 24,

  // Wheel geometry
  WHEEL_RADIUS: 0.28,
  WHEEL_WIDTH:  0.22,

  // Wheel connection points (chassis-local, forward = -Z)
  WHEELS: [
    { x: -0.75, y: 0, z: -1.3, front: true  },   // 0 FL
    { x:  0.75, y: 0, z: -1.3, front: true  },   // 1 FR
    { x: -0.75, y: 0, z:  1.3, front: false },   // 2 RL
    { x:  0.75, y: 0, z:  1.3, front: false },   // 3 RR
  ],

  // Suspension — bouncier, planted Bruno Simon toy-car feel
  SUSP_REST_LEN:    0.32,
  SUSP_MAX_TRAVEL:  0.28,
  SUSP_STIFFNESS:   48,      // stiffer → less body roll, snappier response
  SUSP_COMPRESSION: 3.0,     // softer compression for bounce
  SUSP_RELAXATION:  2.0,     // quicker rebound
  SUSP_MAX_FORCE:   120000,

  // Friction / traction — more planted, less side-slip
  FRICTION_SLIP:  2.8,       // up from 1.8 → better traction
  SIDE_FRICTION:  1.6,       // up from 1.0 → less lateral sliding

  // Drive — punchier acceleration, cleaner braking
  ENGINE_FORCE:   900,       // more punch
  BOOST_MULT:     2.4,
  REVERSE_FORCE:  500,
  BRAKE_FORCE:    1800,      // much stronger brakes (snappy stop)
  IDLE_BRAKE:     60,        // more rolling resistance → cleaner stop
  MAX_STEER:      0.52,      // slightly wider steering arc

  // Camera rig — tighter spring, closer framing
  CAM_OFFSET_BACK: 5.5,      // closer behind car
  CAM_OFFSET_UP:   3.2,      // slightly lower
  CAM_SPRING:      9,        // tighter spring (was 5) → less lag
  CAM_FOV_BASE:    65,
  CAM_FOV_BOOST:   78,
}

// Daytime colours
export const COLORS = {
  GRASS_DARK:   0x2d6e2d,   // vivid pitch green
  GRASS_LIGHT:  0x3d8a3d,   // bright stripe
  LINE_WHITE:   0xffffff,
  SEAT_BLUE:    0x1a3a8f,   // vibrant stadium blue
  SEAT_ACCENT:  0xc41e3a,   // red supporter sections
  SEAT_VIP:     0xd4a017,   // gold VIP seats
  STADIUM_WALL: 0x1e2a3a,
  CONCRETE:     0x5a6070,   // medium-grey concourse
  GOLD:         0xffd700,
  CYAN:         0x00e5ff,
  ADBOARD_BG:   0x001122,
}

// Lighting — daytime
export const LIGHTS = {
  // Night / current values (unchanged)
  AMBIENT_COLOR:            0xffeedd,
  AMBIENT_INTENSITY:        1.2,
  FLOOD_COLOR:              0xfff5e0,
  FLOOD_INTENSITY:          1.8,
  FLOOD_INTENSITY_MATCHDAY: 9.0,
  SUN_COLOR:                0xfff5e0,
  SUN_INTENSITY:            3.8,

  // Day start values
  DAY_AMBIENT_INTENSITY:    2.8,
  DAY_SUN_INTENSITY:        4.5,
  DAY_FLOOD_INTENSITY:      0,
  DAY_FOG_DENSITY:          0.003,
  NIGHT_FOG_DENSITY:        0.0018,
  DAY_NIGHT_DURATION:       300,   // seconds for full transition
}
