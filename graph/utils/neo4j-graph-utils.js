const neo4j = require('neo4j-driver');

async function initDBConn() {
    // URI examples: 'neo4j://localhost', 'neo4j+s://xxx.databases.neo4j.io'
    const URI = 'neo4j://localhost:7687' // change this
    const USER = 'duetgraph' // change this 
    const PASSWORD = 'duetgraphtesting' // change this

    try {
        const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
        return driver
    } catch (err) {
        throw new Error(`Critical error, cannot establish db connection. Error\n${err}\nCause: ${err.cause}`)
    }
}


module.exports = { initDBConn, createArtist, createSong, findNDistance }