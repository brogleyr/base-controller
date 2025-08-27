import { Injectable } from "@nestjs/common";
import { SisLoaderService } from "../loaders/sisLoader.service";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { CourseDto, CreditRequirementDto, CteProgramDto, HighSchoolCourseDto, HighSchoolTermDto, HighSchoolTranscriptDto, TestDto, TranscriptDto } from "../../dtos/transcript.dto";
import * as Pdf from 'pdf-parse';
import { RedisService } from "../../services/redis.service";
import { PdfLoaderService } from "../data-extract/pdfLoader.service";
import * as fs from 'fs';

@Injectable()
export class PenderLoaderService extends SisLoaderService {

    constructor(
        private readonly redisService: RedisService,
    ) {
        super();
    };

    async load(): Promise<void> {
        const zipPath = await PdfLoaderService.getZipFilePath();
        if (!zipPath) {
            console.error("No zip file found in the uploads directory");
            return;
        }
    
        console.log("Loading SIS data from zip file using PDFLoader:", zipPath);
    
        let successes = 0;
        let failures = 0;
    
        const pdfBuffers = await PdfLoaderService.extractPdfs(zipPath);
    
        for (const [i, buffer] of pdfBuffers.entries()) {
            console.log(`Processing PDF #${i + 1} of ${pdfBuffers.length}`);
    
            let splitBuffers: Buffer[];
    
            try {
                splitBuffers = await PdfLoaderService.splitPdfByTranscripts(buffer, "Student Information");
                console.log(`Found ${splitBuffers.length} transcript(s) in PDF #${i + 1}`);
            } catch (err) {
                console.error(`Error splitting PDF #${i + 1} into transcripts`);
                console.error(err);
                failures++;
                continue;
            }
    
            for (const [j, singleBuffer] of splitBuffers.entries()) {
                try {
                    const [studentId, transcript] = await this.parsePenderTranscript(singleBuffer);
    
                    if (!studentId.studentNumber) {
                        throw new Error(`Missing student number for transcript index ${j} in PDF #${i + 1}`);
                    }
    
                    await this.redisService.set(`${studentId.studentNumber}:studentId`, JSON.stringify(studentId));
                    console.log(`Saved ${studentId.studentNumber}:studentId`)
                    await this.redisService.set(`${studentId.studentNumber}:transcript`, JSON.stringify(transcript));
                    console.log(`Saved ${studentId.studentNumber}:transcript`);
                    successes++;
                } catch (err) {
                    console.error(`Error parsing or saving transcript index ${j} in PDF #${i + 1}:`);
                    console.error(err);
                    failures++;
                }
            }
        }
    
        console.log(`Finished loading: ${successes} success(es), ${failures} failure(s)`);
    }

    async getStudentId(studentNumber: string): Promise<StudentIdDto> {
        const studentId = JSON.parse(await this.redisService.get(`${studentNumber}:studentId`));
        return studentId;
    }

    async getStudentTranscript(studentNumber: string): Promise<TranscriptDto> {
        const transcript = JSON.parse(await this.redisService.get(`${studentNumber}:transcript`));
        return transcript;
    }

