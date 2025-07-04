MATCH (a:Artist)
WHERE a.name = $name
RETURN a.name AS name, a.spotifyId AS spotifyId, a.image AS image, a.popularity AS popularity, 0 AS priority
ORDER BY a.popularity DESC
LIMIT 1

UNION DISTINCT

MATCH (a:Artist)
WHERE a.nameLower = toLower($name)
RETURN a.name AS name, a.spotifyId AS spotifyId, a.image AS image, a.popularity AS popularity, 0 AS priority
ORDER BY a.popularity DESC
LIMIT 1

UNION

MATCH (a:Artist)
WHERE a.nameLower STARTS WITH toLower($name)
  AND a.nameLower <> toLower($name)
RETURN a.name AS name, a.spotifyId AS spotifyId, a.image AS image, a.popularity AS popularity, 1 AS priority  

ORDER BY priority ASC, popularity DESC
LIMIT 5
