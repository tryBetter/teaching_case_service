import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service';
import { REQUIRE_TEACHER_ASSISTANT_RELATION } from '../decorators/teacher-assistant.decorator';

@Injectable()
export class TeacherAssistantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireRelation = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TEACHER_ASSISTANT_RELATION,
      [context.getHandler(), context.getClass()],
    );

    if (!requireRelation) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 如果用户不是助教角色，直接通过
    if (user.role !== '助教') {
      return true;
    }

    // 从请求中获取教师ID（可能来自路径参数或请求体）
    const teacherId = this.extractTeacherId(request);

    if (!teacherId) {
      throw new BadRequestException('无法确定教师ID');
    }

    // 检查助教是否与指定教师有关联关系
    const hasRelation =
      await this.rolesService.checkAssistantCanAccessTeacherResource(
        user.userId,
        teacherId,
      );

    if (!hasRelation) {
      throw new ForbiddenException('您没有权限访问该教师的资源');
    }

    return true;
  }

  private extractTeacherId(request: any): number | null {
    // 从路径参数中获取教师ID
    if (request.params?.teacherId) {
      return parseInt(request.params.teacherId, 10);
    }

    // 从查询参数中获取教师ID
    if (request.query?.teacherId) {
      return parseInt(request.query.teacherId, 10);
    }

    // 从请求体中获取教师ID（如果是创建文章等情况）
    if (request.body?.authorId) {
      return parseInt(request.body.authorId, 10);
    }

    // 从请求体中获取教师ID（如果是媒体上传等情况）
    if (request.body?.teacherId) {
      return parseInt(request.body.teacherId, 10);
    }

    return null;
  }
}
