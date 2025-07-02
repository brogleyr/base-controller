import { Injectable } from '@nestjs/common';
import { SisLoaderService } from './loaders/sisLoader.service';
import { ConfigService } from '@nestjs/config';
import { TranscriptDto } from '../dtos/transcript.dto';
import { StudentIdDto } from '../dtos/studentId.dto';
import { validate } from 'class-validator';


@Injectable()
export class SisService {

  constructor(
    private loaderService: SisLoaderService,
    private configService: ConfigService
  ) {};

  async load() {
    console.log("Loading SIS data")
    await this.loaderService.load();
    console.log("Loading SIS data finished");
  }

  async getStudentId(studentNumber: string): Promise<StudentIdDto> {
    console.log(`Getting StudentId for student: ${studentNumber}`);
    let studentId = await this.loaderService.getStudentId(studentNumber);

    if (!studentId) {
        console.log(`StudentNumber was not found: ${studentNumber}`);
        return null;
    }
    studentId.expiration = this.configService.get('STUDENTID_EXPIRATION');

    try {
      validate(studentId);
    }
    catch (error) {
      console.log(`StudentId did not have required fields: ${error}`);
      return null;
    }
    console.log(`StudentID returned successfully for ${studentNumber}`);
    return studentId;
  }

  async getStudentTranscript(studentNumber: string): Promise<TranscriptDto> {
    console.log(`Getting transcript for student: ${studentNumber}`);
    let transcript = await this.loaderService.getStudentTranscript(studentNumber);

    if (!transcript) {
      console.log(`Transcript was not found: ${studentNumber}`);
      return null;
    }

    try {
      validate(transcript);
    }
    catch (error) {
      console.log(`Transcript did not have required fields: ${error}`);
      return null;
    }

    // Convert terms into a json string for flat structure
    for (const key in transcript) {
      if (typeof transcript[key] !== "string" && transcript[key] !== null) {
        transcript[key] = JSON.stringify(transcript[key]);
      }
    }

    console.log(`Student transcript returned successfully for ${studentNumber}`);
    return transcript;
  }
}
