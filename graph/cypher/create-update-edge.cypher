MERGE (a1:Artist {spotifyId: $spotifyId1})
MERGE (a2:Artist {spotifyId: $spotifyId2})
MERGE (a1)-[r:COLLABORATED_WITH]-(a2)
ON CREATE SET
    r.songUris = $songUris,
    r.songNames = $songNames,
    r.albumUris = $albumUris,
    r.images = $images
ON MATCH SET
    r.songUris = r.songUris + $songUris,
    r.songNames = r.songNames + $songNames,
    r.albumUris = r.albumUris + $albumUris,
    r.images = r.images + $images
RETURN r