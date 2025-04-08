const { createArtist, safeCreateOrUpdateEdge, getArtistByStatus, markArtistStatus, closeDriver, getArtistById } = require('../utils/neo4j-graph-utils');
const { fetchAccessToken, getArtistFromSearch, getArtistAlbums, getAlbumTracks, getArtistDetails } = require('../utils/spotify-api-utils');
const { formatArtistForDb } = require('../utils/neo4j-graph-utils');

let APICallCount = 0;

async function crawlArtist(artistData, accessToken) {
  const artistId = artistData.spotifyId;
  await markArtistStatus(artistId, 'inprogress');

  // change to get ALL albums
  const albums = await getArtistAlbums(accessToken, artistId);
  APICallCount++;
  for (const album of albums) {
    const tracks = await getAlbumTracks(accessToken, album.id);
    APICallCount++;

    for (const track of tracks) {
      const artists = track.artists;

      if (artists.length > 1) {
        for (const collabArtist of artists) {
          if (collabArtist.id !== artistId) {
            const existingArtist = await getArtistById(collabArtist.id); // see if artist exists
            // check if exists
            if (!(existingArtist.records.length > 0)) {
              const collabArtistDetails = await getArtistDetails(accessToken, collabArtist.id);
              APICallCount++;
              const newCollabArtist = formatArtistForDb({
                spotifyId: collabArtist.id,
                name: collabArtist.name,
                image: collabArtistDetails.images?.[0]?.url || '',
                popularity: collabArtistDetails.popularity || 0
              });
              await createArtist(newCollabArtist);
            }

            await safeCreateOrUpdateEdge(artistId, collabArtist.id, {
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

  await markArtistStatus(artistId, 'crawled');
}

async function crawler(seedName = null) {
  console.log(`Call Count: ${APICallCount}`)

  const accessToken = await fetchAccessToken(); // 1 hr

  let artistToCrawl;
  if (seedName) {
    const searchResults = await getArtistFromSearch(accessToken, seedName);
    const picked = searchResults.artists.items[0];
    const formatted = formatArtistForDb({
      spotifyUri: picked.uri,
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
  await crawler(); // Recursively crawl next
}

crawler(process.argv[2]).finally(async () => {
  await closeDriver();
});
