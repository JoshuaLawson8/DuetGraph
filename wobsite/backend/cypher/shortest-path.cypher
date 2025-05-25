MATCH (a:Artist {spotifyId: $id1}), (b:Artist {spotifyId: $id2})
MATCH p = shortestPath((a)-[:COLLABORATED_WITH*..6]-(b))
RETURN p
