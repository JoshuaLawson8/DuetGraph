const neo4j = require('neo4j-driver');
const { formatEdgeForDb, formatArtistForDb } = require('./graph-schema.js');
const { loadCypherQuery } = require('./utils.js');

function initDBConn() {
    const URI = process.env.NEO4J_CONNECTION_URL
    const USER = process.env.NEO4J_USER_NAME
    const PASSWORD = process.env.NEO4J_USER_PASSWORD

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

module.exports = {neo4jRead, neo4jWrite, }