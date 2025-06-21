import { HttpService } from "@nestjs/axios";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { TranscriptDto } from "../../dtos/transcript.dto";
import { SisLoaderService } from "./sisLoader.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom, map } from "rxjs";
import { RedisService } from "../../services/redis.service";

@Injectable()
export class MdcpsLoaderService extends SisLoaderService implements OnModuleInit {

    accessToken;

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


        if (cachedToken && cachedExpiry && Number(cachedExpiry) > Date.now()) {
            this.accessToken = cachedToken;
            console.log('Using cached access token');
            return;
        }

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
        let count = 0;
        let loopLimit = 5;
        
        while (nextPage && count < loopLimit) {
            const response = await this.fetchFromSis(nextPage);
            console.log("Students in response: ", response["demographics"].length);
            rawStudents = rawStudents.concat(response["demographics"]);

            console.log("Total students: ", rawStudents.length);

            nextPage = response["pagination"]["next"];

            await new Promise(r => setTimeout(r, 1000));
            count++;
        }

        for (const rawStudent of rawStudents) {
            this.processStudent(rawStudent);
        }
        
    }

    private processStudent(rawStudent: any): void {
        const studentNumber = JSON.parse(rawStudent.metadata?.custom?.api_student_id)[0]["student_id"] ?? null;
        if (!studentNumber) {
            console.error("No student number given, skipping");
        }

        let studentId = new StudentIdDto();

        this.redisService.set(`${studentNumber}:studentId`, JSON.stringify(studentId));


        let transcript = new TranscriptDto();

        this.redisService.set(`${studentNumber}:transcript`, JSON.stringify(transcript));
        
        console.log("Saved student:", studentNumber);
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
            }
            return response.data;
        } catch (error) {
            console.error(`Error accessing ${url}:`, error.message);
            return null;
        }
    }
}
