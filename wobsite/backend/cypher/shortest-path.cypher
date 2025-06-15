MATCH (a:Artist {spotifyId: $id1}), (b:Artist {spotifyId: $id2})
MATCH p = shortestPath((a)-[:COLLABORATED_WITH*..10]-(b))
RETURN p
