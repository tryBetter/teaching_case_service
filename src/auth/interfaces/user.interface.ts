import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  roleId: number;
  avatar?: string;
  major?: string;
  userId: number; // 保持向后兼容
}
