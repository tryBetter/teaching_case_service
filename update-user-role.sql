-- 更新用户角色为"教师"
-- 适用于用户：999@test.com

-- 步骤1: 查看当前用户信息
SELECT u.id, u.email, u.name, u."roleId", r.name as "roleName"
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = '999@test.com';

-- 步骤2: 查看所有可用角色
SELECT id, name, description
FROM "Role"
WHERE "isActive" = true
ORDER BY id;

-- 步骤3: 更新用户角色为"教师"
UPDATE "User"
SET "roleId" = (SELECT id FROM "Role" WHERE name = '教师' LIMIT 1)
WHERE email = '999@test.com';

-- 验证更新结果
SELECT u.id, u.email, u.name, r.name as "roleName"
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = '999@test.com';
