const neo4j = require('neo4j-driver');
const { formatEdgeForDb, formatArtistForDb } = require('./graph-schema');
const { loadCypherQuery } = require('./utils');


const CREATE_ARTIST_CYPHER = loadCypherQuery('create-artist.cypher');
const CREATE_EDGE_CYPHER = loadCypherQuery('create-update-edge.cypher');
const MATCH_EDGE_CYPHER = loadCypherQuery('match-edge.cypher');
const MARK_CRAWLED_CYPHER = loadCypherQuery('mark-crawled.cypher');
const MARK_INPROGRESS_CYPHER = loadCypherQuery('mark-inprogress.cypher');

function initDBConn() {
    const URI = 'neo4j://localhost:7687' // change this
    const USER = 'duetgraph' // change this 
    const PASSWORD = 'letsalllovelain' // change this

    try {
        const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
        return driver
    } catch (err) {
        throw new Error(`Critical error, cannot establish db connection. Error\n${err}\nCause: ${err.cause}`)
    }
}

const driver = initDBConn()

async function neo4jRead(cypher, params = {}) {
    const session = driver.session({
        defaultAccessMode: neo4j.session.READ,
        database: "neo4j",
    })

    try {
        const result = await session.run(cypher, params);
        return result;
    } finally {
        await session.close();
    }

}

async function neo4jWrite(cypher, params = {}) {
    const session = driver.session({
        defaultAccessMode: neo4j.session.WRITE,
        database: "neo4j",
    })

    try {
        const result = await session.run(cypher, params);
        return result;
    } finally {
        await session.close();
    }
}


/**
 * Adds a song to the COLLABORATED_WITH edge if not already present
 * @param {string} spotifyId1 - First artist's Spotify ID
 * @param {string} spotifyId2 - Second artist's Spotify ID
 * @param {object} song - Song object with songUri, name, albumUri, image
 */
async function safeCreateOrUpdateEdge(spotifyId1, spotifyId2, song) {
    // Check for existing edge
    const existing = await neo4jRead(MATCH_EDGE_CYPHER, { spotifyId1, spotifyId2 });

    if (existing.records.length > 0) {
        const edgeProps = existing.records[0].get('r')?.properties ?? {};
        const existingUris = edgeProps.songUris || [];
        if (existingUris.includes(song.songUri)) {
            return;
        }
    } 

    const formatted = formatEdgeForDb({ songs: [song] });
    const params = { spotifyId1, spotifyId2, ...formatted };
    const result = await neo4jWrite(CREATE_EDGE_CYPHER, params);
    return result;
}

/**
 * Creates or updates an artist node from Spotify metadata
 * @param {object} rawArtist - Raw artist object with spotifyUri, name, image, popularity (optional)
 * @returns {object} Neo4j Record result
 */
async function createArtist(rawArtist) {
    const formatted = formatArtistForDb(rawArtist);
    const result = await neo4jWrite(CREATE_ARTIST_CYPHER, formatted);
    return result;
}

async function getArtistByStatus(status) {
    const CYPHER = loadCypherQuery(`get-${status}-artist.cypher`);
    const result = await neo4jRead(CYPHER);
    return result.records.length > 0 ? result.records[0].get('a').properties : null;
  }
  

async function markArtistStatus(spotifyId, status) {
  const query = status === 'inprogress' ? MARK_INPROGRESS_CYPHER : MARK_CRAWLED_CYPHER;
  await neo4jWrite(query, { spotifyId });
}

async function getArtistById(spotifyId){
    const CYPHER = loadCypherQuery(`get-artist-by-id.cypher`);
    const result = await neo4jRead(CYPHER, {spotifyId});
    return result;
}


async function closeDriver(){
    await driver.close();
}



module.exports = { driver, neo4jWrite, neo4jRead, closeDriver, safeCreateOrUpdateEdge, createArtist, formatArtistForDb, formatEdgeForDb, getArtistByStatus, markArtistStatus, getArtistById }