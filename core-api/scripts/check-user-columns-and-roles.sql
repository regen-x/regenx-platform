\pset pager off

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user'
ORDER BY ordinal_position;

SELECT id, email, role, status
FROM "user"
ORDER BY id DESC
LIMIT 20;
