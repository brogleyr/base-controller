// verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MetadataModule } from '../metadata/metadata.module'; // Import MetadataModule
import { WorkflowsService } from 'src/workflow/workflows/workflows.service';
import { WorkflowModule } from 'src/workflow/workflow.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';

@Module({
  imports: [HttpModule, ConfigModule, WorkflowModule, MetadataModule, EnrollmentModule], // Add MetadataModule here
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
