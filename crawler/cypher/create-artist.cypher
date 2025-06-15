MERGE (a:Artist {spotifyId: $spotifyId})
ON CREATE SET
    a.name = $name,
    a.image = $image,
    a.popularity = $popularity,
    a.crawlStatus = 'uncrawled'
