
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
  return 500 + Math.random() * 200;
}

class TryLaterError extends Error {
  constructor(message, retryAfterMs) {
    super(message);
    this.name = 'TryLaterError';
    this.retryAfterMs = retryAfterMs;
  }
}


const MAX_RETRIES = 5;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  await sleep(getDelay());  // global slow down

  const res = await fetch(url, options);

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
    throw new TryLaterError("Token Rate limited", retryAfter);
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

  return res;
} 

module.exports = { loadCypherQuery, sleep, fetchWithRetry, TryLaterError }