MATCH (a:Artist {spotifyId: $spotifyId})
SET a.crawlStatus = 'inprogress'
