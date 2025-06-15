MATCH (a1:Artist {spotifyId: $spotifyId1})-[r:COLLABORATED_WITH]-(a2:Artist {spotifyId: $spotifyId2})
RETURN r