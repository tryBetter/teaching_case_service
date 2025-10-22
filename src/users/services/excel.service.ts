import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { BatchCreateUserDto } from '../dto/batch-create-user.dto';
import { UserRole, ROLE_DESCRIPTIONS } from '../../auth/enums/user-role.enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}
  /**
   * 解析Excel文件并提取用户数据
   * @param buffer Excel文件的Buffer
   * @returns 用户数据数组
   */
  async parseUserExcel(buffer: Buffer): Promise<BatchCreateUserDto[]> {
    try {
      // 读取Excel文件
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Excel文件中没有找到工作表');
      }

      const worksheet = workbook.Sheets[sheetName];

      // 将工作表转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new BadRequestException('Excel文件至少需要包含标题行和一行数据');
      }

      // 获取标题行
      const headers = jsonData[0] as string[];
      const requiredHeaders = ['邮箱', '姓名', '密码', '角色'];
      const optionalHeaders = ['头像', '专业'];

      // 验证必需标题行
      const isValidHeaders = requiredHeaders.every((header) =>
        headers.some((h) => h && h.toString().trim() === header),
      );

      if (!isValidHeaders) {
        throw new BadRequestException(
          `Excel文件标题行必须包含: ${requiredHeaders.join(', ')}`,
        );
      }

      // 获取列索引
      const emailIndex = headers.findIndex(
        (h) => h && h.toString().trim() === '邮箱',
      );
      const nameIndex = headers.findIndex(
        (h) => h && h.toString().trim() === '姓名',
      );
      const passwordIndex = headers.findIndex(
        (h) => h && h.toString().trim() === '密码',
      );
      const roleIndex = headers.findIndex(
        (h) => h && h.toString().trim() === '角色',
      );
      const avatarIndex = headers.findIndex(
        (h) => h && h.toString().trim() === '头像',
      );
      const majorIndex = headers.findIndex(
        (h) => h && h.toString().trim() === '专业',
      );

      // 解析数据行
      const users: BatchCreateUserDto[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as (string | number | null | undefined)[];

        // 跳过空行
        if (!row || row.length === 0 || !row[emailIndex]) {
          continue;
        }

        const email = row[emailIndex]?.toString().trim();
        const name = row[nameIndex]?.toString().trim();
        const password = row[passwordIndex]?.toString().trim();
        const roleStr = row[roleIndex]?.toString().trim();
        const avatar =
          avatarIndex >= 0 ? row[avatarIndex]?.toString().trim() : undefined;
        const major =
          majorIndex >= 0 ? row[majorIndex]?.toString().trim() : undefined;

        // 验证必填字段
        if (!email) {
          throw new BadRequestException(`第${i + 1}行: 邮箱不能为空`);
        }
        if (!password) {
          throw new BadRequestException(`第${i + 1}行: 密码不能为空`);
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new BadRequestException(`第${i + 1}行: 邮箱格式不正确`);
        }

        // 验证角色并查询角色ID
        let roleId: number | undefined = undefined;
        if (roleStr) {
          const roleMapping: { [key: string]: UserRole } = {
            管理员: UserRole.ADMIN,
            超级管理员: UserRole.ADMIN,
            ADMIN: UserRole.ADMIN,
            教师组长: UserRole.TEACHER_LEADER,
            TEACHER_LEADER: UserRole.TEACHER_LEADER,
            教师: UserRole.TEACHER,
            TEACHER: UserRole.TEACHER,
            助教组长: UserRole.ASSISTANT_LEADER,
            ASSISTANT_LEADER: UserRole.ASSISTANT_LEADER,
            助教: UserRole.ASSISTANT,
            ASSISTANT: UserRole.ASSISTANT,
            学生: UserRole.STUDENT,
            STUDENT: UserRole.STUDENT,
          };

          const mappedRole = roleMapping[roleStr];
          if (mappedRole) {
            // 根据角色枚举值查询数据库中的角色ID
            const roleName = ROLE_DESCRIPTIONS[mappedRole];
            const roleRecord = await this.prisma.role.findFirst({
              where: { name: roleName, isActive: true },
            });
            if (roleRecord) {
              roleId = roleRecord.id;
            }
          }
        }

        users.push({
          email,
          name: name || undefined,
          password,
          roleId,
          avatar: avatar || undefined,
          major: major || undefined,
        });
      }

      if (users.length === 0) {
        throw new BadRequestException('Excel文件中没有找到有效的用户数据');
      }

      return users;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Excel文件解析失败: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * 生成用户导入模板Excel文件（动态加载所有角色示例）
   * @returns Excel文件的Buffer
   */
  async generateUserTemplate(): Promise<Buffer> {
    const headers = ['邮箱', '姓名', '密码', '角色'];

    // 从数据库获取所有角色（排除超级管理员）
    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        name: { not: '超级管理员' }, // 排除超级管理员
      },
      orderBy: { id: 'asc' },
    });

    // 为每个角色生成一个示例行
    const sampleData: string[][] = [];

    // 示例用户名模板
    const nameTemplates = ['张', '李', '王', '赵', '刘', '陈'];
    const nameTypes: Record<string, string> = {
      管理员: '管理员',
      教师组长: '教师组长',
      教师: '老师',
      助教组长: '助教组长',
      助教: '助教',
      学生: '同学',
    };

    roles.forEach((role, index) => {
      const namePrefix = nameTemplates[index % nameTemplates.length];
      const nameSuffix = nameTypes[role.name] ?? '用户';
      const sampleName = `${namePrefix}${nameSuffix}`;
      const sampleEmail = `${role.name.toLowerCase().replace(/[^a-z]/g, '')}${index + 1}@example.com`;
      const samplePassword = `password${index + 1}23`;

      sampleData.push([sampleEmail, sampleName, samplePassword, role.name]);
    });

    // 如果没有角色数据，使用默认示例
    if (sampleData.length === 0) {
      sampleData.push(
        ['admin@example.com', '张管理员', 'password123', '管理员'],
        ['teacher@example.com', '李老师', 'password223', '教师'],
        ['student@example.com', '王同学', 'password323', '学生'],
      );
    }

    const data = [headers, ...sampleData];

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const colWidths = [
      { wch: 30 }, // 邮箱（加宽以容纳较长的邮箱）
      { wch: 15 }, // 姓名
      { wch: 20 }, // 密码
      { wch: 15 }, // 角色（加宽以容纳"教师组长"等长角色名）
    ];
    worksheet['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户导入模板');

    // 生成Excel文件Buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    return excelBuffer;
  }
}
