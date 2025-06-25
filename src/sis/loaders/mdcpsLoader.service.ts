import { HttpService } from "@nestjs/axios";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { CourseDto, TermDto, TranscriptDto } from "../../dtos/transcript.dto";
import { SisLoaderService } from "./sisLoader.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom, map } from "rxjs";
import { RedisService } from "../../services/redis.service";

@Injectable()
export class MdcpsLoaderService extends SisLoaderService implements OnModuleInit {

    accessToken;
    idsSaved;
    transcriptsSaved;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly redisService: RedisService,
    ) {
        super();
    };

    onModuleInit() {
        // this.load();
    }
    
    async load(): Promise<void> {
        console.log("Loading student data from MDCPS SIS System");
        await this.getAccessToken();
        await this.loadStudentData();
    }

    async getStudentId(studentNumber: string): Promise<StudentIdDto> {
        const studentId: StudentIdDto = JSON.parse(await this.redisService.get(`${studentNumber}:studentId`));
        return studentId;
    }


    async getStudentTranscript(studentNumber: string): Promise<TranscriptDto> {
        const transcript: TranscriptDto = JSON.parse(await this.redisService.get(`${studentNumber}:transcript`));
        return transcript;
    }

    private async getAccessToken() {
        const baseUrl = this.configService.get("SIS_API_BASE_URL");
        const authUrl = `${baseUrl}/token`;

        const clientId = this.configService.get("SIS_API_CLIENT_ID");
        const clientSecret = this.configService.get("SIS_API_CLIENT_SECRET");
        const authEncoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const data = "grant_type=client_credentials";

        console.log(`Fetching new access token from: ${authUrl}`);
        let response;
        try {
            response = await firstValueFrom(this.httpService.post(
                authUrl, 
                data, 
                {
                    headers: { 
                        "Authorization": `Basic ${authEncoded}}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            )
            .pipe(map(res => res.data)));
        }
        catch (error) {
            console.error(`Could not fetch access token: ${error}`);
            return;
        }

        if (!response || !("access_token" in response)) {
            console.error("Access token was not present in response");
            return;
        }

        this.accessToken = response["access_token"];
    }

    private async fetchFromSis(url: string): Promise<any> {
        console.log("HttpService call to: ", url);
        try {
            const response = await firstValueFrom(this.httpService.get(url, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }

            }));
            if (!response.data) {
                console.error("HttpService response contained no body");
                return null;
            }
            return response.data;
        } catch (error) {
            console.error(`Error accessing ${url}:`, error.message);
            return null;
        }
    }

    private async loadStudentData(): Promise<void> {
        const baseUrl = this.configService.get("SIS_API_BASE_URL");
        const studentUrl = baseUrl + "/demographics";

        let nextPage = studentUrl;
        let pageNumber = 0;
        this.idsSaved = 0;
        this.transcriptsSaved = 0;
        
        while (nextPage) {
            let response = await this.fetchFromSis(nextPage);
            
            if (!response) {
                break;
            }

            const studentData = response["demographics"];

            for (const rawStudent of studentData) {
                this.processStudent(rawStudent);
            }

            nextPage = response["pagination"]["next"];
            pageNumber++;
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("Total studentids saved:", this.idsSaved);
        console.log("Total transcripts saved:", this.transcriptsSaved);
    }

    private processStudent(rawStudent: any): void {
        const studentId = this.parseStudentId(rawStudent);
        if (studentId) {
            this.redisService.set(`${studentId.studentNumber}:studentId`, JSON.stringify(studentId));
            this.idsSaved++;
        }

        const transcript = this.parseTranscript(rawStudent);
        if (transcript) {
            this.redisService.set(`${transcript.studentNumber}:transcript`, JSON.stringify(transcript)); 
            this.transcriptsSaved++;

        }
    }

    parseStudentId(rawStudent: any): StudentIdDto {
        const studentNumberData = JSON.parse(rawStudent.metadata?.custom?.api_student_id);
        const studentNumber = studentNumberData.length > 0 ? studentNumberData[0]["student_id"] : null;
        if (!studentNumber) {
            return null;
        }

        const cumulativeData = JSON.parse(rawStudent.metadata?.custom?.api_cumulative_credits_gpa);
        if (!cumulativeData) {
            return null;
        }

        let studentId = new StudentIdDto();
        studentId.studentNumber = studentNumber;
        const firstName = cumulativeData[0]["first_name"] ?? "";
        const lastName = cumulativeData[0]["last_name"] ?? "";
        studentId.studentFullName = firstName && lastName ? firstName + " " + lastName : null;
        studentId.studentBirthDate = rawStudent.birthDate ?? null;
        studentId.schoolName = "Miami-Dade County Public Schools";

        return studentId;
    }

    parseTranscript(rawStudent: any): TranscriptDto {
        const studentNumberData = JSON.parse(rawStudent.metadata?.custom?.api_student_id);
        const studentNumber = studentNumberData.length > 0 ? studentNumberData[0]["student_id"] : null;
        if (!studentNumber) {
            return null;
        }

        const courseData = JSON.parse(rawStudent.metadata?.custom?.api_student_course_data);
        const cumulativeData = JSON.parse(rawStudent.metadata?.custom?.api_cumulative_credits_gpa);
        if (!courseData || !cumulativeData) {
            return null;
        }

        let transcript = new TranscriptDto();
        transcript.transcriptDate = new Date().toLocaleDateString();
        transcript.studentNumber = studentNumber;
        transcript.studentBirthDate = rawStudent.birthDate ?? null;
        transcript.gpa = cumulativeData[0]["GPA"] ?? null;
        transcript.earnedCredits = cumulativeData[0]["cumulative_credits_earned"] ?? null;

        let termCourses = {}
        for (const rawCourse of courseData) {
            let course = new CourseDto();

            course.grade = rawCourse["Grade"];
            course.courseTitle = rawCourse["Course Title"];
            course.gradePoints = rawCourse["gpaPoints"];
            course.courseCode = rawCourse["Course Code"];
            course.creditEarned = rawCourse["credits_earned"];

            if (!(rawCourse["syear"] in termCourses)) {
                termCourses[rawCourse["syear"]] = [];
            }
            termCourses[rawCourse["syear"]].push(course);
        }

        let terms: TermDto[] = [];
        for (const termYear in termCourses) {
            let term = new TermDto();
            term.termYear = termYear;
            term.courses = termCourses[termYear];
            terms.push(term);
        }
        transcript.terms = terms;

        return transcript;
    }
}
