-- Promote project owner to admin role
-- Run this after first login to grant admin access

UPDATE users 
SET role = 'admin' 
WHERE openId = (SELECT @owner_id := '${OWNER_OPEN_ID}' FROM DUAL);

-- Verify the update
SELECT id, name, email, role, openId 
FROM users 
WHERE role = 'admin';
