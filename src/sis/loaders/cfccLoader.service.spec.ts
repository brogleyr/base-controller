import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { CfccLoaderService } from './cfccLoader.service';
import { EllucianService } from '../../ellucian/ellucian.service';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TermDto } from 'src/dtos/transcript.dto';
import { testPhotoBase64 } from './images/testPhoto';

const env = {
    "PHOTOID_BASE_URL": "https://test-img-srv.cfcc.edu/images",
    "PHOTOID_FILE_TYPE": "jpg"
}

describe('CfccLoaderService', () => {
  let service: CfccLoaderService;
  let ellucianService: EllucianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CfccLoaderService,
        {
            provide: ConfigService,
            useValue: {
                get: jest.fn((key: string) => {
                    return env[key];
                })
            }
        },
        {
          provide: EllucianService,
          useValue: {
            getStudentId: jest.fn().mockResolvedValue({ id: '123456' }),
            getStudentTranscript: jest.fn().mockResolvedValue({
              "studentBirthDate": "2000-01-01",
              "terms": [
                { "courses": [
                  { startDate: "2023-01-10", endDate: "2023-05-30" }
                ]}
              ]
            }),
          },
        }
      ],
    }).compile();

    service = module.get<CfccLoaderService>(CfccLoaderService);
    ellucianService = module.get<EllucianService>(EllucianService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentPhoto', () => {
    it('should fetch and return base64-encoded image', async () => {
      // Use testphotoBase64 as image data for the webp image included in response
      const mockBuffer = Buffer.from(testPhotoBase64.slice(testPhotoBase64.indexOf(",") + 1), 'base64');
      const mockHttpService = service['httpService'];
      jest.spyOn(mockHttpService, 'get').mockImplementation(() => {
        const mockResponse: AxiosResponse = {
          data: mockBuffer,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {
            headers: undefined
          }
        };
        return of(mockResponse);
      });

      const base64Photo = await service.getStudentPhoto("0455838");
      expect(typeof base64Photo).toBe('string');
      expect(base64Photo.length).toBeGreaterThan(0);
    });

    it("should return null when no photo can be retrieved", async () => {
      const mockHttpService = service['httpService'];
      
      jest.spyOn(mockHttpService, 'get').mockImplementation((url: string) => {
        const mockResponse: AxiosResponse = {
          data: null,
          status: 400,
          statusText: 'Error',
          headers: {},
          config: {
            headers: undefined
          }
        };
        return of(mockResponse);
      })

      const base64Photo = await service.getStudentPhoto("0455838");

      expect(base64Photo).toBeNull();

    });

    it("should return null and log error if httpService throws", async () => {
      const mockHttpService = service['httpService'];
      jest.spyOn(mockHttpService, 'get').mockImplementation(() => {
        return throwError(() => new Error('Network error'));
      });
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = await service.getStudentPhoto("0455838");
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('getStudentId', () => {
    it('should return studentId with schoolName and studentPhoto', async () => {
      jest.spyOn(service, 'getStudentPhoto').mockResolvedValue('mock-photo');
      const result = await service.getStudentId('123456');
      expect(result).toHaveProperty('id', '123456');
      expect(result).toHaveProperty('schoolName', 'Cape Fear Community College');
      expect(result).toHaveProperty('studentPhoto', 'mock-photo');
    });
  });

  describe('getStudentTranscript', () => {
    it('should return transcript with school info and formatted dates', async () => {
      const transcript = await service.getStudentTranscript('123456');
      expect(transcript).toHaveProperty('schoolName', 'Cape Fear Community College');
      expect(transcript).toHaveProperty('schoolPhone', '910-362-7000');
      expect(transcript).toHaveProperty('schoolAddress', expect.stringContaining('Wilmington'));
      // Check formatted birth date
      expect(transcript.studentBirthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      // Check formatted course dates
      const courses = (transcript.terms[0] as TermDto).courses;
      if (Array.isArray(courses)) {
        expect(courses[0].startDate).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
        expect(courses[0].endDate).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      }
    });
  });

  describe('load', () => {
    it('should log and return null', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const result = await service.load();
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('does not implement'));
      spy.mockRestore();
    });
  });

  describe('formatTranscriptDates', () => {
    it('should format dates correctly', () => {
      const transcript = {
        studentBirthDate: '2000-01-01',
        terms: [
          {
            courses: [
              { startDate: '2023-01-10', endDate: '2023-05-30' }
            ]
          }
        ]
      };
      service.formatTranscriptDates(transcript as any);
      expect(transcript.studentBirthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(transcript.terms[0].courses[0].startDate).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      expect(transcript.terms[0].courses[0].endDate).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    });
  });
});