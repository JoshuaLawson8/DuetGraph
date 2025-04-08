const { neo4jWrite, closeDriver } = require("../utils/neo4j-graph-utils.js");
const { formatArtistForDb, formatEdgeForDb } = require("../utils/graph-schema.js");
const fs = require('fs');
const path = require('path');
const { loadCypherQuery } = require("../utils/utils.js");

async function runTest() {
    const isCleanup = process.argv.includes('--cleanup');

    if (isCleanup) {
        const cleanupCypher = loadCypherQuery('delete-test-data.cypher');
        try {
            await neo4jWrite(cleanupCypher);
            console.log("🧹 Test data deleted.");
        } catch (err) {
            console.error("❌ Failed to delete test data:", err.message);
        }
        return;
    }

    const artist1 = {
        spotifyUri: "spotify:artist:0",
        name: "Joshtest",
        image: "https://i.scdn.co/image/test1",
        popularity: 72
    };

    const artist2 = {
        spotifyUri: "spotify:artist:1",
        name: "Fakecollab",
        image: "https://i.scdn.co/image/test2",
        popularity: 63
    };

    const song1 = {
        songs: [{
            songUri: "spotify:track:abc123",
            name: "Collab Banger",
            image: "https://i.scdn.co/image/song1",
            albumUri: "spotify:album:xyz456"
        }]
    };

    const song2 = {
        songs: [{
            songUri: "spotify:track:def456",
            name: "Another Hit",
            image: "https://i.scdn.co/image/song2",
            albumUri: "spotify:album:uvw789"
        }]
    };

    const artistCypher = loadCypherQuery('create-artist.cypher');
    const edgeCypher = loadCypherQuery('create-update-edge.cypher');

    try {
        const a1 = formatArtistForDb(artist1);
        const a2 = formatArtistForDb(artist2);

        await neo4jWrite(artistCypher, a1);
        await neo4jWrite(artistCypher, a2);
        console.log("✅ Created test artists");

        const e1 = formatEdgeForDb(song1);
        const e2 = formatEdgeForDb(song2);

        const baseParams = {
            spotifyId1: a1.spotifyId,
            spotifyId2: a2.spotifyId
        };

        await neo4jWrite(edgeCypher, { ...baseParams, ...e1 });
        console.log("🎵 Added first song to collaboration");

        await neo4jWrite(edgeCypher, { ...baseParams, ...e2 });
        console.log("🎵 Added second song to collaboration");

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

runTest().finally(async () => {
    await closeDriver();
  });
  
