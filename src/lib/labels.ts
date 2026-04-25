export const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  unique: 'Unique',
  apex: 'Apex',
  omega: 'Omega',
};

export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'unique', 'apex', 'omega'];

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-300 border-gray-500',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-yellow-400 border-yellow-500',
  legendary: 'text-red-400 border-red-500',
  unique: 'text-green-400 border-green-500',
  apex: 'text-white',
  omega: 'text-gray-300 border-gray-400',
};

export const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-500/20',
  rare: 'bg-blue-500/20',
  epic: 'bg-yellow-500/20',
  legendary: 'bg-red-500/20',
  unique: 'bg-green-500/20',
  apex: 'bg-gray-900/60',
  omega: 'bg-gray-400/20',
};

export const CLASS_LABELS: Record<string, string> = {
  cunning: 'Cunning',
  fierce: 'Fierce',
  resilient: 'Resilient',
  wild_card: 'Wild Card',
  cunning_fierce: 'Cunning Fierce',
  cunning_resilient: 'Cunning Resilient',
  fierce_resilient: 'Fierce Resilient',
};

export const CLASS_COLORS: Record<string, string> = {
  cunning: 'text-cyan-400',
  fierce: 'text-red-400',
  resilient: 'text-green-400',
  wild_card: 'text-purple-400',
  cunning_fierce: 'text-sky-400',
  cunning_resilient: 'text-teal-400',
  fierce_resilient: 'text-amber-400',
};

export const HYBRID_TYPE_LABELS: Record<string, string> = {
  non_hybrid: 'Non-Hybrid',
  hybrid: 'Standard Hybrid',
  super_hybrid: 'Super Hybrid',
  mega_hybrid: 'Mega Hybrid',
  giga_hybrid: 'Giga Hybrid',
};

export const HYBRID_TYPE_ORDER = [
  'non_hybrid',
  'hybrid',
  'super_hybrid',
  'mega_hybrid',
  'giga_hybrid',
];

export const SPAWN_LABELS: Record<string, string> = {
  sanctuary: 'Sanctuary',
  everywhere: 'Everywhere',
  everywhere_monday: 'Everywhere (Mon)',
  everywhere_tuesday: 'Everywhere (Tue)',
  everywhere_wednesday: 'Everywhere (Wed)',
  everywhere_thursday: 'Everywhere (Thu)',
  everywhere_friday: 'Everywhere (Fri)',
  everywhere_saturday: 'Everywhere (Sat)',
  everywhere_sunday: 'Everywhere (Sun)',
  park: 'Park',
  local_area_1: 'Local Area 1',
  local_area_2: 'Local Area 2',
  local_area_3: 'Local Area 3',
  local_area_4: 'Local Area 4',
  raid: 'Raid',
  none: 'Event Only',
  'continent_AF/AN/AS/OC/US': 'Continental (Asia/Oceania)',
  'continent_EU/US': 'Continental (Europe)',
  'continent_NA/SA/US': 'Continental (Americas)',
  short_range: 'Short Range',
  arena: 'Arena',
  strike_towers: 'Strike Towers',
  isla_events: 'Isla Events',
  alliance_missions: 'Alliance Missions',
  pass: 'Season Pass',
};

