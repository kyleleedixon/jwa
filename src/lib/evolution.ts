// Cost tables extracted from paleo.gg source (chunk 49273)

const COIN_N = [0,5,10,25,50,100,200,400,600,800,1000,2000,4000,6000,8000,10000,15000,20000,30000,40000,50000,60000,70000,80000,90000,100000,120000,150000,200000,250000,250000,250000,250000,250000,250000];

// Coins to level up (index = level - 1, value = coins to go from that level to next)
export const LEVEL_COINS: Record<string, number[]> = {
  common:    COIN_N,
  rare:      COIN_N,
  epic:      COIN_N,
  legendary: COIN_N,
  unique:    COIN_N,
  apex:      COIN_N,
  omega:     [800,1000,1500,2000,2500,3000,3500,4000,5000,7000,8000,10000,12000,15000,20000,25000,30000,35000,45000,50000,65000,80000,95000,120000,150000,180000,210000,250000,300000,350000,400000,400000,400000,400000,400000],
};

// Own DNA needed per level (index = level - 1, value = DNA to go from that level to next)
export const LEVEL_DNA: Record<string, number[]> = {
  common:    [50,100,150,200,250,300,350,400,500,750,1000,1250,1500,2000,2500,3000,3500,4000,5000,7500,10000,12500,15000,20000,25000,30000,35000,40000,50000,75000,100000,100000,100000,100000,100000],
  rare:      [0,0,0,0,0,100,100,150,200,250,300,350,400,500,750,1000,1250,1500,2000,2500,3000,3500,4000,5000,7500,10000,12500,15000,20000,25000,30000,30000,30000,30000,30000],
  epic:      [0,0,0,0,0,0,0,0,0,0,150,100,150,200,250,300,350,400,500,750,1000,1250,1500,2000,2500,3000,3500,4000,5000,7500,10000,10000,10000,10000,10000],
  legendary: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,100,150,200,250,300,350,400,500,750,1000,1250,1500,2000,2500,3000,3000,3000,3000,3000],
  unique:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250,100,150,200,250,300,350,400,500,750,1000,1000,1000,1000,1000],
  apex:      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,300,100,150,200,250,400,400,400,400,400],
  omega:     [100,100,100,100,500,500,500,500,500,1000,1000,1000,1000,1000,1500,1500,1500,1500,1500,2000,2000,2000,2000,2000,2700,2700,2700,2700,2700,2800,3500,4000,4500,5000,5500],
};

// Coins per fuse for each rarity
export const FUSE_COINS: Record<string, number> = {
  common: 0, rare: 20, epic: 100, legendary: 200, unique: 1000, apex: 2000,
};

// DNA required per fuse from each ingredient rarity (to produce 1 fuse of target)
export const FUSE_DNA_RATIO: Record<string, Record<string, number>> = {
  common:    {},
  rare:      { common: 50 },
  epic:      { common: 200, rare: 50 },
  legendary: { common: 500, rare: 200, epic: 50 },
  unique:    { common: 2000, rare: 500, epic: 200, legendary: 50 },
  apex:      { unique: 50, legendary: 200, epic: 500, rare: 2000 },
};

// [minLevel, defaultMaxLevel] for each rarity
export const RARITY_LEVEL_RANGE: Record<string, [number, number]> = {
  common:    [1, 5],
  rare:      [6, 10],
  epic:      [11, 15],
  legendary: [16, 20],
  unique:    [21, 30],
  apex:      [26, 30],
  omega:     [1, 30],
};

