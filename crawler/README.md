# DuetGraph Crawler

The directory contains a Node.js `crawler.js` file that builds and updates a Neo4j graph of artists and their collaborations using the Spotify Web API. It discovers artists, albums, tracks, and creates collaboration relationships between artists based on shared songs.

---

## How to Run


### 1. clone this repo

```bash
git clone https://github.com/JoshuaLawson8/DuetGraph
cd crawler
npm i
```


### 2. Set up neo4j db

This database was specifically set up with a neo4j desktop instance, but probably any would do. You can download neo4j desktop [here](https://neo4j.com/download/). After downloading, create a new project, a new DMBS, and name the database. You can then fill out the following   If you would instead like to use a docker image, you can use the docker-compose file I've created at [/db/docker-compose.yml](/db/docker-compose.yaml).

You then must create a .env with the following fields:

```
NEO4J_USER_NAME=
NEO4J_USER_PASSWORD=
NEO4J_CONNECTION_URL=
NEO4J_DB_NAME=
```

The following fields do not need to be set, but are for monitoring database size. The default in the `.env.example` file is 100gbs. The crawler will quit once you hit the specified size. This was written in specifically because there is a bug in neo4j `5.26.0` where data written to the `block.big_values.db` file are not culled, which leads to runaway database size. Set these to limit the database size. DB_SIZE is in bytes btw (sorry).

```
DB_PATH=
DB_SIZE=
```

### 3. Run the crawler

`npm run crawl`
