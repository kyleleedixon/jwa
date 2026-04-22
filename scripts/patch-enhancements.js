const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.paleo.gg/games/jurassic-world-alive/dinodex/';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
const CONCURRENCY = 6;
const DATA_PATH = path.join(__dirname, '../src/data/creatures.json');

function parsePageProps(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!match) throw new Error('No __NEXT_DATA__');
  return JSON.parse(match[1]).props.pageProps;
}

async function fetchEnhancements(slug) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.get(BASE_URL + slug, { headers: HEADERS, timeout: 15000 });
      const pp = parsePageProps(res.data);
      const d = pp.detail;
      return d.enhancements || null;
    } catch (err) {
      if (attempt === 3) { console.error(`  FAILED ${slug}: ${err.message}`); return null; }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function run() {
  const creatures = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const targets = creatures.filter(c => c.rarity === 'unique' || c.rarity === 'apex');
  console.log(`Patching ${targets.length} unique/apex creatures...`);

  let done = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(c => fetchEnhancements(c.uuid)));
    batch.forEach((c, j) => {
      const enhancements = results[j];
      const creature = creatures.find(x => x.uuid === c.uuid);
      if (enhancements && enhancements.length > 0) {
        creature.enhancements = enhancements;
      } else {
        delete creature.enhancements;
      }
    });
    done += batch.length;
    process.stdout.write(`\r  Progress: ${done}/${targets.length}`);
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(creatures, null, 2));
  console.log(`\nDone. Written to ${DATA_PATH}`);
}

run().catch(e => { console.error(e); process.exit(1); });
