import { Injectable } from "@nestjs/common";
import { SisLoaderService } from "./sisLoader.service";
import { TranscriptDto } from "../../dtos/transcript.dto";
import { exampleCollegeStudent, exampleHighSchoolStudent } from "./testLoaderData/exampleStudents";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { validationStudents } from "./testLoaderData/validationStudents";
import { demoStudents } from "./testLoaderData/demoStudents";
import * as sharp from "sharp";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { RedisService } from "src/services/redis.service";

@Injectable()
export class TestLoaderService extends SisLoaderService {

    constructor(
        private readonly httpService: HttpService,
        private readonly redisService: RedisService
    ) {
        super();
    };


    async load(): Promise<void> {};

    async getStudentId(studentNumber: string): Promise<StudentIdDto> {

        const redisStudentId = JSON.parse(await this.redisService.get(`${studentNumber}:studentId`));
        if (redisStudentId) {
            return redisStudentId
        }

        let exampleStudent = this.getStudent(studentNumber);

        let response;
        try {
            response = await firstValueFrom(this.httpService.get(
                'https://crms-images.s3.us-east-1.amazonaws.com/photo_id.jpg',
                {
                    headers: {
                        "Accept": "image/*",
                        "Content-Type": "image/*"
                    },
                    responseType: "arraybuffer"
                }
            ));
        }
        catch (err) {
            console.error(`Error fetching photo `, err);
        }

        console.log("Image=", response.data)
        const photoBuffer = Buffer.from(response.data);
        const compressedPhotoBuffer = await sharp(photoBuffer)
            .resize(256)
            .webp({ quality: 50 })
            .toBuffer();

        let studentId: StudentIdDto = {
            studentNumber: studentNumber,

            studentFullName: exampleStudent["studentFullName"],

            studentBirthDate: exampleStudent["studentBirthDate"],
            studentPhone: exampleStudent["studentPhone"],
            studentEmail: exampleStudent["studentEmail"],

            studentPhoto:  compressedPhotoBuffer.toString("base64"),

            guardianName: exampleStudent["guardianName"],
            guardianPhone: exampleStudent["guardianPhone"],
            guardianEmail: exampleStudent["guardianEmail"],

            emergencyName: null,
            emergencyPhone: null,
            emergencyEmail: null,
            
            gradeLevel: exampleStudent["gradeLevel"],
            graduationDate: exampleStudent["graduationDate"],
            program: exampleStudent["program"],

            schoolName: exampleStudent["schoolName"],
            schoolPhone: exampleStudent["schoolPhone"],

            barcodeType: null,
                
            barcode: null,
                
            qrCode: null,
            expiration: null
        }

        return studentId;
    }

    async getStudentTranscript(studentNumber: string): Promise<TranscriptDto> {
        const redisTranscript = JSON.parse(await this.redisService.get(`${studentNumber}:transcript`));
        if (redisTranscript) {
            return redisTranscript
        }

        return this.getStudent(studentNumber);
    }

    getStudent(studentNumber: string): any {
        if (!/^\d+$/.test(studentNumber)) {
            throw new Error(`studentNumber can only contain digits: , ${studentNumber}`);
        }

        const validationStudentNumbers = validationStudents.map(student => student.studentNumber);
        const demoStudentNumbers = demoStudents.map(student => student.studentNumber);

        if (validationStudentNumbers.includes(studentNumber)) {
            return validationStudents.find(student => student.studentNumber === studentNumber);
        }
        else if (demoStudentNumbers.includes(studentNumber)) {
            return demoStudents.find(student => student.studentNumber === studentNumber);
        }
        else if (studentNumber.length >= 4) {
            return exampleCollegeStudent;
        }
        else {
            return exampleHighSchoolStudent;
        }
    }
}
