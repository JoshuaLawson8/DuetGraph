const express = require('express');
const router = express.Router();
const { getShortestPath, updateArtistDetails, getShortestPathName } = require('../utils/api.js');
const { getAvailableKey, markRateLimited } = require('../utils/spotify-key-manager.js');
const { getArtistFromSearch } = require('../utils/spotify-api-utils.js');

router.get('/idPath/:id1/:id2', async (req, res) => {
  const { id1, id2 } = req.params;
  try {
    const result = await getShortestPath(id1, id2);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/namePath/:name1/:name2', async (req, res) => {
  const { name1, name2 } = req.params;
  try {
    const result = await getShortestPathName(name1, name2);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Update artist's popularity/image
router.post('/artist/update', async (req, res) => {
  const { spotifyId, popularity, image } = req.body;
  try {
    const result = await updateArtistDetails(spotifyId, { popularity, image });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Spotify API search
router.get('/spotify-search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query param `q`" });

  try {
    const { access_token, keyIndex } = await getAvailableKey();
    const result = await getArtistFromSearch(access_token, q);
    res.json(result.artists.items);
  } catch (err) {
    if (err.message.includes("429")) {
      markRateLimited(keyIndex);
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
