const fs = require('fs');
const path = require('path');


const keys = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../keys.json')));
const cooldowns = new Map(); // key index → resume timestamp

function now() {
  return Date.now();
}

function isOnCooldown(index) {
  const until = cooldowns.get(index);
  return until && until > now();
}

async function getAvailableKey() {
  const valid = keys
    .map((key, i) => ({ key, index: i }))
    .filter(({ index }) => !isOnCooldown(index));

  if (valid.length === 0) {
    const nextAvailable = Math.min(...[...cooldowns.values()]);
    const waitTime = Math.ceil((nextAvailable - now()) / 1000);
    console.log(`🚫 All keys are rate limited. Next available in ${waitTime}s`);
    await sleep(waitTime * 1000)
  }

  // Basic round-robin or random choice
  const pick = valid[Math.floor(Math.random() * valid.length)];
  return { ...pick.key, keyIndex: pick.index };
}

function markRateLimited(index, retryAfterSeconds = 60) {
  const retryAt = now() + retryAfterSeconds * 1000;
  cooldowns.set(index, retryAt);
  console.warn(`🛑 Key ${index} rate limited.`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getAvailableKey,
  markRateLimited
};
