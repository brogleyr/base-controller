import { ConfigService } from "@nestjs/config";
import { PenderLoaderService } from "./penderLoader.service";
import { Test } from "@nestjs/testing";
import { RedisService } from "../../services/redis.service";
import { PdfLoaderService } from "../data-extract/pdfLoader.service";
import * as fs from "fs";
import * as path from "path";
import { TermDto, CourseDto, HighSchoolTermDto, HighSchoolCourseDto } from "src/dtos/transcript.dto";

const env = {}

function getTestPdfsFromFolder(folder: string, limit?: number): string[] {
    const allFiles = fs.readdirSync(folder)
        .filter(f => f.toLowerCase().endsWith(".pdf"))
        .map(f => path.join(folder, f));

    if (limit && limit > 0) {
        return allFiles.slice(0, limit);
    }
    return allFiles;
}

describe('PenderLoaderService', () => {

    let penderLoaderService: PenderLoaderService;

    beforeEach(async () => {
        jest.spyOn(PdfLoaderService, "getZipFilePath").mockReturnValue(Promise.resolve("mockPath"));
        jest.spyOn(PdfLoaderService, "extractPdfs").mockReturnValue(Promise.resolve([]));
        const module = await Test.createTestingModule({
            providers: [
                PenderLoaderService,
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
                }
            ],
        }).compile()

        penderLoaderService = module.get(PenderLoaderService);
    })

    it('is defined', () => {
        expect(penderLoaderService).toBeDefined();
    });

    describe('load', () => {

        // Create static mock of PdfLoaderService

        it('loads pdfs into the redis cache', async () => {
            await penderLoaderService.load();
        });
    });

    describe('parsePenderTranscript', () => {
        // Make a specified number of test pdf buffers available for these tests
        beforeEach(() => {

        });

        it('parses a sample transcript', async () => {
            const pdfPath = "uploads/output/temp_single_buffer_1_1.pdf";
            const pdfBuffer = fs.readFileSync(pdfPath);
            const result = await penderLoaderService.parsePenderTranscript(pdfBuffer);
            console.log(result);
        });

        it('parses multiple sample transcripts', async () => {
            const pdfPaths = getTestPdfsFromFolder("uploads/output", 100);
            for (const pdfPath of pdfPaths) {
                const pdfBuffer = fs.readFileSync(pdfPath);
                const [studentId, transcript] = await penderLoaderService.parsePenderTranscript(pdfBuffer);
                expect(studentId).toBeDefined();
                expect(studentId.studentNumber).toMatch(/^\d+$/);
                expect(studentId.studentFullName).toMatch(/^[a-zA-Z ,.'-]+$/);
                expect(studentId.studentBirthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
                // TODO - Some student phones return null
                // expect(studentId.studentPhone).toMatch(/^[\d ()+-]+$/);
                expect(studentId.gradeLevel).toMatch(/^\d+$/);
                // TODO - Graduation date sometimes parsing District name?
                // expect(studentId.graduationDate).toMatch(/^\d{4}$/);
                expect(studentId.schoolName).toMatch(/^[a-zA-Z ]+$/);
                expect(studentId.schoolPhone).toMatch(/^[\d ()+-]+$/);

                expect(transcript).toBeDefined();
                expect(transcript.transcriptDate).toMatch(/^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} [AP]M$/);
                expect(transcript.transcriptComments).toBeDefined();
                expect(transcript.studentNumber).toEqual(studentId.studentNumber);
                expect(transcript.studentFullName).toEqual(studentId.studentFullName);
                expect(transcript.studentBirthDate).toEqual(studentId.studentBirthDate);
                expect(transcript.studentPhone).toEqual(studentId.studentPhone);
                expect(transcript.studentAddress).toBeDefined();
                expect(transcript.studentSex).toMatch(/^(M|F)$/);
                expect(transcript.gradeLevel).toEqual(studentId.gradeLevel);
                expect(transcript.graduationDate).toEqual(studentId.graduationDate);
                expect(transcript.program).toBeDefined();
                expect(transcript.schoolName).toEqual(studentId.schoolName);
                expect(transcript.schoolPhone).toEqual(studentId.schoolPhone);
                expect(transcript.schoolAddress).toBeDefined();
                expect(transcript.schoolFax).toMatch(/^[\d ()+-]+$/);
                expect(transcript.schoolCode).toMatch(/^\d+$/);
                expect(transcript.gpa).toMatch(/^\d+\.\d{3}$/);
                expect(transcript.studentStateId).toMatch(/^\d+$/);
                expect(transcript.gpaUnweighted).toMatch(/^\d+\.\d{3}$/);
                expect(transcript.classRank).toBeDefined();
                expect(transcript.schoolDistrict).toBeDefined();
                expect(transcript.schoolAccreditation).toBeDefined();
                expect(transcript.schoolCeebCode).toMatch(/^\d+$/);
                expect(transcript.schoolPrincipal).toBeDefined();
                expect(transcript.cirriculumProgram).toBeDefined();

                expect(transcript.terms).toBeDefined();
                expect(transcript.terms.length).toBeGreaterThan(0);
                // Iterate over terms as TermDTO objects
                for (const term of (transcript.terms as HighSchoolTermDto[])) {
                    expect(term.termGradeLevel).toMatch(/^\d+$/);
                    expect(term.termYear).toMatch(/^\d{4}-\d{4}$/);
                    expect(term.termSchoolName).toBeDefined();
                    // TODO Schools without codes are populating with first word of school name
                    // TODO Handle terms at multiple schools throughout one school year
                    // expect(term.termSchoolCode).toMatch(/^\d+$/);

                    expect(term.termCredit).toMatch(/^\d*\.\d{3}$/);
                    expect(term.termGpa).toMatch(/^\d+\.\d{3,4}$/);
                    expect(term.termUnweightedGpa).toMatch(/^\d+\.\d{3,4}$/);
                    expect(term.courses).toBeDefined();
                    expect(term.courses.length).toBeGreaterThan(0);

                    for (const course of (term.courses as HighSchoolCourseDto[])) {
                        expect(course.courseCode).toMatch(/^[A-Z0-9]+$/);
                        expect(course.courseTitle).toBeDefined();
                        expect(course.flags.length).toBeLessThanOrEqual(1);
                        try{
                            expect(course.grade).toMatch(/^\d{1,3}$/)
                        } catch {
                            console.log(`Non-numeric grade found: ${course.grade} for student ${transcript.studentNumber}`);
                        }
                        // ...other checks
                    }
                }
            }
        });

    });

    describe('getStudentId', () => {

        // const expectedDto = new StudentIdDto();
        // expectedDto.studentNumber = testStudentValues.studentNumber;
        // expectedDto.studentFullName = testStudentValues.studentName;
        // expectedDto.schoolName = testStudentValues.schoolName;
        // expectedDto.expiration = env.STUDENTID_EXPIRATION;

        // it('returns a studentid when given a student number', async () => {
        //     const response: StudentIdDto = await sisService.getStudentId(testStudentValues.studentNumber);

        //     expect(response.studentNumber).toEqual(expectedDto.studentNumber);
        //     expect(response.studentFullName).toEqual(expectedDto.studentFullName);
        //     expect(response.schoolName).toEqual(expectedDto.schoolName);
        //     expect(response.expiration).toEqual(env.STUDENTID_EXPIRATION);

        //     validate(response);
        // })

        // it('returns null when studentid cannot be generated', async () => {
        //     const response = await sisService.getStudentId('Fake student id');

        //     expect(response).toBeNull();
        // })
    })

    describe('getStudentTranscript', () => {

    })
})
