import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MdcpsLoaderService } from './mdcpsLoader.service';
import { RedisService } from '../../services/redis.service';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { mdcpsTestResponse } from '../../../test/sis/mdcpsTestResponse';

const env = {
    "SIS_API_BASE_URL": "TEST_URL",
    "SIS_API_CLIENT_ID": "TEST_CLIENT_ID",
    "SIS_API_CLIENT_SECRET": "TEST_CLIENT_SECRET" 
};

describe('MdcpsLoaderService', () => {
  let service: MdcpsLoaderService;
  let redisService: RedisService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        {
            provide: HttpService,
            useValue: {
                post: jest.fn(() => of({ data: { access_token: 'mock_access_token' } })),
                get: jest.fn((url: string) => {
                    if (url.includes('/demographics')) {
                        return of({ data: mdcpsTestResponse });
                    }
                    return of({ data: null });
                }),
            }
        },
      ],
    }).compile();
    service = module.get<MdcpsLoaderService>(MdcpsLoaderService);
    redisService = module.get<RedisService>(RedisService);
    httpService = module.get<HttpService>(HttpService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('load', () => {
    it('should call loadStudentData and getAccessToken', async () => {
      const getAccessTokenSpy = jest.spyOn(service as any, 'getAccessToken').mockResolvedValue(undefined);
      const loadStudentDataSpy = jest.spyOn(service as any, 'loadStudentData').mockResolvedValue(undefined);
      await service.load();
      expect(getAccessTokenSpy).toHaveBeenCalled();
      expect(loadStudentDataSpy).toHaveBeenCalled();
    });
  });

  describe('getStudentId', () => {
    it('should return StudentIdDto when found', async () => {
      const apiStudentId = mdcpsTestResponse.demographics[0].sourcedId;
      const rawStudent = { demographics: mdcpsTestResponse.demographics[0]};
      
      jest.spyOn(redisService, 'get').mockResolvedValue(apiStudentId);
      jest.spyOn(service as any, 'getAccessToken').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchFromSis').mockResolvedValue(rawStudent);

      const result = await service.getStudentId('12345678');
      expect(result).toBeDefined();
      expect(result.studentNumber).toBe("12345678");
      expect(result.studentFullName).toBe('Ram Ambo');
    });

    it('should return null if apiStudentId not found in redis', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const result = await service.getStudentId('notfound');
      expect(result).toBeNull();
    });

    it('should return null if fetchFromSis returns null', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue('someid');
      jest.spyOn(service as any, 'getAccessToken').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchFromSis').mockResolvedValue(null);
      const result = await service.getStudentId('12345678');
      expect(result).toBeNull();
    });
  });

  describe('getStudentTranscript', () => {
    it('should return TranscriptDto when found', async () => {
      const apiStudentId = mdcpsTestResponse.demographics[0].sourcedId;
      const rawStudent = { demographics: mdcpsTestResponse.demographics[0]};
      jest.spyOn(redisService, 'get').mockResolvedValue(apiStudentId);
      jest.spyOn(service as any, 'getAccessToken').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchFromSis').mockResolvedValue(rawStudent);

      const result = await service.getStudentTranscript('12345678');
      expect(result).toBeDefined();
      expect(result.studentNumber).toBe("12345678");
      expect(result.terms.length).toBeGreaterThan(0);
    });

    it('should return null if apiStudentId not found in redis', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      const result = await service.getStudentTranscript('notfound');
      expect(result).toBeNull();
    });

    it('should return null if fetchFromSis returns null', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue('someid');
      jest.spyOn(service as any, 'getAccessToken').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'fetchFromSis').mockResolvedValue(null);
      const result = await service.getStudentTranscript('12345678');
      expect(result).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should set accessToken if response contains access_token', async () => {
      const mockToken = 'mock_access_token';
      const mockHttpService = service['httpService'];
    
      jest.spyOn(mockHttpService, 'post').mockImplementation((url: string) => {
        const mockResponse: AxiosResponse = {
          data:  { access_token: mockToken } ,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {
            headers: undefined
          }
        };
        return of(mockResponse);
      });
      (service as any).accessToken = null;
      await (service as any).getAccessToken();
      // expect(mockHttpService.post).toHaveBeenCalled();
      expect((service as any).accessToken).toBe(mockToken);
    });

    it('should not set accessToken if response does not contain access_token', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(
        of<AxiosResponse<any>>({ data: {} } as AxiosResponse<any>)
      );
      (service as any).accessToken = null;
      await (service as any).getAccessToken();
      expect((service as any).accessToken).toBeNull();
    });
  });

  describe('fetchFromSis', () => {
    it('should return data if response contains data', async () => {
      const url = 'test-url';
      jest.spyOn(httpService, 'get').mockReturnValue(
        of<AxiosResponse<any>>({ data: { foo: 'bar' } } as AxiosResponse<any>)
      );
      (service as any).accessToken = 'token';
      const result = await (service as any).fetchFromSis(url);
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null if response does not contain data', async () => {
      const url = 'test-url';
      jest.spyOn(httpService, 'get').mockReturnValue(
        of<AxiosResponse<any>>({ data: null } as AxiosResponse<any>)
      );
      (service as any).accessToken = 'token';
      const result = await (service as any).fetchFromSis(url);
      expect(result).toBeNull();
    });
  });

  describe('loadStudentData', () => {
    it('should process students and increment idsSaved', async () => {
      jest.spyOn(service as any, 'fetchFromSis')
        .mockResolvedValueOnce(mdcpsTestResponse)
        .mockResolvedValueOnce(null); // End loop after first page

      const processStudentSpy = jest.spyOn(service as any, 'processStudent');
      await (service as any).loadStudentData();
      expect(processStudentSpy).toHaveBeenCalledTimes(mdcpsTestResponse.demographics.length);
      expect((service as any).idsSaved).toBeGreaterThan(0);
    });
  });

  describe('processStudent', () => {
    it('should set apiStudentId in redis if present', () => {
      const rawStudent = mdcpsTestResponse.demographics[0];
      const setSpy = jest.spyOn(redisService, 'set').mockResolvedValue(undefined as any);
      (service as any).idsSaved = 0;
      (service as any).processStudent(rawStudent);
      expect(setSpy).toHaveBeenCalledWith(
        expect.any(String),
        rawStudent.sourcedId
      );
      expect((service as any).idsSaved).toBe(1);
    });

    it('should not set apiStudentId if sourcedId is missing', () => {
      const rawStudent = { ...mdcpsTestResponse.demographics[0], sourcedId: undefined };
      const setSpy = jest.spyOn(redisService, 'set').mockResolvedValue(undefined as any);
      (service as any).idsSaved = 0;
      (service as any).processStudent(rawStudent);
      expect(setSpy).not.toHaveBeenCalled();
      expect((service as any).idsSaved).toBe(0);
    });
  });

  describe('parseStudentId', () => {
    it('should return StudentIdDto if valid', () => {
      const rawStudent = mdcpsTestResponse.demographics[0];
      const result = service.parseStudentId(rawStudent);
      expect(result).toBeDefined();
      expect(result.studentNumber).toBe("12345678");
      expect(result.studentFullName).toBe('Ram Ambo');
    });

    it('should return null if student_id missing', () => {
      const rawStudent = { ...mdcpsTestResponse.demographics[0], metadata: { custom: { api_student_id: '[]' } } };
      const result = service.parseStudentId(rawStudent);
      expect(result).toBeNull();
    });

    it('should return null if cumulativeData missing', () => {
      const rawStudent = { ...mdcpsTestResponse.demographics[0], metadata: { custom: { api_student_id: '[{"student_id":12345678}]', api_cumulative_credits_gpa: null } } };
      const result = service.parseStudentId(rawStudent);
      expect(result).toBeNull();
    });
  });

  describe('parseTranscript', () => {
    it('should return TranscriptDto if valid', () => {
      const rawStudent = mdcpsTestResponse.demographics[0];
      const result = service.parseTranscript(rawStudent);
      expect(result).toBeDefined();
      expect(result.studentNumber).toBe("12345678");
      expect(result.terms.length).toBeGreaterThan(0);
    });

    it('should return null if student_id missing', () => {
      const rawStudent = { ...mdcpsTestResponse.demographics[0], metadata: { custom: { api_student_id: '[]', api_cumulative_credits_gpa: '[{}]', api_student_course_data: '[{}]' } } };
      const result = service.parseTranscript(rawStudent);
      expect(result).toBeNull();
    });

    it('should return null if courseData or cumulativeData missing', () => {
      const rawStudent = { ...mdcpsTestResponse.demographics[0], metadata: { custom: { api_student_id: '[{"student_id":12345678}]', api_cumulative_credits_gpa: null, api_student_course_data: null } } };
      const result = service.parseTranscript(rawStudent);
      expect(result).toBeNull();
    });
  });
});