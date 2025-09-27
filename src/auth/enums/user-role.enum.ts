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
