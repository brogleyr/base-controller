import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectionModule } from './connection/connection.module';
import { CredentialModule } from './credential/credential.module';
import { VerificationModule } from './verification/verification.module';
import { PingModule } from './ping/ping.module';
import { EllucianModule } from './ellucian/ellucian.module';
import { OutOfBandModule } from './out_of_band/out_of_band.module';
import { BasicMessagesModule } from './basicmessages/basicmessages.module';
import { WorkflowModule } from './workflow/workflow.module';
import { WorkflowsModule } from './workflow/workflows/workflows.module';
import { MetadataModule } from './metadata/metadata.module';
import { SvgModule } from './svg/svg.module';
import { SisModule } from './sis/sis.module';
import { EventsGateway } from './events/events.gateway';
import { PostgresService } from './services/postgres.service';
import { RedisService } from './services/redis.service';
import { AiSkillsModule } from './aiskills/aiskills.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    ConnectionModule,
    OutOfBandModule,
    CredentialModule,
    VerificationModule,
    PingModule,
    EllucianModule,
    BasicMessagesModule,
    WorkflowModule,
    WorkflowsModule,
    MetadataModule,
    SvgModule,
    SisModule,
    AiSkillsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('WORKFLOW_DB_HOST'),
        port: parseInt(configService.get<string>('WORKFLOW_DB_PORT'), 10),
        username: configService.get<string>('WORKFLOW_DB_USER'),
        password: configService.get<string>('WORKFLOW_DB_PASSWORD'),
        database: configService.get<string>('WORKFLOW_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    RouterModule.register([
      {
        path: 'topic',
        module: AppModule,
        children: [
          { path: 'ping', module: PingModule },
          { path: 'connections', module: ConnectionModule },
          { path: 'out_of_band', module: OutOfBandModule },
          { path: 'issue_credential', module: CredentialModule },
          { path: 'present_proof_v2_0', module: VerificationModule },
          { path: 'basicmessages', module: BasicMessagesModule },
        ],
      },
      {
        path: 'sis',
        module: SisModule,
      },
      {
        path: 'workflow',
        module: WorkflowModule,
      },
      {
        path: 'aiskills',
        module: AiSkillsModule,
      },
    ]),
  ],
  providers: [
    AppService,
    EventsGateway,
    PostgresService,
    RedisService,
  ],
  controllers: [AppController],
})
export class AppModule {}