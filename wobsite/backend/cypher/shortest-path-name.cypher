MATCH (a:Artist {name: $name1}), (b:Artist {name: $name2})
MATCH p = shortestPath((a)-[:COLLABORATED_WITH*..9]-(b))
RETURN p
