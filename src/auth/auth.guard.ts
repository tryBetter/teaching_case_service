import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // 对于公开接口，仍然尝试解析 JWT token，但不强制要求认证
      try {
        return (await super.canActivate(context)) as boolean;
      } catch {
        return true; // 如果认证失败，仍然允许访问公开接口
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
