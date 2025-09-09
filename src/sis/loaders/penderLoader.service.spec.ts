import { ConfigService } from "@nestjs/config";
import { PenderLoaderService } from "./penderLoader.service";
import { Test } from "@nestjs/testing";
import { RedisService } from "../../services/redis.service";
import { PdfLoaderService } from "../data-extract/pdfLoader.service";
import * as fs from "fs";
import * as path from "path";
import { TermDto, CourseDto, HighSchoolTermDto, HighSchoolCourseDto } from "src/dtos/transcript.dto";

const env = {}

function getTestPdfsFromFolder(folder: string, limit?: number, document?: number, index?: number): string[] {
    const allFiles = fs.readdirSync(folder)
        .filter(f => f.toLowerCase().endsWith(".pdf"))
        .map(f => path.join(folder, f));

    if (document && index) {
        return allFiles.filter(f => f.includes(`temp_single_buffer_${document}_${index}.pdf`));
    }

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

        it('parses a sample transcript', async () => {
            const pdfPath = "uploads/output/temp_single_buffer_1_1.pdf";
            const pdfBuffer = fs.readFileSync(pdfPath);
            const result = await penderLoaderService.parsePenderTranscript(pdfBuffer);
            console.log(result);
        });

        it('parses multiple sample transcripts', async () => {
            const pdfPaths = getTestPdfsFromFolder("uploads/output");

            let failures: { pdf: string, errorTitle: string, message: string }[] = [];

            for (const pdfPath of pdfPaths) {
                const pdfBuffer = fs.readFileSync(pdfPath);

                let studentId: any;
                let transcript: any;

                try {
                    [studentId, transcript] = await penderLoaderService.parsePenderTranscript(pdfBuffer);
                } catch (err) {
                    failures.push({ pdf: pdfPath, errorTitle: "ParseError", message: `Parse error: ${err}` });
                    continue;
                }

                // Wrap each group of expectations in try/catch
                function check(desc: string, fn: () => void) {
                    try {
                        fn();
                    } catch (err) {
                        failures.push({ pdf: pdfPath, errorTitle: desc, message: `${desc} - ${err.message}` });
                    }
                }

                // === StudentId checks ===
                check("studentId defined", () => expect(studentId).toBeDefined());
                check("studentNumber", () => expect(studentId.studentNumber).toMatch(/^\d+$/));
                check("studentFullName", () =>
                    expect(studentId.studentFullName).toMatch(/^[a-zA-Z ,.'-]+$/),
                );
                check("studentBirthDate", () =>
                    expect(studentId.studentBirthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/),
                );
                check("studentPhone", () => {
                    if (studentId.studentPhone) expect(studentId.studentPhone).toMatch(/^[\d ()+-]+$/);
                });
                check("gradeLevel", () => expect(studentId.gradeLevel).toMatch(/^\d+$/));
                check("graduationDate", () => {
                    if (studentId.graduationDate) expect(studentId.graduationDate).toMatch(/^\d{4}$/);
                });
                check("schoolName", () => expect(studentId.schoolName).toMatch(/^[a-zA-Z ]+$/));
                check("schoolPhone", () => expect(studentId.schoolPhone).toMatch(/^[\d ()+-]+$/));

                // === Transcript checks ===
                check("transcript defined", () => expect(transcript).toBeDefined());
                check("transcriptDate", () =>
                    expect(transcript.transcriptDate).toMatch(
                        /^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} [AP]M$/,
                    ),
                );
                check("transcriptComments", () =>
                    expect(transcript.transcriptComments).toBeDefined(),
                );
                check("studentNumber match", () =>
                    expect(transcript.studentNumber).toEqual(studentId.studentNumber),
                );
                check("studentFullName match", () =>
                    expect(transcript.studentFullName).toEqual(studentId.studentFullName),
                );
                check("studentBirthDate match", () =>
                    expect(transcript.studentBirthDate).toEqual(studentId.studentBirthDate),
                );
                check("studentPhone match", () =>
                    expect(transcript.studentPhone).toEqual(studentId.studentPhone),
                );
                check("studentAddress", () => expect(transcript.studentAddress).toBeDefined());
                check("studentSex", () => expect(transcript.studentSex).toMatch(/^(M|F)$/));
                check("gradeLevel match", () =>
                    expect(transcript.gradeLevel).toEqual(studentId.gradeLevel),
                );
                check("graduationDate match", () =>
                    expect(transcript.graduationDate).toEqual(studentId.graduationDate),
                );
                check("program", () => expect(transcript.program).toBeDefined());
                check("schoolName match", () =>
                    expect(transcript.schoolName).toEqual(studentId.schoolName),
                );
                check("schoolPhone match", () =>
                    expect(transcript.schoolPhone).toEqual(studentId.schoolPhone),
                );
                check("schoolAddress", () => expect(transcript.schoolAddress).toBeDefined());
                check("schoolFax", () => expect(transcript.schoolFax).toMatch(/^[\d ()+-]+$/));
                check("schoolCode", () => expect(transcript.schoolCode).toMatch(/^\d+$/));
                check("gpa", () => {
                    if (transcript.gpa) expect(transcript.gpa).toMatch(/^\d+\.\d{3}$/);
                });
                check("studentStateId", () =>
                    expect(transcript.studentStateId).toMatch(/^\d+$/),
                );
                check("gpaUnweighted", () => {
                    if (transcript.gpaUnweighted) expect(transcript.gpaUnweighted).toMatch(/^\d+\.\d{3}$/);
                });
                check("classRank", () => expect(transcript.classRank).toBeDefined());
                check("schoolDistrict", () =>
                    expect(transcript.schoolDistrict).toBeDefined(),
                );
                check("schoolAccreditation", () =>
                    expect(transcript.schoolAccreditation).toBeDefined(),
                );
                check("schoolCeebCode", () =>
                    expect(transcript.schoolCeebCode).toMatch(/^\d+$/),
                );
                check("schoolPrincipal", () =>
                    expect(transcript.schoolPrincipal).toBeDefined(),
                );
                check("cirriculumProgram", () =>
                    expect(transcript.cirriculumProgram).toBeDefined(),
                );

                // === Terms and Courses ===
                check("terms defined", () => expect(transcript.terms).toBeDefined());
                if (transcript.terms) {
                    check("terms not empty", () =>
                        expect(transcript.terms.length).toBeGreaterThan(0),
                    );

                    for (const term of transcript.terms) {
                        check("termGradeLevel", () =>
                            expect(term.termGradeLevel).toMatch(/^\d+$/),
                        );
                        // Match XXXX-XXXX or "In-Progress"
                        check("termYear", () => expect(term.termYear).toMatch(/^(\d{4}-\d{4}|In-Progress)$/));
                        check("termSchoolName", () =>
                            expect(term.termSchoolName).toBeDefined(),
                        );
                        // School code is allowed to be undefined if not available
                        check("termSchoolCode", () => {
                            if (term.termSchoolCode) expect(term.termSchoolCode).toMatch(/^[A-Z\d]+$/);
                        });
                        if (term.termYear !== "In-Progress") {
                            check("termCredit", () =>
                                expect(term.termCredit).toMatch(/^\d*\.\d{3}$/),
                            );
                            check("termGpa", () => expect(term.termGpa).toMatch(/^\d+\.\d{3,4}$/));
                            check("termUnweightedGpa", () =>
                                expect(term.termUnweightedGpa).toMatch(/^\d+\.\d{3,4}$/),
                            );
                        }
                        check("courses defined", () => expect(term.courses).toBeDefined());
                        
                        check("courses not empty", () =>
                            expect(term.courses.length).toBeGreaterThan(0),
                        );

                        if (term.courses) {
                            let totalCredit = 0;

                            for (const course of term.courses) {
                                check("courseCode", () =>
                                    expect(course.courseCode).toMatch(/^[A-Z0-9]+$/),
                                );
                                check("courseTitle defined", () =>
                                    expect(course.courseTitle).toBeDefined(),
                                );

                                if (!course.inProgress) {
                                    check("flags <= 1", () =>
                                        expect(course.flags.length).toBeLessThanOrEqual(1),
                                    );
                                    check("course.grade", () =>
                                        expect(course.grade).toBeDefined(),
                                    );
                                    check("course.creditEarned", () => {
                                        expect(course.creditEarned).toMatch(/^\d+\.?\d*$/);
                                        totalCredit += parseFloat(course.creditEarned);
                                    }
                                    );
                                    check("courseWeight", () => {
                                        if (course.courseWeight) expect(course.courseWeight).toMatch(/^\d{1}\.\d{3,4}/);
                                    });

                                    check("courseTitle trailing grade", () => {
                                        expect(course.courseTitle).not.toMatch(/\d+\.\d+$/)
                                    })
                                }
                            }

                            // Check that total credit for term matches sum of course credits
                            check("course credit sum match", () => {
                                if (term.termCredit) {
                                    if (term.termCredit === ".000") {
                                        expect(totalCredit).toEqual(0);
                                    } else {
                                        expect(totalCredit.toFixed(3)).toEqual(term.termCredit);
                                    }
                                }
                            });
                        }
                    }
                }
            }

            // At the end, decide how you want to fail/report
            if (failures.length > 0) {
                console.log("==== Transcript parse failures ====");
                for (const f of failures) {
                    console.log(`${f.pdf} -> ${f.message}`);
                }
                console.log(`Total PDFs: ${pdfPaths.length}, Failures: ${failures.length}`);

                // Write failures to a file in csv format
                const failureLog = failures.map(f => `${f.pdf},${f.errorTitle}`).join("\n");
                

                fs.writeFileSync("uploads/transcript_parse_failures.csv", "pdf,errorTitle,message\n" + failureLog);


                // Fail the test once, after all PDFs have been checked
                throw new Error(`${failures.length} transcript(s) failed validation`);
            }
        });

    });

    describe('getStudentId', () => {

    })

    describe('getStudentTranscript', () => {

    })
})
