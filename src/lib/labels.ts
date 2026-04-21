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
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-yellow-400 border-yellow-500',
  unique: 'text-orange-400 border-orange-500',
  apex: 'text-emerald-400 border-emerald-500',
  omega: 'text-pink-400 border-pink-500',
};

export const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-500/20',
  rare: 'bg-blue-500/20',
  epic: 'bg-purple-500/20',
  legendary: 'bg-yellow-500/20',
  unique: 'bg-orange-500/20',
  apex: 'bg-emerald-500/20',
  omega: 'bg-pink-500/20',
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
  hot_contextual: 'Regeneration',
  cloak: 'Cloak',
  distraction: 'Distraction',
  group_distraction: 'Group Distraction',
};

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
