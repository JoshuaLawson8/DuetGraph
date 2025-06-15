const neo4j = require('neo4j-driver');
const { loadCypherQuery } = require('./utils.js')

const PATH_CYPHER = loadCypherQuery('shortest-path.cypher');
const NAME_PATH_CYPHER = loadCypherQuery('shortest-path-name.cypher');
const UPDATE_ARTIST_CYPHER = loadCypherQuery('update-superficial.cypher');
const FETCH_ARTISTS = loadCypherQuery('fetch-artists.cypher');
let driver;

const ready = (async () => {
    driver = await initDBConn();
})();

async function initDBConn() {
    const URI = process.env.NEO4J_CONNECTION_URL;
    const USER = process.env.NEO4J_USER_NAME;
    const PASSWORD = process.env.NEO4J_USER_PASSWORD;

    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

    while (true) {
        try {
            await driver.getServerInfo();
            console.log("Connected to Neo4j! Yippee!!");
            return driver;
        } catch (err) {
            console.log(`Neo4j not ready, retrying in 5s...\n${err}`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}


async function neo4jRead(cypher, params = {}) {
    await ready;
    const session = driver.session({
        defaultAccessMode: neo4j.session.READ,
        database: process.env.NEO4J_DB_NAME,
    })

    try {
        const result = await session.run(cypher, params);
        return result;
    } finally {
        await session.close();
    }

}

async function neo4jWrite(cypher, params = {}) {
    await ready;
    const session = driver.session({
        defaultAccessMode: neo4j.session.WRITE,
        database: process.env.NEO4J_DB_NAME,
    })

    try {
        const result = await session.run(cypher, params);
        return result;
    } finally {
        await session.close();
    }
}

async function getShortestPath(id1, id2) {
    await ready;
    const result = await neo4jRead(PATH_CYPHER, { id1, id2 });
    return result.records.map(r => r.get('p')); // assuming path is returned as `p`
}

async function getShortestPathName(name1, name2) {
    await ready;
    const result = await neo4jRead(NAME_PATH_CYPHER, { name1, name2 });
    return result.records.map(r => r.get('p')); // assuming path is returned as `p`
}

async function updateArtistDetails(spotifyId, updates) {
    await ready;
    return await neo4jWrite(UPDATE_ARTIST_CYPHER, { spotifyId, ...updates });
}

async function getArtistsFromName(name) {
    await ready;
    return await neo4jRead(FETCH_ARTISTS, { name })
}

module.exports = { neo4jRead, neo4jWrite, getShortestPath, getShortestPathName, updateArtistDetails, getArtistsFromName }