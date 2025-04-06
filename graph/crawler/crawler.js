
// init db connection
const neo4j = require('neo4j-driver');
const { initDBConn } = require('../utils/neo4j-graph-utils');

const driver = initDBConn();

