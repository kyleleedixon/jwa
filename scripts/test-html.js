const axios = require('axios');

async function main() {
  const res = await axios.get('https://www.paleo.gg/games/jurassic-world-alive/dinodex/velociraptor', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  console.log(res.data);
}

main().catch(console.error);
