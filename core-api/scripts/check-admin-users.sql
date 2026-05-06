\pset pager off

SELECT id, email, role, user_type, status
FROM "user"
ORDER BY id DESC
LIMIT 20;
