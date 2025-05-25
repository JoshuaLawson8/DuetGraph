const { neo4jRead, neo4jWrite } = require('./neo4j-graph-utils.js');
const { loadCypherQuery } = require('./utils');

const PATH_CYPHER = loadCypherQuery('shortest-path.cypher');
const UPDATE_ARTIST_CYPHER = loadCypherQuery('update-superficial.cypher');

async function getShortestPath(id1, id2) {
  const result = await neo4jRead(PATH_CYPHER, { id1, id2 });
  return result.records.map(r => r.get('p')); // assuming path is returned as `p`
}

async function getShortestPathName(name1, name2) {
  const result = await neo4jRead(PATH_CYPHER, { name1, name2 });
  return result.records.map(r => r.get('p')); // assuming path is returned as `p`
}

async function updateArtistDetails(spotifyId, updates) {
  return await neo4jWrite(UPDATE_ARTIST_CYPHER, { spotifyId, ...updates });
}

module.exports = { getShortestPath, getShortestPathName, updateArtistDetails };