    async parsePenderTranscript(pdfBuffer: Buffer): Promise<[StudentIdDto, HighSchoolTranscriptDto]> {
        let studentId = new StudentIdDto();
        let transcript = new HighSchoolTranscriptDto();
        let pdfParser = await Pdf(pdfBuffer);
        const pdfText = pdfParser.text.split(/(\n| {3})/)
            .map(str => String(str).trim())
            .filter(str => str);

        // transcript.tests =
        // transcript.creditSummary = 
        // transcript.ctePrograms = 

        const creditTotals: string[] = pdfText.filter(str => str.startsWith("Total"))[0]?.match(/\d+\.\d{3}/g) || [];
        if (creditTotals.length === 4) {
            
            // transcript.attemptedCredits = parseFloat(creditTotals[0]);
            // transcript.requiredCredits = parseFloat(creditTotals[2]);
            // transcript.remainingCredits = parseFloat(creditTotals[3]);
        }

        studentId.studentNumber = PdfLoaderService.stringAfterField(pdfText, "Student Number");
        studentId.studentFullName = pdfText[8] ?? null;
        studentId.studentBirthDate = PdfLoaderService.stringAfterField(pdfText, "Birthdate")?.match(/[\d\/]+/)[0];
        studentId.studentPhone = PdfLoaderService.stringAfterField(pdfText, "Tel", 1);
        studentId.gradeLevel = PdfLoaderService.stringAfterField(pdfText, "Grade");
        studentId.graduationDate = pdfText[pdfText.indexOf("Graduation Year:") + 1];
        studentId.schoolName = pdfText[1]?.substring(0, pdfText[1].indexOf(" Official Transcript"));
        studentId.schoolPhone = PdfLoaderService.stringAfterField(pdfText, "Tel",);

        transcript.transcriptDate = PdfLoaderService.stringAfterField(pdfText, "Generated on");
        transcript.transcriptComments = pdfText.slice(pdfText.indexOf("Comments"), pdfText.length - 1)?.join(" ");
        transcript.studentNumber = studentId.studentNumber;
        transcript.studentFullName = studentId.studentFullName;
        transcript.studentBirthDate = studentId.studentBirthDate;
        transcript.studentPhone = studentId.studentPhone;
        transcript.studentAddress = pdfText[12];
        transcript.studentSex = pdfText.find(str => /Sex:\s*\S+/.test(str))?.split(/Sex:\s*/)[1];
        transcript.gradeLevel = studentId.gradeLevel;
        transcript.graduationDate = studentId.graduationDate;
        transcript.program = PdfLoaderService.stringAfterField(pdfText, "Course of Study");
        transcript.schoolName = studentId.schoolName;
        transcript.schoolPhone = studentId.schoolPhone;
        transcript.schoolAddress = pdfText[7];
        transcript.schoolFax = PdfLoaderService.stringAfterField(pdfText, "Fax");
        transcript.schoolCode = PdfLoaderService.stringAfterField(pdfText, "School Code");
        transcript.gpa = PdfLoaderService.stringAfterField(pdfText, "Cumulative GPA").match(/[\d\.]+/)[0];
        // transcript.earnedCredits = creditTotals[1];

        transcript.studentStateId = PdfLoaderService.stringAfterField(pdfText, "State ID");
        transcript.gpaUnweighted = PdfLoaderService.stringAfterField(pdfText, "Cumulative GPA", 1).match(/[\d\.]+/)[0];
        transcript.classRank = PdfLoaderService.stringAfterField(pdfText, "Class Rank");
        transcript.schoolDistrict = PdfLoaderService.stringAfterField(pdfText, "District Name");
        transcript.schoolAccreditation = PdfLoaderService.stringAfterField(pdfText, "Accreditation");
        transcript.schoolCeebCode = PdfLoaderService.stringAfterField(pdfText, "School CEEB Code");
        transcript.schoolPrincipal = PdfLoaderService.stringAfterField(pdfText, "Principal");
        transcript.cirriculumProgram = PdfLoaderService.stringAfterField(pdfText, "Curriculum Program");

        // Get a list of the terms in pdfText split apart into termBlocks
        const termBlocks: string[][] = this.splitByTerms(pdfText);
        // Parse the termBlocks into terms filled with courses

        // Do this but with a for loop so we can check if the same term is repeated
        // transcript.terms = termBlocks.map(this.parseTerm.bind(this));
        let roughTerms = [];
        for (let termBlock of termBlocks) {
            let parsedTerm = this.parseTerm(termBlock);
            roughTerms.push(parsedTerm);
        }
        // Check for duplicate terms (same termYear and termSchoolName) and merge them
        let condensedTerms = [];
        for (let term of roughTerms) {
            let lastTerm = condensedTerms[condensedTerms.length - 1];
            if (lastTerm && lastTerm.termYear === term.termYear && lastTerm.termSchoolName === term.termSchoolName) {
                // Merge courses
                (lastTerm.courses as CourseDto[]).push(...term.courses);
                lastTerm.termCredit = term.termCredit;
                lastTerm.termGpa = term.termGpa;
                lastTerm.termUnweightedGpa = term.termUnweightedGpa;
            } else {
                condensedTerms.push(term);
            }
        }

        transcript.terms = condensedTerms;

        // Parse the in-progress courses
        const inProgressCourses: HighSchoolCourseDto[] = this.parseInProgressCourses(pdfText);
        // Add the in-progress courses to the last term
        (transcript.terms[transcript.terms.length - 1]?.courses as HighSchoolCourseDto[]).push(...inProgressCourses);
        
        // Mark courses in the term as transfer or not based on the school code
        for (let term of transcript.terms) {
            if (term.termSchoolCode === transcript.schoolCode) {
                for (let course of term.courses) {
                    (course as CourseDto).transfer = false;
                }
            } else {
                for (let course of term.courses) {
                    (course as CourseDto).transfer = true;
                }
            }
        }

        transcript.tests = this.parseTests(pdfText);
        transcript.creditSummary = this.parseCreditSummary(pdfText);
        // transcript.ctePrograms = new CteProgramDto();

        return [studentId, transcript];
    }

