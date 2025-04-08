MATCH (a:Artist)
WHERE a.spotifyId IN ["0", "1"]
DETACH DELETE a;
