
const fs = require('fs');
const path = require('path');
const { getAvailableKey } = require('./spotify-key-manager.js');


function loadCypherQuery(filename) {
  return fs.readFileSync(path.join(__dirname, '../cypher', filename), 'utf8');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
  // with jitter
  return 250 + Math.random() * 200;
}

class TryLaterError extends Error {
  constructor(message, retryAfterMs) {
    super(message);
    this.name = 'TryLaterError';
    this.retryAfterMs = retryAfterMs;
  }
}


const MAX_RETRIES = 10;

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  await sleep(getDelay());  // global slow down

  const res = await fetch(url, options);

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
    throw new TryLaterError("Token Rate limited", retryAfter);
  }

  if ([502, 503, 504].includes(res.status)) {
    if (retries > 0) {
      console.warn(`⚠️ Server error ${res.status}. Retrying in 5s...`);
      await sleep(5000);
      return fetchWithRetry(url, options, retries - 1);
    } else {
      throw new Error(`❌ Failed after retries: ${res.status}`);
    }
  }

  if (res.status === 401) {
    // token has expired
    const tokenObject = await fetchAccessToken();
    return fetchWithRetry(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenObject.token}`
      }
    }, retries-1)
  }

  if (!res.ok) {
    throw new Error(`❌ Spotify API error: ${res.status}`);
  }

  return res;
}

let cachedToken = null;
let cachedKeyIndex = -1;
let tokenFetchedAt = 0;
const TOKEN_TTL = 3000 * 1000; // 3000 seconds in ms

async function fetchAccessToken(cache = true) {
  const now = Date.now();
  if (cachedToken && now - tokenFetchedAt < TOKEN_TTL && cache) {
    return {token: cachedToken, keyIndex: cachedKeyIndex};
  }

  let creds;
  try {
    creds = await getAvailableKey();
  } catch (err) {
    console.error(err.message);
    return fetchAccessToken(cache = false);
  }

  const authHeader = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');

  const response = await fetchWithRetry(
    'https://accounts.spotify.com/api/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    }
  );

  const data = await response.json();
  cachedToken = data.access_token;
  cachedKeyIndex = creds.keyIndex;
  tokenFetchedAt = now;

  return { token: cachedToken, keyIndex: creds.keyIndex };
}

function neo4jRecordsToObjects(records) {
  return records.map(record => {
    return record.keys.reduce((obj, key, idx) => {
      let value = record._fields[idx];

      // Handle Neo4j Integer (has low/high properties)
      if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
        // If high is non-zero, you'd need to handle large integers; otherwise just use low
        if (value.high !== 0) {
          // Optional: Use a BigInt if needed
          value = BigInt(value.high) << 32n | BigInt(value.low >>> 0);
        } else {
          value = value.low;
        }
      }

      obj[key] = value;
      return obj;
    }, {});
  });
}


module.exports = { loadCypherQuery, sleep, fetchWithRetry, TryLaterError, fetchAccessToken, neo4jRecordsToObjects }