    splitByTerms(pdfText: string[]): string[][] {
        let termBlocks: string[][] = [];
        let termIndex = -1;
        let isAfterCredit = false;

        // Iterate through text looking for year (ie 2021-2022)
        // Add text to current term
        for (const str of pdfText) {
            if (/\d{4}-\d{4}/.test(str)) {
                termIndex += 1;
                termBlocks.push([]);
                isAfterCredit = false;
            }

            if (termIndex >= 0 && !isAfterCredit) {
                termBlocks[termIndex].push(str);
            }

            if (str.startsWith("Credit:")) {
                isAfterCredit = true;
            }
        }
        return termBlocks;
    }

    parseTerm(termBlock: string[]): HighSchoolTermDto {
        let term = new HighSchoolTermDto();
        try {
            const courseBlocks: string[][] = this.splitByCourses(termBlock);
            term.courses = courseBlocks.map(this.parseCourse.bind(this));

            term.termGradeLevel = PdfLoaderService.stringAfterField(termBlock, "Grade");
            term.termYear = termBlock[0];
            term.termSchoolName = PdfLoaderService.stringAfterField(termBlock, "#")?.split(" ").slice(1).join(" ");
            term.termSchoolCode = PdfLoaderService.stringAfterField(termBlock, "#")?.split(" ")[0];
            const creditLine: string[] = termBlock[termBlock.length - 1].match(/[\d\.]+/g) || [];
            if (creditLine.length === 3) {
                term.termCredit = creditLine[0];
                term.termGpa = creditLine[1];
                term.termUnweightedGpa = creditLine[2];
            }
        }
        catch (err) {
            console.error("Error parsing term block: ", err);
        }
        return term;
    }

    splitByCourses(termBlock: string[]): string[][] {
        let courseBlocks: string[][] = [];
        let currentBlock = -1;
        let isAfterCredit = false;
        for (const str of termBlock) {
            if (str.match(/\d+[A-Z]+\w+/)) { // The course code begins the string "1234X0 "
                currentBlock++;
                courseBlocks.push([]);
                isAfterCredit = false;
            }

            if (str.startsWith("Credit")) { // The credit/gpa line is the first non-course element
                isAfterCredit = true;
            }

            if (currentBlock >= 0 && !isAfterCredit) {
                courseBlocks[currentBlock].push(str);
            }
        }
        return courseBlocks;
    }

