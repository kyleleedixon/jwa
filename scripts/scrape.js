const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SLUGS = [
  '93_classic_t_rex','acrocanthops','acrocanthosaurus','aenocyonyx','aerospinosaurus','aerotitan',
  'ailurarctos','alacranix','alankydactylus','alankyloceratops','alankylosaurus','alanqa',
  'albertocevia','albertosaurus','albertospinos','allodrigues','alloraptor','allosaurus',
  'allosaurus_gen_2','allosinosaurus','amargasaurus','amargocephalus','ampelorex','ampelosaurus',
  'amphicyon','andrewsarchus','andrewtherium','andrewtodon','andrewtops','angel','animantarx',
  'ankylocodon','ankylodactylus','ankylodicurus','ankylomoloch','ankylos_lux','ankylosaurus',
  'ankylosaurus_gen_2','ankyntrosaurus','antarctopelta','antarctovenator','anurognathus',
  'apatoceratops','apatosaurus','aquicomilus','aquignathus','aquilamimus','aquilops','aquilosaurus',
  'aquilotae','aquiraptor','aquisaurus','arambourgiania','archaeopteryx','archaeotherium',
  'arctalces','arctocanis','arctodus','arctops','arctovasilas','ardentismaxima','ardontognathus',
  'ardontosaurus','argentavis','argenteryx','argentinosaurus','armbrusters_wolf','atrocimoloch',
  'atrocodistis','atrocomaxima','atromolistis','australotitan','bajadasaurus','bajatonodon',
  'baryonyx','baryonyx_gen_2','baryosaurus','baryothus','baryotor','becklejara','becklerizaurus',
  'becklolyth','becklophosaurus','beelzebufo','beta','big_eatie','blonde','blue','borealopelta',
  'brachiosaurus','brontolasmus','brontotherium','brunette','bumpy','carbonemys','carbotoceratops',
  'carcharodontosaurus','carnotarkus','carnotaurus','centroceratops','centrolophus_lux',
  'centrosaurus','ceramagnus','ceranosaurus','cerastegotops','ceratosaurus','ceratosaurus_gen_2',
  'cervalces','charlie','clever_girl','coelhaast','coelurosauravus','compsocaulus','compsognathus',
  'compsognathus_gen_2','compsoraptor','compsovenator','concakuisaurus','concatoloch',
  'concatosaurus','concavenator','constrictoraptor','crichtomoloch','crichtonsaurus',
  'cryolophosaurus','dakotacurus','dakotanops','dakotaraptor','darwezopteryx','darwinopterus',
  'deinocheirus','deinomimus','deinonychus','deinosuchus','deinotherium','deinotops','delta',
  'diabloceratops','dilophoboa','dilophosaurus','dilophosaurus_gen_2','diloracheirus',
  'diloranosaurus','dilozorion','dimetrodon','dimetrodon_gen_2','dimodactylus','dimorphodon',
  'diorajasaur','diplocaulus','diplocaulus_gen_2','diplodocus','diplotator','diplovenator',
  'dire_wolf','distortus_rex','dodo','dodocevia','doedicurus','draco_intrepidus','draco_lux',
  'dracoceratops','dracoceratosaurus','dracorex','dracorex_gen_2','dracovenator','dreadactylus',
  'dreadnoughtus','dsungaia','dsungaripterus','dsungascorpios','echo','edaphocevia','edaphosaurus',
  'edmontoguanodon','edmontosaurus','einiasuchus','einiosaurus','elasmotherium','enteloceros',
  'entelochops','entelodon','entelolania','entelomoth','eremocanis','eremoceros','eremotherium',
  'erlidominus','erlikogamma','erlikosaurus','erlikosaurus_gen_2','erlikospyx','erythrosuchus',
  'estemmenosuchus','eucladoceros','euoplocephalus','fukuimimus','fukuiraptor','fukuisaurus',
  'fukuitops','gallimimus','geminideus','geminititan','geosternbergia','ghost','giganotosaurus',
  'giganspinoceratops','gigantspinosaurus','giganyx','gigaspikasaur','giraffatitan','glyptoceras',
  'glyptodon','glyptosavis','gorgonops','gorgosaurus','gorgosuchus','gorgotrebax','graciliraptor',
  'gryganyth','grylenken','grypolyth','gryposuchus','haast_eagle','haast_eagle_gen_2',
  'haast_maximus','hadros_lux','hatzegopteryx','herranotor','herrerasaurus','homalocephale',
  'hydra_boa','ichthyovenator','iguanodon','imperatosuchus','indochicyon','indolycan',
  'indominus_rex','indominus_rex_gen_2','indonemys','indoraptor','indoraptor_gen_2','indotaurus',
  'inostherium','inostrancevia','irritator','irritator_gen_2','junior','kaprosuchus','kelenken',
  'kentrorex','kentrosaurus','keratoporcus','koolabourgiana','koolasuchus','koolasuchus_gen_2',
  'koreanosaurus','lambeosaurus','leaellynasaura','leucistic_baryonyx','little_eatie',
  'lystrosaurus','lystrosavis','lystrosuchus','lythronax','magnapyritor','magnaraptor','maiasaura',
  'majundaboa','majundasuchus','majungasaurus','mammolania','mammotherium','marsupial_lion',
  'masiakasaurus','mastodonsaurus','megalania','megaloceros','megalocevia','megalogaia','megalonyx',
  'megalosaurus','megalosuchus','megalotops','megamimus','megaraptor','megatyrannus','megistocurus',
  'megistotherium','meiolania','microraptor','miragaia','monkeydactyl','monkeyondactylus',
  'monolometrodon','monolomoth','monolophosaurus','monolophosaurus_gen_2','monolorhino','monomimus',
  'monostegotops','moros_intrepidus','mortem_rex','moschops','mutadon','nanophosaurus',
  'nanotyrannus','nasutoceratops','nodopatosaurus','nodopatotitan','nodosaurus','nomingia',
  'nominrex','nundasuchus','nyctopteryx','nyctosaurus','olorotitan','ophiacodon','ornithomimus',
  'ouranosaurus','ovilophomoloch','ovilophosaurus','ovinnolophosaurus','oviraptor','oviraptor_gen_2',
  'ovylenken','pachycephalosaurus','panthera','panthera_blytheae','pantherator','paramoloch',
  'parasaurolophus','parasaurolophus_lux','parasauthops','phorurex','phorusaura','phorusrhacos',
  'pierce','plateopikasaurus','plateorex','plateosaurus','postimetrodon','postosuchus','poukaidei',
  'poukandactylus','preondactylus','procerathomimus','proceratosaurus','proto_lux','protoceratops',
  'protonodon','pteranodon','pteranokyrie','pteraquetzal','pterovexus','pulmonoscorpius','purrolyth',
  'purussaurus','purussaurus_gen_2','purutaurus','pyroraptor','pyroraptor_gen_2','pyrorixis',
  'pyrosuchus','pyrritator','quetzalcoatlus','quetzalcoatlus_gen_2','quetzaljara','quetzorion',
  'rajadorixis','rajadotholus','rajakylosaurus','rajasaurus','rajatholus','rativates','rebel',
  'rebirth_raptor','rebirth_spinosaurus','rebirth_spinosaurus_gen_2','rebirth_t_rex','red',
  'refrenantem','rexy','rinchenia','rinchicyon','rodrigues_solitaire','sah_panthera','sarcomantarx',
  'sarcorixis','sarcosaurus','sarcosuchus','saurolyth','saurophaganax','saurornitholestes',
  'scaphognathus','scaphotator','scelidosaurus','scolosaurus','scorpius_rex','scorpius_rex_gen_2',
  'scorpius_rex_gen_3','scutophicyon','scutosaurus','secodontosaurus','segnoraptor','segnosaurus',
  'segnotherisaurus','shantungosaurus','shantunrax','sinoceratops','sinokotaraptor',
  'sinosauropteryx','sinraptor','skoolasaurus','skoonametrodon','skoonasaurus','skorpiodactylus',
  'skorpiostegotops','skorpiovenator','smilocephalosaurus','smilodon','smilonemys','sonorasaurus',
  'sphaerotholus','spinoceratops','spinoconstrictor','spinonyx','spinosaurus','spinosaurus_aegyptiacus',
  'spinosaurus_gen_2','spinotahraptor','spinotasuchus','spinotops','stegoceras','stegoceratops',
  'stegodeus','stegosaurus','stegosaurus_ungulatus','stegouros','struthiomimus','stygidaryx',
  'stygimoloch','stygimoloch_gen_2','styracosaurus_lux','suchomimus','suchotator','tanycolagreus',
  'tapejara','tarbognathus','tarbosaurus','tenontorex','tenontosaurus','testacornibus',
  'therizinosaurus','thoradolosaur','thylaconyx','thylacosmilus','thylacotator','thylos_intrepidus',
  'tiger','titanoboa','titanoboa_gen_2','titanosaurus','titanotarkus','titanotholus','titanotor',
  'toro','tragodistis','triceratops','triceratops_gen_2','troodoboa','troodon','trykosaurus',
  'trykovenator','tryostronix','tsintamoth','tsintaosaurus','tuojiangosaurus','tuoramoloch',
  'tupandactylus','tyrannodactylus','tyrannolophosaur','tyrannometrodon','tyrannosaur_buck',
  'tyrannosaur_doe','tyrannosaurus_rex','tyrannosaurus_rex_gen_2','utahraptor','utarinex',
  'utasinoraptor','vectispinus','velociraptor','velosrhacos','woolly_mammoth','woolly_rhino',
  'wuerhosaurus','yutyrannus','yuxisaurus',
];

