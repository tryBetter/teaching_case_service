export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  ASSISTANT = 'ASSISTANT',
  STUDENT = 'STUDENT',
}

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 4,
  [UserRole.TEACHER]: 3,
  [UserRole.ASSISTANT]: 2,
  [UserRole.STUDENT]: 1,
};

export const ROLE_DESCRIPTIONS = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.TEACHER]: '教师',
  [UserRole.ASSISTANT]: '助教',
  [UserRole.STUDENT]: '学生',
};
