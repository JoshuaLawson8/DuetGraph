
const fs = require('fs');
const path = require('path');

function loadCypherQuery(filename) {
    return fs.readFileSync(path.join(__dirname, '../cypher', filename), 'utf8');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
  // with jitter
  return 0 + Math.random() * 200;
}

const MAX_RETRIES = 5;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  await sleep(getDelay()); // always slow down globally

  const res = await fetch(url, options);

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
    console.warn(`🚫 Rate limited. Retrying in ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    return fetchWithRetry(url, options, retries - 1);
  }

  if ([502, 503, 504].includes(res.status)) {
    if (retries > 0) {
      console.warn(`⚠️ Server error ${res.status}. Retrying in 1s...`);
      await sleep(1000);
      return fetchWithRetry(url, options, retries - 1);
    } else {
      throw new Error(`❌ Failed after retries: ${res.status}`);
    }
  }

  if (!res.ok) {
    throw new Error(`❌ Spotify API error: ${res.status}`);
  }

  return await res;
}

  

module.exports = { loadCypherQuery, sleep, fetchWithRetry }