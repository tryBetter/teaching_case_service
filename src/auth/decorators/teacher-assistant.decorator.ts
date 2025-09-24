import { SetMetadata } from '@nestjs/common';

export const REQUIRE_TEACHER_ASSISTANT_RELATION =
  'require_teacher_assistant_relation';

/**
 * 装饰器：要求助教必须与指定教师有关联关系才能访问资源
 * 用于文章、媒体等资源的访问控制
 */
export const RequireTeacherAssistantRelation = () =>
  SetMetadata(REQUIRE_TEACHER_ASSISTANT_RELATION, true);
