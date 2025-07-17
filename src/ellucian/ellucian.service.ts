import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { RedisService } from '../services/redis.service';
import { jwtDecode } from 'jwt-decode';
import { StudentIdDto } from '../dtos/studentId.dto';
import { SisLoaderService } from '../sis/loaders/sisLoader.service';
import { CollegeCourseDto, CollegeTermDto, CollegeTranscriptDto, TermDto } from '../dtos/transcript.dto';

const ELLUCIAN_PERSON_API_ROUTE = "/api/persons";
const ELLUCIAN_TRANSCRIPT_API_ROUTE = "/api/student-transcript-grades";
const ELLUCIAN_GRADE_POINT_AVERAGE_API_ROUTE = "/api/student-grade-point-averages";
const ELLUCIAN_SECTIONS_API_ROUTE = "/api/sections";
const ELLUCIAN_COURSES_API_ROUTE = "/api/courses";
const ELLUCIAN_ACADEMIC_PERIOD_API_ROUTE = "/api/academic-periods";
const ELLUCIAN_ACADEMIC_GRADE_DEF_API_ROUTE = "/api/grade-definitions";
const ELLUCIAN_CREDIT_CATEGORY_ROUTE = "/api/credit-categories";
const ELLUCIAN_STUDENT_ACADEMIC_PROGRAMS_ROUTE = "/api/student-academic-programs";
const ELLUCIAN_ACADEMIC_PROGRAMS_ROUTE = "/api/academic-programs";
const ELLUCIAN_AUTH_ROUTE = "/auth";


@Injectable()
export class EllucianService extends SisLoaderService {
  private accessToken: string = '';
  private baseUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {
    super();
    this.baseUrl = this.configService.get<string>('ELLUCIAN_BASE_API_URL');
  }

  // Ellucian had not specified a load procedure
  async load(): Promise<void> {}

  async getAccessToken(): Promise<void> {
    const tokenKey = 'accessToken';
    const expiryKey = 'tokenExpiry';

    const cachedToken = await this.redisService.get(tokenKey);
    const cachedExpiry = await this.redisService.get(expiryKey);


    if (cachedToken && cachedExpiry && Number(cachedExpiry) > Date.now()) {
      this.accessToken = cachedToken;
      console.log('Using cached access token');
      return;
    }

    const authUrl = `${this.baseUrl}${ELLUCIAN_AUTH_ROUTE}`;
    console.log(`Fetching new access token from: ${authUrl}`);
    let response;
    try {
      response = await firstValueFrom(this.httpService.post(authUrl, {}, {
        headers: { Authorization: `Bearer ${this.configService.get<string>('ELLUCIAN_API_KEY')}` }
      }).pipe(map(res => res.data)));
    }
    catch (error) {
      console.log(`Could not fetch access token: ${error}`);
    }

    const decodedToken = jwtDecode(response) as any;
    const currentTime = Date.now();
    const expiresIn = Math.floor((decodedToken.exp * 1000 - currentTime) / 1000);

    await this.redisService.set(tokenKey, response, expiresIn);
    await this.redisService.set(expiryKey, (currentTime + expiresIn * 1000).toString());

    this.accessToken = response;
  }

  async getPerson(studentNumber: string): Promise<any> {
    if (!studentNumber) {
      throw new Error('Student number is required');
    }
    const criteria = encodeURIComponent(`{"credentials":[{"type":"colleaguePersonId","value":"${studentNumber}"}]}`);
    const url = `${this.baseUrl}${ELLUCIAN_PERSON_API_ROUTE}?criteria=${criteria}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).pipe(
          map(response => response.data)
        )
      );
      if (response) return response[0];
      else throw new Error("Ellucian returned no data");
    } catch (error) {
      console.error('Error fetching student information:', error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch student information');
    }
  }

  private async fetchFromEllucian(url: string): Promise<any> {
    console.log("HttpService call to: ", url);
    try {
      const response = await firstValueFrom(this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }

      }));
      if (!response.data) {
        console.error("HttpService response contained no body");
      }
      return response.data;
    } catch (error) {
      console.error(`Error accessing ${url}:`, error.message);
    }
  }

  async getStudentTranscriptGrades(studentGuid: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_TRANSCRIPT_API_ROUTE}?criteria={"student":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }

  async getStudent(studentGuid: string): Promise<any> {
    const apiRoute = this.configService.get<string>('ELLUCIAN_STUDENT_API_ROUTE', '');
    const url = `${this.baseUrl}${apiRoute}?criteria={"person":{"id":"${studentGuid}"}}`;
    return this.fetchFromEllucian(url);
  }

  async getSections(sectionIds: string[]): Promise<any> {
    let sections = {};
    await Promise.all(
      sectionIds.map(async (sectionId) => {
        const url = `${this.baseUrl}${ELLUCIAN_SECTIONS_API_ROUTE}/${sectionId}`;
        sections[sectionId] = await this.fetchFromEllucian(url);
      })
    );
    return sections;
  }

  async getCourses(courseIds: string[]): Promise<any> {
    let courses = {};
    await Promise.all(courseIds.map(async (courseId) => {
      const url = `${this.baseUrl}${ELLUCIAN_COURSES_API_ROUTE}/${courseId}`;
      courses[courseId] = await this.fetchFromEllucian(url);
    }));
    return courses;
  }

  async getAcademicPeriods(academicPeriodIds: string[]): Promise<any> {
    let academicPeriods = {};
    await Promise.all(academicPeriodIds.map(async academicPeriodId => {
      const url = `${this.baseUrl}${ELLUCIAN_ACADEMIC_PERIOD_API_ROUTE}/${academicPeriodId}`;
      academicPeriods[academicPeriodId] = await this.fetchFromEllucian(url);
    }));
    return academicPeriods;
  }

  async getGradeDefinition(gradeDefinitionId: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_ACADEMIC_GRADE_DEF_API_ROUTE}/${gradeDefinitionId}`;
    return this.fetchFromEllucian(url);
  }

