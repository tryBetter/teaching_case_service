import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}
