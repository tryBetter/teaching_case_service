# 教师-助教关联系统使用指南

## 🎯 系统概述

本系统实现了教师和助教之间的关联关系管理，确保助教只能访问和操作与其关联的教师的资源。这是一个细粒度的权限控制系统，符合教学管理的实际需求。

## 📋 功能特性

### 1. 关联关系管理
- ✅ **创建关联**: 为助教关联一位或多位教师
- ✅ **查询关联**: 查看教师和助教的关联关系
- ✅ **删除关联**: 移除教师和助教的关联关系
- ✅ **角色验证**: 确保只有教师和助教角色才能建立关联

### 2. 权限控制
- ✅ **细粒度控制**: 助教只能操作关联教师的资源
- ✅ **限制操作**: 助教不能删除、发布文章，不能管理媒体文件
- ✅ **动态检查**: 实时验证助教是否有权限访问特定资源

## 🔧 数据模型

### TeacherAssistant 表
```sql
CREATE TABLE "TeacherAssistant" (
  "id" SERIAL PRIMARY KEY,
  "teacherId" INTEGER NOT NULL,
  "assistantId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("assistantId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("teacherId", "assistantId")
);
```

## 🚀 API 接口

### 1. 创建教师-助教关联
```http
POST /roles/teacher-assistant
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "teacherId": 1,
  "assistantId": 2
}
```

**响应示例**:
```json
{
  "id": 1,
  "teacherId": 1,
  "assistantId": 2,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "teacher": {
    "id": 1,
    "name": "张老师",
    "email": "teacher@example.com"
  },
  "assistant": {
    "id": 2,
    "name": "李助教",
    "email": "assistant@example.com"
  }
}
```

### 2. 获取所有关联关系
```http
GET /roles/teacher-assistant
Authorization: Bearer <jwt-token>
```

### 3. 获取助教关联的教师列表
```http
GET /roles/assistant/2/teachers
Authorization: Bearer <jwt-token>
```

### 4. 获取教师关联的助教列表
```http
GET /roles/teacher/1/assistants
Authorization: Bearer <jwt-token>
```

### 5. 删除关联关系
```http
DELETE /roles/teacher-assistant/1
Authorization: Bearer <jwt-token>
```

## 🛡️ 权限控制机制

### 助教权限限制

助教角色拥有以下权限，但只能操作关联教师的资源：

#### ✅ 允许的操作
- **文章管理**:
  - ✅ 创建文章（为关联教师）
  - ✅ 查看文章（关联教师的文章）
  - ✅ 更新文章（关联教师的文章）
  - ✅ 查看文章列表（关联教师的文章）
  
- **媒体管理**:
  - ✅ 查看媒体（关联教师的媒体）
  - ✅ 媒体列表（关联教师的媒体）
  
- **评论管理**:
  - ✅ 创建评论
  - ✅ 查看评论
  - ✅ 更新评论
  - ✅ 删除评论
  - ✅ 评论列表
  
- **收藏和笔记**:
  - ✅ 完整的收藏管理
  - ✅ 完整的笔记管理

#### ❌ 禁止的操作
- **文章管理**:
  - ❌ 发布文章（article:publish）
  - ❌ 删除文章（article:delete）
  
- **媒体管理**:
  - ❌ 上传媒体（media:upload）
  - ❌ 删除媒体（media:delete）

### 权限检查流程

1. **角色检查**: 验证用户是否为助教角色
2. **关联检查**: 验证助教是否与资源所属教师有关联关系
3. **操作验证**: 检查助教是否有执行该操作的权限
4. **资源过滤**: 只返回助教有权限访问的资源

## 🔨 使用示例

### 在控制器中使用权限检查

```typescript
import { RequireTeacherAssistantRelation } from '../auth/decorators/teacher-assistant.decorator';
import { TeacherAssistantGuard } from '../auth/guards/teacher-assistant.guard';

@Controller('articles')
@UseGuards(JwtAuthGuard, TeacherAssistantGuard)
export class ArticlesController {
  
  @Get('teacher/:teacherId')
  @RequireTeacherAssistantRelation()
  async getTeacherArticles(@Param('teacherId') teacherId: number) {
    // 只有与指定教师关联的助教才能访问
    return this.articlesService.findByTeacher(teacherId);
  }
  
  @Post()
  @RequireTeacherAssistantRelation()
  async createArticle(@Body() createArticleDto: CreateArticleDto) {
    // 助教只能为关联教师创建文章
    return this.articlesService.create(createArticleDto);
  }
}
```

### 在服务中检查权限

```typescript
import { RolesService } from '../roles/roles.service';

@Injectable()
export class ArticlesService {
  constructor(private rolesService: RolesService) {}
  
  async findByTeacher(teacherId: number, assistantId: number) {
    // 检查助教是否有权限访问该教师的文章
    const hasPermission = await this.rolesService.checkAssistantCanAccessTeacherResource(
      assistantId,
      teacherId
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('您没有权限访问该教师的文章');
    }
    
    return this.prisma.article.findMany({
      where: { authorId: teacherId }
    });
  }
}
```

## 📝 最佳实践

### 1. 关联关系管理
- **一对多关系**: 一个助教可以关联多位教师
- **多对一关系**: 一位教师可以有多位助教协助
- **角色验证**: 确保只有教师和助教角色才能建立关联

### 2. 权限设计
- **最小权限原则**: 助教只能访问必要的资源
- **操作限制**: 明确禁止助教执行敏感操作
- **动态检查**: 实时验证权限，确保安全性

### 3. 错误处理
- **友好提示**: 提供清晰的错误信息
- **权限不足**: 明确告知用户权限限制
- **关联缺失**: 提示用户需要建立关联关系

## 🚨 注意事项

1. **数据一致性**: 删除用户时自动清理关联关系
2. **权限缓存**: 考虑权限检查的性能优化
3. **审计日志**: 记录权限检查的关键操作
4. **测试覆盖**: 确保权限控制的测试用例完整

## 🔄 未来扩展

1. **批量关联**: 支持批量创建教师-助教关联
2. **临时权限**: 支持临时权限授权
3. **权限继承**: 支持更复杂的权限继承关系
4. **操作日志**: 记录助教的操作历史

## 📞 技术支持

如有问题，请联系开发团队或查看相关文档：
- API文档: `http://localhost:3000/api`
- 权限管理: `/roles/teacher-assistant`
- 错误排查: 检查用户角色和关联关系