  async getStudentGradePointAverages(studentGuid: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_GRADE_POINT_AVERAGE_API_ROUTE}?criteria={"student":{"id":"${studentGuid}"}}`;
    const response = await this.fetchFromEllucian(url);
    if (!response) {
      return null;
    } else {
      return response[0];
    }
  }

  async getCreditCategory(creditCategoryGuid: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_CREDIT_CATEGORY_ROUTE}/${creditCategoryGuid}`;
    return this.fetchFromEllucian(url);
  }

  async getAcademicProgram(academicProgramId: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_ACADEMIC_PROGRAMS_ROUTE}/${academicProgramId}`;
    return this.fetchFromEllucian(url);
  }

  async getStudentAcademicProgram(studentGuid: string): Promise<any> {
    const url = `${this.baseUrl}${ELLUCIAN_STUDENT_ACADEMIC_PROGRAMS_ROUTE}?criteria={"student":{"id":"${studentGuid}"}}`;
    const studentProgramsResponse = await this.fetchFromEllucian(url);
    if (!studentProgramsResponse) {
      return null;
    }
    const programGuids = studentProgramsResponse
      .filter(e => e.enrollmentStatus?.status === "active")
      .map(e => e.program?.id);
    
    let programTitles = [];
    await Promise.all(programGuids.map(async programGuid => {
      const programResponse = await this.getAcademicProgram(programGuid);
      if (programResponse.title) {
        programTitles.push(programResponse.title);
      }
    }));
    return programTitles.join(", ");
  }

  async extractTranscriptGrades(transcriptGrades: any): Promise<any> {
    if (!transcriptGrades) return {};
    let gradeDefinitionResponses = {}
    await Promise.all(
      Object.values(transcriptGrades).map(async transcriptGradeData => {
        const gradeId = transcriptGradeData["grade"]["id"] ?? null;
        if (gradeId) {
          const gradeDef = await this.getGradeDefinition(gradeId);
          const sectionId = transcriptGradeData["course"]["section"]["id"];
          gradeDefinitionResponses[sectionId] = gradeDef;
        }
    }));
    return gradeDefinitionResponses;
  }

  async extractCreditCategories(transcriptGrades: any): Promise<any> {
    if (!transcriptGrades) return {};
    let creditCategoryResponses = {}
    await Promise.all(
      Object.values(transcriptGrades).map(async transcriptGradeData => {
        const categoryId = transcriptGradeData["creditCategory"]["id"] ?? null;
        if (categoryId) {
          const creditCategory = await this.getCreditCategory(categoryId);
          const sectionId = transcriptGradeData["course"]["section"]["id"];
          creditCategoryResponses[sectionId] = creditCategory;
        }
    }));
    return creditCategoryResponses;
  }

  getAddress(ellucianPerson: any): string {
    const streetAddress = ellucianPerson.addressLines ?? "";
    const city = ellucianPerson.city ?? "";
    const state = ellucianPerson.state ?? "";
    const postalCode = ellucianPerson.zip ?? "";
    return `${streetAddress}\n${city}, ${state} ${postalCode}`;
  }

  async getStudentId(studentNumber: string): Promise<StudentIdDto> {
    await this.getAccessToken();
    const person = await this.getPerson(studentNumber);
    if (!person) {
      throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
    }

    let studentId = new StudentIdDto();
    studentId.studentNumber = person.studentsId?.studentsId ?? null;
    studentId.studentFullName = person.names[0]?.fullName ?? null;
    studentId.studentBirthDate = person.dateOfBirth ?? null;
    studentId.studentPhone = person.phones[0]?.number ?? null;
    studentId.studentEmail = person.emails.find(e => e.preference === "primary")?.address ?? null;
    studentId.expiration = this.configService.get("STUDENTID_EXPIRATION");
    return studentId;
  }

  async getStudentTranscript(studentNumber: string): Promise<CollegeTranscriptDto> {
    console.log("Getting student transcript from Ellucian for student: ", studentNumber);

    await this.getAccessToken();

    // Make initial call to ellucian to get a Person
    const ellucianPerson = await this.getPerson(studentNumber);
    if (!ellucianPerson || !ellucianPerson.id) {
      throw new HttpException("Person not found", HttpStatus.NOT_FOUND);
    }

    // Make a list of tasks to execute in parallel
    const transcriptCalls = [
      this.getStudentGradePointAverages(ellucianPerson.id),
      this.getStudentTranscriptGrades(ellucianPerson.id),
      this.getStudentAcademicProgram(ellucianPerson.id)
    ];
    // // Extract data from the tasks after all have resolved
    const [
      gradePointAverages,
      transcriptGrades,
      academicProgram
    ] = await Promise.all(transcriptCalls);


    const termIds = gradePointAverages ? gradePointAverages?.periodBased
      .filter(e => e.academicSource === "all")
      .map(e => e.academicPeriod.id) : [];

    const sectionIds = transcriptGrades ? transcriptGrades.map(e => e.course.section.id) : [];

    const secondaryCalls = [
      // Calls that require gradePointAverages (Terms)
      this.getAcademicPeriods(termIds),
      // Calls that require transcriptGrades (Sections/Courses)
      this.getSections(sectionIds),
      this.extractTranscriptGrades(transcriptGrades),
      this.extractCreditCategories(transcriptGrades)
    ]
    
    const [
      academicPeriodsResponses, 
      sectionResponses,
      gradeDefinitionResponses, 
      creditCategoryResponses,
    ] = await Promise.all(secondaryCalls);

    // Create the transcript DTO and set all of the fields
    let transcript = new CollegeTranscriptDto();
    transcript.transcriptDate = new Date().toLocaleDateString();
    transcript.transcriptComments = "A=4, B=3, C=2, D=1, F=0"
    if (studentNumber !== ellucianPerson.studentsId?.studentsId) {
      console.error("Student number given did not match student number in response");
    }
    transcript.studentNumber = studentNumber;

    transcript.studentFullName = ellucianPerson.names[0]?.fullName ?? null;
    transcript.studentBirthDate = ellucianPerson.dateOfBirth ?? null;
    transcript.studentPhone = ellucianPerson.phones[0]?.number ?? null;
    transcript.studentEmail = ellucianPerson.emails.find(e => e.preference === "primary")?.address ?? null;
    transcript.studentAddress = this.getAddress(ellucianPerson);
    transcript.studentSsn = ellucianPerson.credentials.find(e => e.type === "taxIdentificationNumber")?.value ?? null;
    transcript.program = academicProgram;

    const cumulativeGpa = gradePointAverages?.cumulative.find(e => e.academicSource === "all");
    if (cumulativeGpa) {
      transcript.gpa = cumulativeGpa.value?.toFixed(4);
      transcript.earnedCredits = cumulativeGpa.earnedCredits?.toFixed(2) ?? null;
    }

    let terms = {};

    for (const termId of termIds) {
      let term = new CollegeTermDto();

      const termGpa = gradePointAverages?.periodBased
        .find(e => e.academicPeriod.id === termId && e.academicSource === "all");
      const academicPeriod = academicPeriodsResponses[termId];

      term.termYear = academicPeriod["title"]?.match(/\d{4}/)[0] ?? null;
      term.termCredit = termGpa?.earnedCredits?.toFixed(2) ?? null;
      term.termGpa = termGpa?.value?.toFixed(4) ?? null;
      term.termSeason = academicPeriod["title"]?.replace(/\d{4}/, "").trim();
      term.termHoursPossible = termGpa?.attemptedCredits?.toFixed(2) ?? null;
      term.termHoursEarned = termGpa?.earnedCredits?.toFixed(2) ?? null;
      term.termGradePoints = termGpa?.qualityPoints?.toFixed(2) ?? null;

      term.courses = [];

      terms[termId] = term;
    }

    for (const sectionId of sectionIds) {
      let course = new CollegeCourseDto();

      const transcriptGrade = transcriptGrades.find(e => e.course.section.id === sectionId);

      course.courseCode = sectionResponses[sectionId]["secLocalGovtCodes"][0]["secLocalGovtCodes"] ?? null;
      course.courseTitle = sectionResponses[sectionId]["titles"][0]["value"] ?? null
      course.startDate = sectionResponses[sectionId]["startOn"] ?? null;
      course.endDate = sectionResponses[sectionId]["endOn"] ?? null;
      course.grade = gradeDefinitionResponses[sectionId]["grade"]["value"] ?? null;
      course.creditEarned = transcriptGrade?.credit?.earnedCredit?.toFixed(2) ?? null;
      course.gradePoints = transcriptGrade?.credit?.qualityPoint?.gpa?.toFixed(2) ?? null;
      course.transfer = creditCategoryResponses?.sectionId?.creditType === "transfer";
      course.hoursPossible = transcriptGrade?.credit?.attemptedCredit?.toFixed(2) ?? null;
      course.hoursEarned = transcriptGrade?.credit?.earnedCredit?.toFixed(2) ?? null;
      course.repeat = transcriptGrade?.credit?.repeatedSection != null && transcriptGrade.credit.repeatedSection !== "notRepeated";

      terms[transcriptGrade.academicPeriod.id].courses.push(course);
    }

    transcript.terms = Object.values(terms);

    return transcript;
  }
}