export interface EvoCost {
  coins: number;
  dna: number;       // own DNA needed
  fuseCoins: number; // coins just for fusing (subset of total cost if hybrid)
  ingredients: { uuid: string; rarity: string; dna: number }[];
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// How much own DNA is needed to level from `fromLevel` to `toLevel`
export function dnaToLevel(rarity: string, fromLevel: number, toLevel: number): number {
  const table = LEVEL_DNA[rarity];
  if (!table) return 0;
  const offset = rarity === 'omega' ? 1 : 0;
  return sum(table.slice(fromLevel - 1 + offset, toLevel - 1 + offset));
}

export function coinsToLevel(rarity: string, fromLevel: number, toLevel: number): number {
  const table = LEVEL_COINS[rarity];
  if (!table) return 0;
  const offset = rarity === 'omega' ? 1 : 0;
  return sum(table.slice(fromLevel - 1 + offset, toLevel - 1 + offset));
}

// Full evolution cost including fusing ingredient DNA
// ingredientRarities: array of ingredient rarity strings (for hybrids)
// dnaPerFuse: avg DNA gained per fuse (10=worst, 22=average, 50=best)
export function evolutionCost(
  rarity: string,
  fromLevel: number,
  toLevel: number,
  ingredientRarities: string[],
  dnaPerFuse = 22,
): EvoCost {
  const ownDna = dnaToLevel(rarity, fromLevel, toLevel);
  const levelCoins = coinsToLevel(rarity, fromLevel, toLevel);

  if (ingredientRarities.length === 0 || !FUSE_COINS[rarity]) {
    return { coins: levelCoins, dna: ownDna, fuseCoins: 0, ingredients: [] };
  }

  const fuses = Math.ceil(ownDna / dnaPerFuse);
  const fuseCoins = fuses * (FUSE_COINS[rarity] ?? 0);
  const ratios = FUSE_DNA_RATIO[rarity] ?? {};
  const ingredients = ingredientRarities.map((ingRarity, i) => ({
    uuid: '',
    rarity: ingRarity,
    dna: (ratios[ingRarity] ?? 0) * fuses,
  }));

  return {
    coins: levelCoins + fuseCoins,
    dna: ownDna,
    fuseCoins,
    ingredients,
  };
}

export interface MaxLevelResult {
  maxLevel: number;
  remainingCoins: number;
  remainingDna: number;
  remainingIngDna: number[];
}

// Given available resources, find the highest level reachable from `fromLevel`.
// For hybrids, pass ingredientRarities + availableIngDna; ownDna is derived from fusing.
// For non-hybrids, pass availableOwnDna; ingredientRarities/availableIngDna are empty.
export function maxLevelWithResources(
  rarity: string,
  fromLevel: number,
  availableCoins: number,
  availableOwnDna: number,
  ingredientRarities: string[],
  availableIngDna: number[],
  dnaPerFuse = 22,
): MaxLevelResult {
  const coinTable     = LEVEL_COINS[rarity] ?? LEVEL_COINS.common;
  const dnaTable      = LEVEL_DNA[rarity]   ?? LEVEL_DNA.common;
  const offset        = rarity === 'omega' ? 1 : 0;
  const isHybrid      = ingredientRarities.some(Boolean);
  const ratios        = FUSE_DNA_RATIO[rarity] ?? {};
  const fuseCoinsEach = isHybrid ? (FUSE_COINS[rarity] ?? 0) : 0;

  let coins  = availableCoins;
  let ownDna = availableOwnDna;
  const ingDna = [...availableIngDna];
  let level = fromLevel;

  while (level < 35) {
    const idx          = level - 1 + offset;
    const levelCoins   = coinTable[idx] ?? 0;
    const ownDnaNeeded = dnaTable[idx] ?? 0;
    let   totalCoins   = levelCoins;
    const ingDnaNeeded = ingredientRarities.map(() => 0);

    if (isHybrid && ownDnaNeeded > 0) {
      const fuses = Math.ceil(ownDnaNeeded / dnaPerFuse);
      totalCoins += fuses * fuseCoinsEach;
      for (let i = 0; i < ingredientRarities.length; i++) {
        ingDnaNeeded[i] = (ratios[ingredientRarities[i]] ?? 0) * fuses;
      }
    }

    if (coins < totalCoins) break;
    if (!isHybrid && ownDna < ownDnaNeeded) break;
    if (isHybrid && ingDna.some((avail, i) => avail < ingDnaNeeded[i])) break;

    coins -= totalCoins;
    if (!isHybrid) {
      ownDna -= ownDnaNeeded;
    } else {
      for (let i = 0; i < ingDna.length; i++) ingDna[i] -= ingDnaNeeded[i];
    }
    level++;
  }

  return { maxLevel: level, remainingCoins: coins, remainingDna: ownDna, remainingIngDna: ingDna };
}
