MATCH (a:Artist)
WHERE a.crawlStatus = 'uncrawled'
RETURN a
LIMIT 1
