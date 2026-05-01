const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.paleo.gg/games/jurassic-world-alive/dinodex/';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

function parsePageProps(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!match) throw new Error('No __NEXT_DATA__');
  return JSON.parse(match[1]).props.pageProps;
}

async function main() {
  const outPath = path.join(__dirname, '../src/data/creatures.json');
  const creatures = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const slugs = creatures.map(c => c.uuid);

  let patched = 0;
  const CONCURRENCY = 10;
  const DELAY_MS = 200;

  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async slug => {
      try {
        const res = await axios.get(BASE_URL + slug, { headers: HEADERS, timeout: 15000 });
        const pp = parsePageProps(res.data);
        const d = pp.detail;
        const creature = creatures.find(c => c.uuid === slug);
        if (!creature) return;
        if (d.flock > 1) {
          creature.flock = d.flock;
          patched++;
          console.log(`  ${slug}: flock=${d.flock}`);
        } else {
          delete creature.flock;
        }
      } catch (err) {
        console.error(`  FAILED ${slug}: ${err.message}`);
      }
    }));
    process.stdout.write(`\r  Progress: ${Math.min(i + CONCURRENCY, slugs.length)}/${slugs.length}`);
    if (i + CONCURRENCY < slugs.length) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n  Patched ${patched} flock creatures.`);
  fs.writeFileSync(outPath, JSON.stringify(creatures, null, 2));
  console.log('  Saved.');
}

main().catch(console.error);
