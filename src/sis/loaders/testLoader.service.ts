import { Injectable } from "@nestjs/common";
import { SisLoaderService } from "./sisLoader.service";
import { TranscriptDto } from "../../dtos/transcript.dto";
import { testPhotoBase64 } from "./images/testPhoto";
import { exampleCollegeStudent, exampleHighSchoolStudent } from "./testLoaderData/exampleStudents";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { validationStudents } from "./testLoaderData/validationStudents";


@Injectable()
export class TestLoaderService extends SisLoaderService {

    constructor() {
        super();
    };

    async load(): Promise<void> {};

    async getStudentId(studentNumber: string): Promise<StudentIdDto> {

        let exampleStudent = this.getStudent(studentNumber);

        let studentId: StudentIdDto = {
            studentNumber: studentNumber,

            studentFullName: exampleStudent["studentFullName"],

            studentBirthDate: exampleStudent["studentBirthDate"],
            studentPhone: exampleStudent["studentPhone"],
            studentEmail: exampleStudent["studentEmail"],

            studentPhoto:  testPhotoBase64,

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
        return this.getStudent(studentNumber);
    }

    getStudent(studentNumber: string): any {
        if (!/^\d+$/.test(studentNumber)) {
            throw new Error(`studentNumber can only contain digits: , ${studentNumber}`);
        }

        if (studentNumber === "000001") {
            return validationStudents[0];
        }
        if (studentNumber.length >= 4) {
            return exampleCollegeStudent;
        }
        else {
            return exampleHighSchoolStudent;
        }
    }
}
