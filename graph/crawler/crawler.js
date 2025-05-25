require('dotenv').config()

const { createArtist, safeCreateOrUpdateEdge, getArtistByStatus, markArtistStatus, closeDriver, getArtistById } = require('../utils/neo4j-graph-utils');
const { getArtistFromSearch, getArtistAlbumIds, getMultipleAlbums, getArtistDetails } = require('../utils/spotify-api-utils');
const { formatArtistForDb } = require('../utils/neo4j-graph-utils');
const { TryLaterError, fetchAccessToken } = require('../utils/utils');
const { markRateLimited } = require('../utils/spotify-key-manager');
const { checkNeo4jSize } = require('../utils/db-monitor');

// Metrics
let APICallCount = 0;
let fetchAlbumCount = 0;
let fetchAlbumIdsCount = 0;
const artistCache = new Set();

setInterval(() => {
  checkNeo4jSize();
}, 5 * 60 * 1000); // every 5 minutes

async function crawlArtist(artistData, accessToken) {
  const artistId = artistData.spotifyId;
  await markArtistStatus(artistId, 'inprogress');

  const albumIds = await getArtistAlbumIds(accessToken, artistId);
  APICallCount = APICallCount + (Math.ceil(albumIds.length / 50.0))
  fetchAlbumIdsCount = fetchAlbumIdsCount + (Math.ceil(albumIds.length / 50.0))
  // console.log(`Call Count (fetchIds): ${fetchAlbumIdsCount}`)

  for (let i = 0; i < albumIds.length; i += 20) {
    const batchIds = albumIds.slice(i, i + 20);
    console.time("getAlbums");
    const albumDetails = await getMultipleAlbums(accessToken, batchIds);
    console.timeEnd("getAlbums");
    fetchAlbumCount++;
    APICallCount++;
    console.log(`Call Count (fetching albums): ${fetchAlbumCount}`)


    for (const album of albumDetails) {
      const tracks = album?.tracks.items;

      for (const track of tracks) {
        const artists = track?.artists;

        if (artists.length > 1) {
          // Create all artist nodes first
          for (const collabArtist of artists) {
            if (!artistCache.has(collabArtist.id)) {
              console.time("getExisitingArtists")
              const existingArtist = await getArtistById(collabArtist.id);
              console.timeEnd("getExisitingArtists")
              if (!(existingArtist.records.length > 0)) {
                // const collabArtistDetails = await getArtistDetails(accessToken, collabArtist.id);

                // console.log(`Call Count (new user): ${newUserCount}`)
                const newCollabArtist = formatArtistForDb({
                  spotifyId: collabArtist.id,
                  name: collabArtist.name,
                  image: '', //collabArtistDetails.images?.[0]?.url ||
                  popularity: 0 // collabArtistDetails.popularity ||
                });
                await createArtist(newCollabArtist);
              }
              artistCache.add(collabArtist.id);
            }
          }

          console.time("createdEdges")
          // Create edges between all unique pairs (n*(n-1)/2)
          for (let i = 0; i < artists.length; i++) {
            for (let j = i + 1; j < artists.length; j++) {
              const a1 = artists[i].id;
              const a2 = artists[j].id;

              await safeCreateOrUpdateEdge(a1, a2, {
                songUri: track.uri,
                name: track.name,
                image: album?.images?.[0]?.url || '',
                albumUri: album?.uri || ''
              });
            }
          }
          console.timeEnd("createdEdges")
        }
      }
    }
  }
  await markArtistStatus(artistId, 'crawled');
}

async function crawler(seedName = null) {
  const tokenObject = await fetchAccessToken();
  const accessToken = tokenObject.token;
  let artistToCrawl;
  if (seedName) {
    const searchResults = await getArtistFromSearch(accessToken, seedName);
    const picked = searchResults.artists.items[0];
    const formatted = formatArtistForDb({
      spotifyId: picked.id,
      name: picked.name,
      image: picked.images?.[0]?.url || '',
      popularity: picked.popularity || null
    });
    await createArtist(formatted);
    artistToCrawl = formatted;
  } else {
    artistToCrawl = await getArtistByStatus('inprogress') || await getArtistByStatus('uncrawled');
  }

  if (!artistToCrawl) {
    console.log("🎉 Crawls done!");
    return;
  }

  console.log("🔍 Crawling:", artistToCrawl.name);
  await attemptCrawl(artistToCrawl, tokenObject, cache = true)
  await crawler();
}

async function attemptCrawl(artistToCrawl, tokenObject, cache) {
  try {
    await crawlArtist(artistToCrawl, tokenObject.token);
  } catch (e) {
    if (e instanceof TryLaterError) {
      console.warn(`🔁 Retry triggered — marking key as timed out for ${e.retryAfterMs}s`);
      markRateLimited(tokenObject.keyIndex, e.retryAfterMs);
      const newTokenObject = await fetchAccessToken(cache = false);
      // Retry recursively with a new key
      return attemptCrawl(artistToCrawl, newTokenObject, cache = false);
    }
    throw e; // rethrow non-rate-limit errors
  }
}

crawler(process.argv[2]).finally(async () => {
  console.log("Closed Driver")
  await closeDriver();
});