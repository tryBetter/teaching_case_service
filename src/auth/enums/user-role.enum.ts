export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER_LEADER = 'TEACHER_LEADER',
  TEACHER = 'TEACHER',
  ASSISTANT_LEADER = 'ASSISTANT_LEADER',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 6,
  [UserRole.TEACHER_LEADER]: 5,
  [UserRole.TEACHER]: 4,
  [UserRole.ASSISTANT_LEADER]: 3,
  [UserRole.ASSISTANT]: 2,
  [UserRole.STUDENT]: 1,
};

export const ROLE_DESCRIPTIONS = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.TEACHER_LEADER]: '教师组长',
  [UserRole.TEACHER]: '教师',
  [UserRole.ASSISTANT_LEADER]: '助教组长',
  [UserRole.ASSISTANT]: '助教',
  [UserRole.STUDENT]: '学生',
};

/**
 * 中文角色名称到英文枚举值的映射
 * 用于兼容数据库中存储的中文角色名称
 */
export const ROLE_NAME_TO_ENUM: Record<string, UserRole> = {
  超级管理员: UserRole.ADMIN,
  管理员: UserRole.ADMIN,
  教师组长: UserRole.TEACHER_LEADER,
  教师: UserRole.TEACHER,
  助教组长: UserRole.ASSISTANT_LEADER,
  助教: UserRole.ASSISTANT,
  学生: UserRole.STUDENT,
};

/**
 * 将角色名称（中文或英文）转换为枚举值
 * @param roleName 角色名称
 * @returns 角色枚举值
 */
export function normalizeRoleName(roleName: string): UserRole {
  // 如果已经是枚举值，直接返回
  if (Object.values(UserRole).includes(roleName as UserRole)) {
    return roleName as UserRole;
  }

  // 如果是中文名称，转换为枚举值
  const enumValue = ROLE_NAME_TO_ENUM[roleName];
  if (enumValue) {
    return enumValue;
  }

  // 如果都不匹配，返回原值（会导致权限检查失败）
  console.warn(`未知的角色名称: ${roleName}`);
  return roleName as UserRole;
}
