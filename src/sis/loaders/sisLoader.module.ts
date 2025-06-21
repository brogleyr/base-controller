import { DynamicModule, Module } from '@nestjs/common';
import { SisLoaderService } from './sisLoader.service';
import { TestLoaderService } from './testLoader.service';
import { PdfLoaderService } from '../data-extract/pdfLoader.service';
import { RedisService } from '../../services/redis.service';
import { CsvLoaderService } from '../data-extract/csvLoader.service';
import { NhcsLoaderService } from './nhcsLoader.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EllucianModule } from 'src/ellucian/ellucian.module';
import { HttpModule } from '@nestjs/axios';
import { PenderLoaderService } from './penderLoader.service';
import { CfccLoaderService } from './cfccLoader.service';
import { MdcpsLoaderService } from './mdcpsLoader.service';

@Module({})
export class SisLoaderModule {
    static registerAsync(): DynamicModule {
        return {
            module: SisLoaderModule,
            imports: [
                ConfigModule,
                EllucianModule,
                HttpModule,
            ],
            providers: [
                RedisService,
                CsvLoaderService,
                PdfLoaderService,
                PenderLoaderService,
                TestLoaderService,
                NhcsLoaderService,
                CfccLoaderService,
                MdcpsLoaderService,
                {
                    provide: SisLoaderService,
                    inject: [
                        ConfigService,
                        TestLoaderService,
                        NhcsLoaderService,
                        PenderLoaderService,
                        CfccLoaderService,
                        MdcpsLoaderService,
                    ],
                    useFactory: (
                        configService: ConfigService,
                        test: TestLoaderService,
                        nhcs: NhcsLoaderService,
                        pender: PenderLoaderService,
                        cfcc: CfccLoaderService,
                        mdcps: MdcpsLoaderService
                    ): SisLoaderService => {
                        const type = configService.get<string>('LOAD_TYPE')?.toUpperCase();
                        switch (type) {
                            case 'TEST':
                                return test;
                            case 'NHCS':
                                return nhcs;
                            case 'PENDER':
                                return pender;
                            case 'CFCC':
                                return cfcc;
                            case 'MDCPS':
                                return mdcps;
                            default:
                                throw new Error(`Unknown LOAD_TYPE: ${type}`);
                        }
                    },
                }
            ],
            exports: [SisLoaderService],
        };
    }
}