const BASE_URL = 'https://www.paleo.gg/games/jurassic-world-alive/dinodex/';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
const CONCURRENCY = 8;
const DELAY_MS = 300;

function parsePageProps(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!match) throw new Error('No __NEXT_DATA__');
  return JSON.parse(match[1]).props.pageProps;
}

function parseMoves(moveArray, moveType, moveNames) {
  return (moveArray || []).map(mv => {
    return {
      uuid: mv.uuid,
      name: moveNames[mv.uuid] || 'Enhancement',
      type: moveType,
      delay: mv.delay,
      cooldown: mv.cooldown,
      priority: mv.priority,
      icon: mv.icon
        ? 'https://cdn.paleo.gg/games' + mv.icon
        : mv.uuid.startsWith('ot__') ? undefined : `https://cdn.paleo.gg/games/images/move/regular/${mv.uuid}.png`,
      effects: (mv.effects || []).map(e => ({
        action: e.action,
        target: e.target,
        ...(e.multiplier != null && { multiplier: e.multiplier }),
        ...(e.duration != null && { duration: e.duration }),
      })),
    };
  });
}

function deriveSpecialties(moves, existing) {
  const extra = new Set();
  const allEffects = moves.flatMap(m => m.effects.map(e => e.action));
  if (allEffects.includes('remove_all_pos')) extra.add('nullify');
  if (allEffects.includes('remove_all_neg')) extra.add('cleanse');
  if (allEffects.includes('dot')) extra.add('dot');
  if (allEffects.includes('heal') || allEffects.includes('heal_pct')) extra.add('heal');
  return [...new Set([...existing, ...extra])];
}

