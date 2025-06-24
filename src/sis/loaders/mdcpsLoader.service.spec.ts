import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MdcpsLoaderService } from './mdcpsLoader.service';
import { RedisService } from '../../services/redis.service';

const env = {
    "SIS_API_BASE_URL": "TEST_URL",
    "SIS_API_CLIENT_ID": "TEST_CLIENT_ID",
    "SIS_API_CLIENT_SECRET": "TEST_CLIENT_SECRET" 
}

describe('MdcpsLoaderService', () => {
  let service: MdcpsLoaderService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule
    ],
      providers: [
        MdcpsLoaderService,
        {
            provide: ConfigService,
            useValue: {
                get: jest.fn((key: string) => {
                    return env[key];
                })
            }
        },
        {
            provide: RedisService,
            useValue: {
                get: jest.fn(),
                set: jest.fn(),
            }
        },
      ],
    }).compile();

    service = module.get<MdcpsLoaderService>(MdcpsLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('load', () => {
    it('should ...', async () => {
      let result = await service.load();
    }, 10000);

    it("should...", async () => {
      

    });
  });
});