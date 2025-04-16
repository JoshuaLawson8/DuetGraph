const { createArtist, safeCreateOrUpdateEdge, getArtistByStatus, markArtistStatus, closeDriver, getArtistById } = require('../utils/neo4j-graph-utils');
const { fetchAccessToken, getArtistFromSearch, getArtistAlbumIds, getMultipleAlbums, getArtistDetails } = require('../utils/spotify-api-utils');
const { formatArtistForDb } = require('../utils/neo4j-graph-utils');

let APICallCount = 0;
let fetchAlbumCount = 0;
let newUserCount = 0;
let fetchAlbumIdsCount = 0;

async function crawlArtist(artistData, accessToken) {
  const artistId = artistData.spotifyId;
  const artistCache = new Map(); 
  await markArtistStatus(artistId, 'inprogress');

  const albumIds = await getArtistAlbumIds(accessToken, artistId);
  APICallCount = APICallCount + (Math.ceil(albumIds.length/50))
  fetchAlbumIdsCount = fetchAlbumIdsCount + (Math.ceil(albumIds.length/50))
  console.log(`Call Count (fetchIds): ${fetchAlbumIdsCount}`)

  for (let i = 0; i < albumIds.length; i += 20) {
    const batchIds = albumIds.slice(i, i + 20);
    console.time("getAlbums");
    const albumDetails = await getMultipleAlbums(accessToken, batchIds);
    console.timeEnd("getAlbums");
    fetchAlbumCount++;
    APICallCount++;
    console.log(`Call Count (fetching albums): ${fetchAlbumCount}`)


    for (const album of albumDetails) {
      const tracks = album.tracks.items;

      for (const track of tracks) {
        const artists = track.artists;
        if (artists.length > 1) {
          // Create all artist nodes first
          for (const collabArtist of artists) {
            const existingArtist = await getArtistById(collabArtist.id);
            if (!(existingArtist.records.length > 0)) {
              // const collabArtistDetails = await getArtistDetails(accessToken, collabArtist.id);

              console.log(`Call Count (new user): ${newUserCount}`)
              const newCollabArtist = formatArtistForDb({
                spotifyId: collabArtist.id,
                name: collabArtist.name,
                image:  '', //collabArtistDetails.images?.[0]?.url ||
                popularity: 0 // collabArtistDetails.popularity ||
              });
              await createArtist(newCollabArtist);
            }
          }

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
        }
      }
    }
  }

  await markArtistStatus(artistId, 'crawled');
}

async function crawler(seedName = null) {
  console.log(`Call Count TOTAL: ${APICallCount}`)

  const accessToken = await fetchAccessToken();

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
  await crawlArtist(artistToCrawl, accessToken);
  await crawler();
}

crawler(process.argv[2]).finally(async () => {
  await closeDriver();
});