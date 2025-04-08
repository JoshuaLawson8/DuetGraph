MATCH (a:Artist)
WHERE a.crawlStatus = 'inprogress'
RETURN a
LIMIT 1
