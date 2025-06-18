const express = require('express');
const router = express.Router();
const { getShortestPath, updateArtistDetails, getArtistSearchResults, getArtistsFromName } = require('../utils/neo4j-graph-utils.js');
const { getAvailableKey, markRateLimited } = require('../utils/spotify-key-manager.js');
const { getArtistFromSearch, getArtistDetails } = require('../utils/spotify-api-utils.js');
const { fetchAccessToken, neo4jRecordsToObjects } = require('../utils/utils.js');

router.get('/idPath/:id1/:id2', async (req, res) => {

  const { id1, id2 } = req.params;
  try {
    const result = await getShortestPath(id1, id2);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/search/:name', async (req, res) => {

  const { name } = req.params;
  try {
    const records = neo4jRecordsToObjects((await getArtistSearchResults(name)).records);
    for (const record of records){
      setArtistDetails(record.spotifyId)
    }
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/namePath/:name1/:name2', async (req, res) => {
  const { name1, name2 } = req.params;
  let ids = [];
  // first grab users from neo4j
  for (const name of [name1, name2]) {
    const neo4jArtistObjectList = await getArtistsFromName(name)

    // no artist with this name
    if (neo4jArtistObjectList.records.length == 0) {
      ids.push("");
      continue
    }
    else if (neo4jArtistObjectList.records.length > 1) { // list of artists
      let localPop = []
      for (const object of neo4jArtistObjectList.records) {
        if(object['_fields'][0].properties.popularity == 0){
          localPop.push(await setArtistDetails(object['_fields'][0].properties.spotifyId))
        } else {
          localPop.push(object['_fields'][0].properties.popularity)
        }
      }
      const maxPopIndex = localPop.indexOf(Math.max(...localPop));
      ids.push(neo4jArtistObjectList.records[maxPopIndex]["_fields"][0].properties.spotifyId)
    }

    else { // singleton yay! :D
      const artistObject = neo4jArtistObjectList.records[0]["_fields"][0].properties;
      if (artistObject.popularity == 0) {
        try {
          await setArtistDetails(artistObject.spotifyId)
        } catch (e) {
          console.log("failed to set popularity/image url")
        }
      }
      ids.push(neo4jArtistObjectList.records[0]["_fields"][0].properties.spotifyId);
    }
  }
  try {
    const result = await getShortestPath(ids[0], ids[1]);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function setArtistDetails(spotifyId) {
  let keyIndex;
  try {
    const accessTokenObject = (await fetchAccessToken());
    const accessToken = accessTokenObject.token;
    keyIndex = accessTokenObject.keyIndex;
    const result = await getArtistDetails(accessToken, spotifyId);
    // if 0, set to -1 so we know it's been checked
    updateArtistDetails(spotifyId, { popularity: result.popularity === 0 ? -1 : result.popularity, image: result.images.length > 0 ? result.images[0].url : ""})
    return result.popularity;
  } catch (err) {
    if (err.message.includes("429") && keyIndex !== undefined) {
      markRateLimited(keyIndex);
    }
  }
}



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

// TODO: Remove
router.get('/spotify-search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query param `q`" });

  let keyIndex;
  try {
    const { access_token, keyIndex: ki } = await getAvailableKey();
    keyIndex = ki;
    const result = await getArtistFromSearch(access_token, q);
    res.json(result.artists.items);
  } catch (err) {
    if (err.message.includes("429") && keyIndex !== undefined) {
      markRateLimited(keyIndex);
    }
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