    parseCourse(courseBlock: string[]): HighSchoolCourseDto {
        let course = new HighSchoolCourseDto();
        try {
            course.courseCode = courseBlock[0].split(/\s+/)[0];

            const indexUncRec: number = courseBlock.indexOf("UNC Minimum Requirement")

            const firstTitleLine = courseBlock[0].match(/\s+(.*)/)[1]
            let followingTitleLines = "";
            for (let i = 1; i < courseBlock.length; i++) {
                // If the line is a UNC requirement or only numbers (grades), we're done
                if (i === indexUncRec || !/[a-zA-Z]+/.test(courseBlock[i])) {
                    break;
                }
                followingTitleLines += " " + courseBlock[i];
                
            } 
            course.courseTitle = firstTitleLine + followingTitleLines;
            course.flags = indexUncRec !== -1 ? ["UNC Minimum Requirement"] : [];

            const creditLine = courseBlock[courseBlock.length - 1].split(/\s+/);
            if (creditLine.length === 3) {
                course.grade = creditLine[0];
                course.creditEarned = creditLine[2];
                course.courseWeight = creditLine[1];
            }
            else if (creditLine.length === 2) {
                course.grade = courseBlock[courseBlock.length - 2] ?? null;
                course.creditEarned = creditLine[1];
                course.courseWeight = creditLine[0];
            }
            course.inProgress = false;
        }
        catch (err) {
            console.error("Error parsing course: ", err);
        }

        return course;
    }

    parseInProgressCourses(pdfText: string[]): HighSchoolCourseDto[] {
        let courses: HighSchoolCourseDto[] = [];
        let foundBlock: boolean = false;
        for (const str of pdfText) {
            if (str === "In-Progress Courses") {
                foundBlock = true;
                continue;
            }
            else if (!foundBlock) {
                continue;
            }
            else if (!/[\d\.]+$/.test(str)) {
                break;
            }

            let course = new HighSchoolCourseDto();
            course.courseCode = str.split(/\s+/)[0] ?? null;
            course.courseWeight = str.match(/[\d\.]+$/)[0] ?? null;
            course.courseTitle = str.replace(/\s*[\d\.]+$/, "").split(/\s+/).slice(1).join(" ") ?? null;
            course.inProgress = true;
            course.transfer = false;
            courses.push(course);
        }
        return courses;
    }

    parseTests(pdfText: string[]): TestDto[] {
        let tests: TestDto[] = [];
        let currentIndex = pdfText.indexOf("Standard Tests") + 1;
        if (currentIndex === -1) return null;
        while (currentIndex < pdfText.length - 1 && pdfText[currentIndex] !== "Note: Best scores displayed.") {
            let test = new TestDto();
            test.testTitle = pdfText[currentIndex];
            const match = pdfText[currentIndex + 1].match(/[Score|Result]:(.*?)\s*Date:(.*)/);
            if (match) {
                test.testScore = match[1];
                test.testDate = match[2];
            }
            tests.push(test);
            currentIndex += 2;
        }

        return tests;
    }

    parseCreditSummary(pdfText: string[]): CreditRequirementDto[] {
        let creditRequirements: CreditRequirementDto[] = [];

        let startIndex = pdfText.indexOf("Requirements") + 2;
        let endIndex = pdfText.indexOf("CTE Programs");
        
        if (startIndex === 1 || endIndex >= pdfText.length || startIndex >= endIndex) return null;

        let creditSummaryFullString = pdfText.slice(startIndex, endIndex).join("");
        const pattern = /(.*?)\s*(\d+\.\d{3})\s*(\d+\.\d{3})\s*(\d+\.\d{3})\s*(\d+\.\d{3})/g;
        let matches;
        while ((matches = pattern.exec(creditSummaryFullString)) !== null) {
            let creditRequirement = new CreditRequirementDto();
            creditRequirement.creditSubject = matches[1].trim();
            creditRequirement.creditAttempted = matches[2].trim();
            creditRequirement.creditEarned = matches[3].trim();
            creditRequirement.creditRequired = matches[4].trim();
            creditRequirement.creditRemaining = matches[5].trim();
            creditRequirements.push(creditRequirement);
        }

        return creditRequirements;
    }
}
