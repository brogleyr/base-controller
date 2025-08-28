import { HttpService } from "@nestjs/axios";
import { StudentIdDto } from "../../dtos/studentId.dto";
import { CourseDto, TermDto, TranscriptDto } from "../../dtos/transcript.dto";
import { EllucianService } from "../../ellucian/ellucian.service";
import { SisLoaderService } from "./sisLoader.service";
import { firstValueFrom } from "rxjs";
import * as sharp from "sharp";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { genericPhoto } from "./images/testPhoto";

@Injectable()
export class CfccLoaderService extends SisLoaderService {

    constructor(
            private readonly configService: ConfigService,
            private readonly httpService: HttpService,
            private readonly ellucianService: EllucianService,
        ) {
            super();
        };
    
    async load(): Promise<void> {
        console.log("This loader service does not implement an initial batch load");
        return null;
    }

    async getStudentId(studentNumber: string): Promise<StudentIdDto> {
        let studentId: StudentIdDto = await this.ellucianService.getStudentId(studentNumber);
        studentId.schoolName = "Cape Fear Community College";
        studentId.studentPhoto = await this.getStudentPhoto(studentNumber);
        return studentId;
    }


    async getStudentTranscript(studentNumber: string): Promise<TranscriptDto> {
        let transcript = await this.ellucianService.getStudentTranscript(studentNumber);
        transcript.schoolName = "Cape Fear Community College";
        transcript.schoolPhone = "910-362-7000";
        transcript.schoolAddress = "411 N. Front Street\nWilmington, NC 28401";

        this.formatTranscriptDates(transcript);

        return transcript;
    }

    async getStudentPhoto(studentNumber: string): Promise<string> {
        const imageServerBaseUrl = this.configService.get("PHOTOID_BASE_URL");
        const imageFileType = this.configService.get("PHOTOID_FILE_TYPE")
        const imageUrl = `${imageServerBaseUrl}/${studentNumber}.${imageFileType}`

        let response;
        try {
            response = await firstValueFrom(this.httpService.get(
                imageUrl,
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
            console.error(`Error fetching photo for student ${studentNumber} from ${imageUrl}:`, err);
        }

        if (!response || !response.data) {
            console.error("No image data found for student: ", studentNumber);
            console.error("Using generic image", studentNumber);
            // Use the generic image for no photo
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
                console.error(`Error fetching default photo`, err);
                return null;
            }            
        }
        // Use the photo from the server
        const photoBuffer = Buffer.from(response.data);

        const compressedPhotoBuffer = await sharp(photoBuffer)
            .resize(256)
            .webp({ quality: 50 })
            .toBuffer();

        return compressedPhotoBuffer.toString("base64");
    }

    formatTranscriptDates(transcript: TranscriptDto): void {
        // Change Birth Date to MM/DD/YYYY format
        if (transcript.studentBirthDate) {
            const birthDate = new Date(transcript.studentBirthDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            transcript.studentBirthDate = birthDate;
        }
        // Course start and end dates to MM/DD/YY format
        (transcript.terms as TermDto[]).forEach(term => {
            (term.courses as CourseDto[]).forEach(course => {
                if (course.startDate) {
                    course.startDate = new Date(course.startDate).toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit"
                    });
                }
                if (course.endDate) {
                    course.endDate = new Date(course.endDate).toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit"
                    });
                }
            });
        });

    }
}
