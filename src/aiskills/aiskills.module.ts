// src/aiskills/aiskills.module.ts
import { Module } from '@nestjs/common';
import { AiSkillsService } from './aiskills.service';
import { AiSkillsController } from './aiskills.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SisModule } from '../sis/sis.module';
import { CourseModule } from '../courses/course.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    SisModule,
    CourseModule,
    EnrollmentModule 
  ],
  controllers: [AiSkillsController],
  providers: [AiSkillsService],
  exports: [ AiSkillsService ]
})
export class AiSkillsModule {}
