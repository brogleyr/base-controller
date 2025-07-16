import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiSkillsController } from './aiskills.controller';
import { AiSkillsService } from './aiskills.service';
import { SisModule } from '../sis/sis.module';

@Module({
  imports: [
    HttpModule,
    SisModule,
  ],
  controllers: [AiSkillsController],
  providers:    [AiSkillsService],
})
export class AiSkillsModule {}