async function fetchCreature(slug, moveNames) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.get(BASE_URL + slug, { headers: HEADERS, timeout: 15000 });
      const pp = parsePageProps(res.data);
      const d = pp.detail;
      const names = moveNames || pp.__namespaces['dinodex-move'] || {};

      const moves = [
        ...parseMoves(d.moves, 'regular', names),
        ...parseMoves(d.moves_counter, 'counter', names),
        ...parseMoves(d.moves_swap_in, 'swap_in', names),
        ...parseMoves(d.moves_on_escape, 'on_escape', names),
        ...parseMoves(d.moves_reactive, 'reactive', names),
      ];

      const specialty = deriveSpecialties(moves, d.specialty || []);
      return {
        uuid: d.uuid,
        name: d.name,
        rarity: d.rarity,
        class: d.class,
        size: d.size,
        hybrid_type: d.hybrid_type,
        specialty,
        dna_source: (d.dna_source || []).map(s => s.loc),
        health: d.health,
        damage: d.damage,
        speed: d.speed,
        armor: d.armor,
        crit: d.crit,
        critm: d.critm,
        version: d.version,
        description: d.description || '',
        ingredients: d.ingredients || [],
        hybrids: d.hybrids || [],
        image: `https://cdn.paleo.gg/games/jwa/images/creature/${d.uuid}.png`,
        moves,
        resistance: d.resistance || [],
        ...(d.flock > 1 && { flock: d.flock }),
        ...(d.move_unlock_lv && Object.keys(d.move_unlock_lv).length > 0 && { move_unlock_lv: d.move_unlock_lv }),
        ...(d.points && { points: d.points }),
      };
    } catch (err) {
      if (attempt === 3) {
        console.error(`  FAILED ${slug}: ${err.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const STAT_KEYS = ['health', 'damage', 'speed', 'armor', 'crit', 'critm'];

function diffCreatures(oldList, newList) {
  const oldMap = new Map(oldList.map(c => [c.uuid, c]));
  const newMap = new Map(newList.map(c => [c.uuid, c]));
  const changes = [];

  for (const c of newList) {
    if (!oldMap.has(c.uuid)) {
      changes.push({ type: 'new', uuid: c.uuid, name: c.name, rarity: c.rarity });
    }
  }
  for (const c of oldList) {
    if (!newMap.has(c.uuid)) {
      changes.push({ type: 'removed', uuid: c.uuid, name: c.name });
    }
  }
  for (const c of newList) {
    const o = oldMap.get(c.uuid);
    if (!o) continue;
    const stats = {};
    for (const k of STAT_KEYS) {
      if (o[k] !== c[k]) stats[k] = [o[k], c[k]];
    }
    if (Object.keys(stats).length > 0 || o.version !== c.version) {
      changes.push({
        type: 'updated',
        uuid: c.uuid,
        name: c.name,
        ...(Object.keys(stats).length > 0 && { stats }),
        ...(o.version !== c.version && { version: [o.version, c.version] }),
      });
    }
  }
  return changes;
}

async function main() {
  // Fetch last modified date from the dinodex index
  console.log('  Fetching dinodex metadata...');
  const indexRes = await axios.get('https://www.paleo.gg/games/jurassic-world-alive/dinodex', { headers: HEADERS, timeout: 15000 });
  const indexProps = parsePageProps(indexRes.data);
  const lastModifiedDate = indexProps.meta?.lastModifiedDate || null;
  console.log(`  Last modified date: ${lastModifiedDate}`);

  // Fetch move names once from the first creature page
  console.log('  Fetching move name dictionary...');
  const firstRes = await axios.get(BASE_URL + SLUGS[0], { headers: HEADERS, timeout: 15000 });
  const moveNames = parsePageProps(firstRes.data).__namespaces['dinodex-move'] || {};
  console.log(`  Loaded ${Object.keys(moveNames).length} move names.`);

  const results = [];
  let done = 0;

  for (let i = 0; i < SLUGS.length; i += CONCURRENCY) {
    const batch = SLUGS.slice(i, i + CONCURRENCY);
    const fetched = await Promise.all(batch.map(slug => fetchCreature(slug, moveNames)));
    for (const c of fetched) {
      if (c) results.push(c);
    }
    done += batch.length;
    process.stdout.write(`\r  Progress: ${done}/${SLUGS.length} (${results.length} ok)`);
    if (i + CONCURRENCY < SLUGS.length) await sleep(DELAY_MS);
  }

  console.log(`\n  Done! ${results.length} creatures scraped.`);


  const outPath = path.join(__dirname, '../src/data/creatures.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // Diff against existing data before overwriting
  const changelogPath = path.join(__dirname, '../src/data/changelog.json');
  try {
    const oldData = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const changes = diffCreatures(oldData, results);
    if (changes.length > 0) {
      const existing = JSON.parse(fs.readFileSync(changelogPath, 'utf8') || '[]');
      existing.unshift({
        date: new Date().toISOString().split('T')[0],
        version: lastModifiedDate,
        changes,
      });
      fs.writeFileSync(changelogPath, JSON.stringify(existing, null, 2));
      console.log(`  Changelog: ${changes.length} changes recorded.`);
    } else {
      console.log('  Changelog: no stat/roster changes detected.');
    }
  } catch {
    console.log('  Changelog: skipped (no existing data to diff against).');
  }

  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`  Saved to ${outPath}`);

  const metaPath = path.join(__dirname, '../src/data/meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({ lastModifiedDate }, null, 2));
  console.log(`  Saved meta to ${metaPath}`);
}

main().catch(console.error);
