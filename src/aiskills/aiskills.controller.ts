import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { AiSkillsService } from './aiskills.service';

import type { jobSkillExtendedType } from './types/jobSkillsExtended.type';

@ApiTags('AI Skills')
@Controller()
export class AiSkillsController {
  constructor(private readonly aiSkillsService: AiSkillsService) {}

  /* /aiskills/job_suggest?studentId=0023 */
  @Get('job_suggest')
@ApiQuery({ name: 'studentId', required: true, type: String })
async jobSuggest(
  @Query('studentId') studentId: string,
): Promise<jobSkillExtendedType> {
  return await this.aiSkillsService.jobSuggest(studentId);
}

  /* /aiskills/skill_report?studentId=0023 */
  @Get('skill_report')
  @ApiQuery({ name: 'studentId', required: true, type: String })
  async skillReport(@Query('studentId') studentId: string): Promise<string> {
    return this.aiSkillsService.skillReport(studentId);
  }
}

