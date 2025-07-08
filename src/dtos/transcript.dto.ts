

export class TranscriptDto {
    // Transcript Metadata
    transcriptDate: string;
    transcriptComments: string;

    // Student Information
    studentNumber: string;
    studentFullName: string;
    studentBirthDate: string;
    studentPhone: string;
    studentEmail: string;
    studentAddress: string;
    studentSex: string;
    studentSsn: string;
    studentContacts: string;

    gradeLevel: string;
    graduationDate: string;
    program: string;

    // School Information
    schoolName: string;
    schoolPhone: string;
    schoolAddress: string;
    schoolFax: string;
    schoolCode: string;
    schoolGradeLevels: string;

    // Grade information
    gpa: string; // Weighted GPA for High Schools
    earnedCredits: string;

    // Term Information
    terms: TermDto[] | string;
}

export class HighSchoolTranscriptDto extends TranscriptDto {

    studentStateId: string;

    // Grade and Credit Information
    gpaUnweighted: string;
    totalPoints: string;
    totalPointsUnweighted: string;
    classRank: string;

    // High School Information
    schoolDistrict: string;
    schoolDistrictPhone: string;
    schoolAccreditation: string;
    schoolCeebCode: string;
    schoolPrincipal: string;
    schoolPrincipalPhone: string;

    endorsements: string;
    mathRigor: string;

    cirriculumProgram: string;
    reqirementsRemaining: string;
    workExperience: string;
    achievements: string;

    tests: TestDto[] | string;
    creditSummary: CreditRequirementDto[] | string;
    ctePrograms: CteProgramDto[] | string;
}

export class CollegeTranscriptDto extends TranscriptDto {

}

export class TermDto {
    // Term Information
    termGradeLevel: string;
    termYear: string;
    termSchoolName: string;
    termSchoolCode: string;

    termCredit: string;
    termGpa: string;
    // Course Information
    courses: CourseDto[] | string;
}

export class HighSchoolTermDto extends TermDto {
    termUnweightedGpa: string;
}

export class CollegeTermDto extends TermDto {
    termSeason: string;
    academicStanding: string;

    termHoursPossible;
    termHoursEarned;
    termGradePoints;
    cumulativeHoursPossible;
    cumulativeHoursEarned;
    cumulativeGradePoints;
    cumulativeGpa;
}

export class CourseDto {
    courseCode: string;
    courseTitle: string;

    grade: string; // Also displayed as "Mark" on some transcripts

    creditEarned: string;
    gradePoints: string;

    startDate: string;
    endDate: string;

    transfer: boolean;
    inProgress: boolean;
    flags: string[];
}

export class HighSchoolCourseDto extends CourseDto {
    courseWeight: string;
    gradePointsUnweighted: string;
}

export class CollegeCourseDto extends CourseDto {
    hoursPossible: string;
    hoursEarned: string;

    repeat: boolean;

    schoolName: string;
}

export class TestDto {
    testTitle: string;
    testScore: string;
    testDate: string;
}

export class CreditRequirementDto {
    creditSubject: string;
    creditAttempted: string;
    creditEarned: string;
    creditRequired: string;
    creditRemaining: string;
}

export class CteProgramDto {
    programTitle: string;
    studentStatus: string;
}
