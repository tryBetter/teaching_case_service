import { Injectable } from '@nestjs/common';
import { StatsService } from '../../stats/stats.service';

@Injectable()
export class AdminStatsService {
  constructor(private statsService: StatsService) {}

  async getSystemStats() {
    return this.statsService.getSystemStats();
  }

  async getUserStats() {
    return this.statsService.getUserStats();
  }

  async getContentStats() {
    return this.statsService.getContentStats();
  }

  async getTimeRangeStats(startDate: Date, endDate: Date) {
    return this.statsService.getTimeRangeStats(startDate, endDate);
  }
}