export const SPECIALTY_LABELS: Record<string, string> = {
  has_special_active_ability: 'Special Active',
  has_special_passive_ability: 'Special Passive',
  has_swap_in_ability: 'Swap-In',
  has_on_escape_ability: 'On-Escape',
  has_counter_ability: 'Counter',
  has_alert_ability: 'Alert',
  priority_damage: 'Priority Damage',
  priority_non_damage: 'Priority Non-Damage',
  target_team: 'Target Team',
  target_all_opponents: 'Target All Opponents',
  group_attack: 'Group Attack',
  heal: 'Heal',
  heal_pct: 'Percentage Heal',
  stun: 'Stun',
  group_stun: 'Group Stun',
  bypass_armor: 'Bypass Armor',
  bypass_dodge: 'Bypass Dodge',
  bypass_alert: 'Bypass Alert',
  bypass_absorb: 'Bypass Absorb',
  group_bypass_alert: 'Group Bypass Alert',
  group_bypass_armor: 'Group Bypass Armor',
  shield: 'Shield',
  group_shield: 'Group Shield',
  damage_increase: 'Damage Increase',
  group_damage_increase: 'Group Damage Boost',
  crit_increase: 'Crit Increase',
  group_crit_increase: 'Group Crit Boost',
  speed_increase: 'Speed Increase',
  group_speed_increase: 'Group Speed Boost',
  speed_decrease: 'Speed Decrease',
  group_speed_decrease: 'Group Speed Decrease',
  damage_decrease: 'Damage Decrease',
  armor_decrease: 'Armor Decrease',
  group_armor_decrease: 'Group Armor Decrease',
  taunt: 'Taunt',
  group_taunt: 'Group Taunt',
  vulner: 'Vulnerability',
  group_vulner: 'Group Vulnerability',
  swap_prevent: 'Swap Prevention',
  resistance_decrease_all: 'Resistance Decrease',
  rend: 'Rend',
  dodge: 'Dodge',
  hot_contextual: 'Devour',
  cloak: 'Cloak',
  distraction: 'Distraction',
  group_distraction: 'Group Distraction',
  daze: 'Daze',
};

export const SPECIALTY_GROUPS: Record<string, string> = {
  // Healing
  heal: 'Healing',
  heal_pct: 'Healing',
  hot_contextual: 'Devour',

  // Shielding
  shield: 'Shielding',
  group_shield: 'Shielding',
  taunt: 'Shielding',
  group_taunt: 'Shielding',
  armor_increase: 'Shielding',

  // Evasion
  dodge: 'Evasion',
  cloak: 'Evasion',
  bypass_dodge: 'Evasion',
  bypass_alert: 'Evasion',
  bypass_absorb: 'Evasion',

  // Stunning
  stun: 'Stunning',
  group_stun: 'Stunning',

  // Speed Control
  speed_increase: 'Speed Control',
  group_speed_increase: 'Speed Control',
  speed_decrease: 'Speed Control',
  group_speed_decrease: 'Speed Control',

  // Damage Boosting
  damage_increase: 'Damage Boosting',
  group_damage_increase: 'Damage Boosting',
  crit_increase: 'Damage Boosting',
  group_crit_increase: 'Damage Boosting',

  // Weakening
  damage_decrease: 'Weakening',
  distraction: 'Weakening',
  group_distraction: 'Weakening',
  crit_decrease: 'Weakening',
  armor_decrease: 'Weakening',
  group_armor_decrease: 'Weakening',
  vulner: 'Weakening',
  group_vulner: 'Weakening',
  resistance_decrease_all: 'Weakening',

  // Armor Bypass
  bypass_armor: 'Armor Bypass',
  group_bypass_armor: 'Armor Bypass',
  rend: 'Armor Bypass',

  // Group Attacks
  group_attack: 'Group Attack',
  target_all_opponents: 'Group Attack',
  target_team: 'Group Attack',

  // Priority Moves
  priority_damage: 'Priority Moves',
  priority_non_damage: 'Priority Moves',

  // Swap Control
  swap_prevent: 'Swap Prevention',

  // Counter & Reactive
  has_counter_ability: 'Counter & Reactive',
  has_on_escape_ability: 'Counter & Reactive',
  has_swap_in_ability: 'Swap In',

  // Special Abilities
  has_special_active_ability: 'Special Abilities',
  has_special_passive_ability: 'Special Abilities',
  has_alert_ability: 'Special Abilities',
  cheat_death: 'Special Abilities',
  group_cheat_death: 'Special Abilities',

  // Nullifying (derived from remove_all_pos move effect)
  nullify: 'Nullifying',

  // Cleansing
  cleanse: 'Cleansing',
  remove_all_neg: 'Cleansing',

  // Damage Over Time
  dot: 'Damage Over Time',
  group_dot: 'Damage Over Time',

  // Additional unmapped
  has_revenge_ability: 'Counter & Reactive',
  run: 'Counter & Reactive',
  group_bypass_alert: 'Evasion',
  group_bypass_dodge: 'Evasion',
  group_dodge: 'Evasion',
  group_cloak: 'Evasion',
  group_heal: 'Healing',
  group_heal_pct: 'Healing',
  heal_increase: 'Healing',
  group_heal_increase: 'Healing',
  group_damage_decrease: 'Weakening',
  heal_decrease: 'Weakening',
  group_heal_decrease: 'Weakening',
  group_crit_decrease: 'Weakening',
  daze: 'Weakening',
  group_armor_increase: 'Shielding',
  group_rend: 'Armor Bypass',
  group_resistance_decrease_all: 'Weakening',
  priority_last_damage: 'Priority Moves',
  priority_last_non_damage: 'Priority Moves',
  group_swap_prevent: 'Swap Prevention',
};

