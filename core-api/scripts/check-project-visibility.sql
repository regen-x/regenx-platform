\pset pager off

SELECT id, name, status, deleted_at, submitted_at, approved_at
FROM project
WHERE name ILIKE '%Little Growling Cafe Battery%'
ORDER BY id DESC;

SELECT id, name, status, deleted_at, submitted_at, approved_at
FROM project
ORDER BY id DESC
LIMIT 20;
