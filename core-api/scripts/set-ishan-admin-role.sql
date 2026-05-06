UPDATE "user"
SET role = 'admin'
WHERE email = 'ishan@regenx.io'
  AND role <> 'admin';

SELECT id, email, role, type
FROM "user"
WHERE email = 'ishan@regenx.io';
