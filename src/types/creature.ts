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
}

export interface FilterState {
  rarity: Set<string>;
  class: Set<string>;
  hybrid_type: Set<string>;
  specialty: Set<string>;
  dna_source: Set<string>;
}
