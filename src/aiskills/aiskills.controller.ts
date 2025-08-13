// src/aiskills/aiskills.controller.ts
import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AiSkillsService } from './aiskills.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { testTranscript } from './testTranscript';

@ApiTags('AI Skills')
@Controller()
export class AiSkillsController {
  constructor(private readonly aiSkillsService: AiSkillsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'OpenAI Response' })
  @ApiResponse({ status: 404, description: 'Transcript not found' })
  async getTranscriptResponse(): Promise<string> {
    try {
      const result = await this.aiSkillsService.getTranscriptAndSendToAI(testTranscript);
      return result;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message || 'Failed to process request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('jobs')
  @ApiResponse({ status: 200, description: 'OpenAI Response' })
  @ApiResponse({ status: 404, description: 'Transcript not found' })
  async getJobAnalysis(): Promise<string> {
    try {
      const result = await this.aiSkillsService.jobsAnalysis(testTranscript);
      return result;
    } catch (error) {
      console.error(error);
      throw new HttpException(error.message || 'Failed to process request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
