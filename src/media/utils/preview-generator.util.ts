import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';

export class PreviewGeneratorUtil {
  /**
   * 生成图片预览（压缩后的base64）
   */
  static async generateImagePreview(buffer: Buffer): Promise<string> {
    try {
      // 使用sharp压缩图片并转换为base64
      const compressedBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 70 })
        .toBuffer();

      return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    } catch (error) {
      console.error('生成图片预览失败:', error);
      throw new Error('生成图片预览失败');
    }
  }

  /**
   * 生成视频预览（第一帧的base64）
   */
  static async generateVideoPreview(
    buffer: Buffer,
    originalName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // 创建临时文件
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);

      // 根据原始文件名获取扩展名，如果没有则使用.mp4
      const extension = path.extname(originalName) || '.mp4';
      const tempVideoPath = path.join(
        tempDir,
        `temp_video_${timestamp}_${randomString}${extension}`,
      );
      const tempImagePath = path.join(
        tempDir,
        `temp_frame_${timestamp}_${randomString}.jpg`,
      );

      try {
        console.log(`开始生成视频预览: ${originalName}`);
        // 写入临时视频文件
        fs.writeFileSync(tempVideoPath, buffer);
        console.log(`临时视频文件已创建: ${tempVideoPath}`);

        // 使用ffmpeg提取第一帧，设置超时时间
        const ffmpegCommand = ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: ['0'],
            filename: path.basename(tempImagePath),
            folder: path.dirname(tempImagePath),
            size: '512x512',
          })
          .on('start', (commandLine) => {
            console.log(`ffmpeg命令: ${commandLine}`);
          })
          .on('end', () => {
            console.log(`ffmpeg处理完成，检查输出文件: ${tempImagePath}`);
            try {
              // 等待一小段时间确保文件写入完成
              setTimeout(() => {
                void (async () => {
                  try {
                    // 读取生成的图片并转换为base64
                    if (fs.existsSync(tempImagePath)) {
                      console.log(`找到生成的图片文件: ${tempImagePath}`);
                      const imageBuffer = fs.readFileSync(tempImagePath);
                      const compressedBuffer = await sharp(imageBuffer)
                        .resize(512, 512, {
                          fit: 'inside',
                          withoutEnlargement: true,
                        })
                        .jpeg({ quality: 70 })
                        .toBuffer();

                      const base64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

                      // 清理临时文件
                      this.cleanupTempFiles([tempVideoPath, tempImagePath]);
                      console.log(`视频预览生成成功: ${originalName}`);

                      resolve(base64);
                    } else {
                      console.error(`输出文件不存在: ${tempImagePath}`);
                      this.cleanupTempFiles([tempVideoPath, tempImagePath]);
                      reject(new Error('无法提取视频帧 - 输出文件不存在'));
                    }
                  } catch (error) {
                    console.error('处理生成的图片时出错:', error);
                    this.cleanupTempFiles([tempVideoPath, tempImagePath]);
                    reject(
                      error instanceof Error ? error : new Error(String(error)),
                    );
                  }
                })();
              }, 1000); // 增加等待时间
            } catch (error) {
              this.cleanupTempFiles([tempVideoPath, tempImagePath]);
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          })
          .on('error', (error) => {
            console.error(`ffmpeg处理视频时出错: ${originalName}`, error);
            // 检查是否是ffmpeg未安装的错误
            const errorMessage = error?.message || String(error);
            if (
              errorMessage.includes('ffmpeg') ||
              errorMessage.includes('spawn') ||
              errorMessage.includes('ENOENT')
            ) {
              console.warn(`ffmpeg未安装，为视频 ${originalName} 生成默认预览`);
              // 清理临时文件
              this.cleanupTempFiles([tempVideoPath, tempImagePath]);
              // 生成一个默认的视频预览占位符
              this.generateDefaultVideoPreview().then(resolve).catch(reject);
            } else {
              this.cleanupTempFiles([tempVideoPath, tempImagePath]);
              reject(new Error(`视频处理失败: ${errorMessage}`));
            }
          });

        // 设置超时，防止无限等待
        setTimeout(() => {
          ffmpegCommand.kill('SIGKILL');
          this.cleanupTempFiles([tempVideoPath, tempImagePath]);
          reject(new Error('视频处理超时'));
        }, 30000); // 30秒超时
      } catch (error) {
        this.cleanupTempFiles([tempVideoPath, tempImagePath]);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * 生成预览图片（自动判断图片或视频）
   */
  static async generatePreview(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
  ): Promise<string> {
    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');

    if (isImage) {
      return this.generateImagePreview(buffer);
    } else if (isVideo) {
      return this.generateVideoPreview(buffer, originalName);
    } else {
      throw new Error('不支持的文件类型');
    }
  }

  /**
   * 生成默认的视频预览占位符（当ffmpeg不可用时）
   */
  private static async generateDefaultVideoPreview(): Promise<string> {
    try {
      // 创建一个简单的视频占位符图片
      const placeholderBuffer = await sharp({
        create: {
          width: 512,
          height: 288, // 16:9 比例
          channels: 3,
          background: { r: 64, g: 64, b: 64 }, // 深灰色背景
        },
      })
        .jpeg({ quality: 70 })
        .toBuffer();

      return `data:image/jpeg;base64,${placeholderBuffer.toString('base64')}`;
    } catch (error) {
      console.error('生成默认视频预览失败:', error);
      // 如果连默认预览都生成失败，返回一个最小的占位符
      const minimalPlaceholder =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      return minimalPlaceholder;
    }
  }

  /**
   * 清理临时文件
   */
  private static cleanupTempFiles(filePaths: string[]) {
    filePaths.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`清理临时文件失败: ${filePath}`, error);
      }
    });
  }
}
