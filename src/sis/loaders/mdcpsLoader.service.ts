import { HttpService } from "@nestjs/axios";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { TranscriptDto } from "../../dtos/transcript.dto";
import { SisLoaderService } from "./sisLoader.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom, map } from "rxjs";
import { RedisService } from "../../services/redis.service";
import { contains } from "class-validator";

@Injectable()
export class MdcpsLoaderService extends SisLoaderService implements OnModuleInit {

    accessToken;

    keyCounts;

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
        let studentId: StudentIdDto = null;
        return studentId;
    }


    async getStudentTranscript(studentNumber: string): Promise<TranscriptDto> {
        let transcript: TranscriptDto = null;
        return transcript;
    }

    private async getAccessToken() {
        const tokenKey = 'accessToken';
        const expiryKey = 'tokenExpiry';

        const cachedToken = await this.redisService.get(tokenKey);
        const cachedExpiry = await this.redisService.get(expiryKey);


        // if (cachedToken && cachedExpiry && Number(cachedExpiry) > Date.now()) {
        //     this.accessToken = cachedToken;
        //     console.log('Using cached access token');
        //     return;
        // }

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

        const currentTime = Date.now();
        const expiresIn = "expires_in" in response ? response["expires_in"] * 1000 : 0;

        await this.redisService.set(tokenKey, response, expiresIn);
        await this.redisService.set(expiryKey, (currentTime + expiresIn).toString());

        this.accessToken = response["access_token"];
    }

    private async loadStudentData(): Promise<void> {
        const baseUrl = this.configService.get("SIS_API_BASE_URL");
        const studentUrl = baseUrl + "/demographics";

        let rawStudents = [];
        let nextPage = studentUrl;
        let pageNumber = 0;
        
        while (nextPage) {
            let response;

            const redisResponse = JSON.parse(await this.redisService.get(`page:${pageNumber}`));

            if (redisResponse) {
                response = redisResponse;
            }
            else {
                response = await this.fetchFromSis(nextPage);
                this.redisService.set(`page:${pageNumber}`, JSON.stringify(response));
            }
            
            if (response === null) {
                break;
            }          

            console.log("Students in response: ", response["demographics"].length);
            rawStudents = rawStudents.concat(response["demographics"]);

            console.log("Total students: ", rawStudents.length);

            nextPage = response["pagination"]["next"];
            await new Promise(r => setTimeout(r, 1000));


            pageNumber++;
        }

        this.keyCounts = {};
        for (const rawStudent of rawStudents) {
            this.processStudent(rawStudent);
        }

        console.log(this.keyCounts);
        
    }

    private async processStudent(rawStudent: any): Promise<void> {
        const studentNumberData = JSON.parse(rawStudent.metadata?.custom?.api_student_id);
        const studentNumber = studentNumberData.length > 0 ? studentNumberData[0]["student_id"] : null;
        if (!studentNumber) {
            console.error("No student number given, unable to save student");
            return;
        }

        const courseData = JSON.parse(rawStudent.metadata?.custom?.api_student_course_data);
        const cumulativeData = JSON.parse(rawStudent.metadata?.custom?.api_cumulative_credits_gpa);

        if (!Array.isArray(courseData) || !courseData) {
            console.error("Course data was not found in student record:", studentNumber);
            return;
        }
        if (!cumulativeData) {
            console.error("Cumulative data was not found in student record:", studentNumber);
            return;
        }

        let studentId = new StudentIdDto();
        studentId.studentNumber = studentNumber;
        const firstName = cumulativeData["first_name"] ?? "";
        const lastName = cumulativeData["last_name"] ?? "";
        studentId.studentFullName = firstName && lastName ? firstName + " " + lastName : null;
        studentId.studentBirthDate = rawStudent.birthDate ?? null;
        studentId.schoolName = "Miami-Dade County Public Schools";
        
        this.redisService.set(`${studentNumber}:studentId`, JSON.stringify(studentId));

        let transcript = new TranscriptDto();
        transcript.transcriptDate = new Date().toLocaleDateString();
        transcript.studentNumber = studentNumber;
        transcript.studentBirthDate = rawStudent.birthDate ?? null;
        transcript.gpa = cumulativeData["GPA"]?? null;
        transcript.earnedCredits = cumulativeData["cumulative_credits_earned"] ?? null;


        this.redisService.set(`${studentNumber}:transcript`, JSON.stringify(transcript));        
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
}
