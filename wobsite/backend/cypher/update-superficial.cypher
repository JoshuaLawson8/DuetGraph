MATCH (a:Artist {spotifyId: $spotifyId})
SET a.popularity = $popularity,
    a.image = $image
RETURN a