export const GROUP_SPECIALTIES_BY_GROUP: Record<string, string[]> = {
  'Healing':        ['group_heal', 'group_heal_pct', 'group_heal_increase'],
  'Shielding':      ['group_shield', 'group_taunt', 'group_armor_increase'],
  'Evasion':        ['group_dodge', 'group_cloak', 'group_bypass_alert', 'group_bypass_dodge'],
  'Stunning':       ['group_stun'],
  'Speed Control':  ['group_speed_increase', 'group_speed_decrease'],
  'Damage Boosting':['group_damage_increase', 'group_crit_increase'],
  'Weakening':      ['group_damage_decrease', 'group_armor_decrease', 'group_vulner', 'group_heal_decrease', 'group_crit_decrease', 'group_resistance_decrease_all'],
  'Armor Bypass':   ['group_bypass_armor', 'group_rend'],
  'Damage Over Time':['group_dot'],
  'Swap Prevention':['group_swap_prevent'],
};

export const ABILITY_GROUP_ORDER = [
  'Damage Boosting',
  'Armor Bypass',
  'Nullifying',
  'Priority Moves',
  'Weakening',
  'Stunning',
  'Speed Control',
  'Healing',
  'Devour',
  'Cleansing',
  'Shielding',
  'Evasion',
  'Damage Over Time',
  'Swap In',
  'Swap Prevention',
  'Counter & Reactive',
  'Special Abilities',
];

export const RESISTANCE_KEYS = [
  'rst_crit_decrease',
  'rst_dot',
  'rst_damage_decrease',
  'rst_rend',
  'rst_speed_decrease',
  'rst_stun',
  'rst_swap_prevent',
  'rst_taunt',
  'rst_vulner',
  'rst_armor_decrease',
  'rst_resistance_decrease_all',
  'rst_heal_decrease',
  'rst_daze',
] as const;

export type ResistanceKey = typeof RESISTANCE_KEYS[number];

export const RESISTANCE_LABELS: Record<ResistanceKey, string> = {
  rst_crit_decrease: 'Crit Reduction',
  rst_dot: 'Damage Over Time',
  rst_damage_decrease: 'Reduced Damage',
  rst_rend: 'Rend',
  rst_speed_decrease: 'Speed Decrease',
  rst_stun: 'Stun',
  rst_swap_prevent: 'Swap Prevention',
  rst_taunt: 'Taunt',
  rst_vulner: 'Vulnerable',
  rst_armor_decrease: 'Reduced Armor',
  rst_resistance_decrease_all: 'Affliction',
  rst_heal_decrease: 'Heal Reduction',
  rst_daze: 'Daze',
};

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function specialtyGroups(specialty: string[]): string[] {
  return Array.from(new Set(specialty.map(s => SPECIALTY_GROUPS[s]).filter(Boolean)));
}
