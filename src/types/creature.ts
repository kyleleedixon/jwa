export interface Enhancement {
  cost: number;
  req: [string, number][];
  rwd: { type: string; value: number | string };
}

export interface OmegaPoints {
  cap:   Record<string, number>;
  delta: Record<string, number>;
  pcap:  Record<string, number>;
}

export interface MoveEffect {
  action: string;
  target: string;
  multiplier?: number;
  duration?: number[];
}

export interface AlertVersion {
  threshold: number;
  priority: number;
  delay: number;
  cooldown: number;
  effects: MoveEffect[];
}

export interface Move {
  uuid: string;
  name: string;
  type: 'regular' | 'counter' | 'swap_in' | 'on_escape' | 'reactive';
  delay: number;
  cooldown: number;
  priority: number;
  icon?: string;
  effects: MoveEffect[];
  if_alert?: AlertVersion;
}

export interface Creature {
  uuid: string;
  name: string;
  rarity: string;
  class: string;
  size: string;
  hybrid_type: string;
  specialty: string[];
  dna_source: string[];
  health: number;
  damage: number;
  speed: number;
  armor: number;
  crit: number;
  critm: number;
  version: string;
  description: string;
  ingredients: string[];
  hybrids: string[];
  image: string;
  moves: Move[];
  resistance: number[];
  flock?: number;
  move_unlock_lv?: Record<string, number>;
  points?: OmegaPoints;
  enhancements?: Enhancement[];
}

export interface FilterState {
  rarity: Set<string>;
  class: Set<string>;
  hybrid_type: Set<string>;
  specialty: Set<string>;
  dna_source: Set<string>;
}
