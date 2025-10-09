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
      const expectedHeaders = ['邮箱', '姓名', '密码', '角色'];

      // 验证标题行
      const isValidHeaders = expectedHeaders.every((header) =>
        headers.some((h) => h && h.toString().trim() === header),
      );

      if (!isValidHeaders) {
        throw new BadRequestException(
          `Excel文件标题行必须包含: ${expectedHeaders.join(', ')}`,
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
   * 生成用户导入模板Excel文件
   * @returns Excel文件的Buffer
   */
  generateUserTemplate(): Buffer {
    const headers = ['邮箱', '姓名', '密码', '角色'];
    const sampleData = [
      ['admin@example.com', '管理员', 'admin123', '超级管理员'],
      ['teacher@example.com', '张老师', 'password123', '教师'],
      ['assistant@example.com', '李助教', 'password456', '助教'],
      ['student@example.com', '王同学', 'password789', '学生'],
    ];

    const data = [headers, ...sampleData];

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    const colWidths = [
      { wch: 25 }, // 邮箱
      { wch: 15 }, // 姓名
      { wch: 20 }, // 密码
      { wch: 10 }, // 角色
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
