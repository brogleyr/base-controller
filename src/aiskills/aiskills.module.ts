// src/aiskills/aiskills.module.ts
import { Module } from '@nestjs/common';
import { AiSkillsService } from './aiskills.service';
import { AiSkillsController } from './aiskills.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SisModule } from '../sis/sis.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    SisModule 
  ],
  controllers: [AiSkillsController],
  providers: [AiSkillsService],
})
export class AiSkillsModule {}