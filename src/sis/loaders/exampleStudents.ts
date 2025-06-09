import { CourseService } from "src/courses/course.service";
import { CollegeCourseDto, CollegeTermDto, CollegeTranscriptDto, CreditRequirementDto, CteProgramDto, HighSchoolCourseDto, HighSchoolTermDto, HighSchoolTranscriptDto, TestDto } from "src/dtos/transcript.dto";


const middleSchoolCourses: HighSchoolCourseDto[] = [
  {
    courseCode: "MATH-8A",
    courseTitle: "Algebra I",
    grade: "90",
    courseWeight: "0.0",
    creditEarned: "1",
    gradePoints: "0",
    gradePointsUnweighted: "0",
    transfer: true,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "SCI-8B",
    courseTitle: "Earth & Environmental Science",
    grade: "90",
    courseWeight: "0.0",
    creditEarned: "1",
    gradePoints: "0",
    gradePointsUnweighted: "0",
    transfer: true,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "ENG-8C",
    courseTitle: "English 8",
    grade: "90",
    courseWeight: "0.0",
    creditEarned: "1",
    gradePoints: "0",
    gradePointsUnweighted: "0",
    transfer: true,
    inProgress: false,
    flags: [],
  }
];

const freshmanCourses: HighSchoolCourseDto[] = [
  {
    courseCode: "MATH-9A",
    courseTitle: "Geometry",
    grade: "99",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.5",
    gradePointsUnweighted: "4.0",
    transfer: false,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "ENG-9B",
    courseTitle: "English I",
    grade: "90",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.0",
    gradePointsUnweighted: "3.5",
    transfer: false,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "SCI-9C",
    courseTitle: "Biology",
    grade: "90",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.0",
    gradePointsUnweighted: "3.5",
    transfer: false,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "SOC-9D",
    courseTitle: "World History",
    grade: "90",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.0",
    gradePointsUnweighted: "3.5",
    transfer: false,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "PE-9E",
    courseTitle: "Health & Physical Education",
    grade: "90",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.0",
    gradePointsUnweighted: "3.5",
    transfer: false,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "ART-9F",
    courseTitle: "Visual Arts I",
    grade: "90",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.0",
    gradePointsUnweighted: "3.5",
    transfer: false,
    inProgress: false,
    flags: [],
  },
  {
    courseCode: "LANG-9G",
    courseTitle: "Spanish I",
    grade: "90",
    courseWeight: "1.0",
    creditEarned: "1",
    gradePoints: "4.0",
    gradePointsUnweighted: "3.5",
    transfer: false,
    inProgress: false,
    flags: [],
  }
];

const highSchoolTerms: HighSchoolTermDto[] = [
  {
    termGradeLevel: "8",
    termYear: "2020-2021",
    termSchoolName: "DigiCred Middle School",
    termSchoolCode: "MS001",
    termCredit: "3.0",
    termGpa: "0.0",
    termUnweightedGpa: "0.0",
    courses: middleSchoolCourses
  },
  {
    termGradeLevel: "9",
    termYear: "2021-2022",
    termSchoolName: "DigiCred High School",
    termSchoolCode: "HS001",
    termCredit: "7.0",
    termGpa: "4.0",
    termUnweightedGpa: "3.7",
    courses: freshmanCourses
  }
];

const highSchoolCreditSummary: CreditRequirementDto[] = [
  {
    creditSubject: "Mathematics",
    creditAttempted: "8.0",
    creditEarned: "8.0",
    creditRequired: "4.0",
    creditRemaining: "0.0"
  },
  {
    creditSubject: "English",
    creditAttempted: "4.0",
    creditEarned: "4.0",
    creditRequired: "4.0",
    creditRemaining: "0.0"
  },
  {
    creditSubject: "Science",
    creditAttempted: "4.0",
    creditEarned: "4.0",
    creditRequired: "3.0",
    creditRemaining: "0.0"
  },
  {
    creditSubject: "Social Studies",
    creditAttempted: "3.0",
    creditEarned: "3.0",
    creditRequired: "3.0",
    creditRemaining: "0.0"
  },
  {
    creditSubject: "Electives",
    creditAttempted: "9.0",
    creditEarned: "9.0",
    creditRequired: "8.0",
    creditRemaining: "0.0"
  }
];

const highSchoolTests: TestDto[] = [
  {
    testTitle: "SAT",
    testScore: "1420",
    testDate: "2024-10-15"
  },
  {
    testTitle: "ACT",
    testScore: "32",
    testDate: "2024-09-01"
  }
];

const highSchoolCtePrograms: CteProgramDto[] = [
  {
    programTitle: "Data Science Pathway",
    studentStatus: "Completed"
  }
];

export const exampleHighSchoolStudent: HighSchoolTranscriptDto = {
  // Transcript Metadata
  transcriptDate: "2025-04-12",
  transcriptComments: "Not a real transcript, all grades are simulated",

  // Student Information
  studentNumber: "0023",
  studentFullName: "Michael Jordan",
  studentBirthDate: "2000-01-01",
  studentPhone: "(555)-555-5555",
  studentEmail: "mj@digicred.com",
  studentAddress: "1111 Basketball Ave, Wilmington, NC",
  studentSex: "Male",
  studentSsn: "111-11-1111",
  studentContacts: "Guardian: Michael Jordan Sr, (555)-555-5555",

  gradeLevel: "10",
  graduationDate: "2025",
  program: "Mathematics",

  // School Information
  schoolName: "DigiCred High School",
  schoolPhone: "(555)-555-5555",
  schoolAddress: "14328 NC Hwy 210, Rocky Point, NC 28457",
  schoolFax: "(555)-555-5555",
  schoolCode: "DC123",
  schoolGradeLevels: "9–12",

  // Grade information
  gpa: "4.1",
  earnedCredits: "28.0",

  // High School-specific fields
  studentStateId: "NC-20230023",
  gpaUnweighted: "3.8",
  totalPoints: "115.0",
  totalPointsUnweighted: "106.4",
  classRank: "18 of 200",

  schoolDistrict: "Secure County Public Schools",
  schoolDistrictPhone: "(555)-555-5556",
  schoolAccreditation: "SA",
  schoolCeebCode: "555555",
  schoolPrincipal: "John Meyers",
  schoolPrincipalPhone: "(555)-555-5555",

  endorsements: "STEM",
  mathRigor: "Completed AP Calculus and Statistics by 11th grade",
  cirriculumProgram: "Advanced Mathematics Concentration",
  reqirementsRemaining: "0.0",
  workExperience: "Summer internship at DigiData Analytics",
  achievements: "Math Olympiad State Finalist, AP Scholar",

  tests: highSchoolTests,
  creditSummary: highSchoolCreditSummary,
  ctePrograms: highSchoolCtePrograms,

  // Term Information
  terms: highSchoolTerms
};


const collegeCourses: CollegeCourseDto[] = [
    {
        courseCode: "CSCI-101",
        courseTitle: "Introduction to Programming",
        grade: null,
        creditEarned: "3",
        gradePoints: null,
        hoursPossible: null,
        hoursEarned: null,
        transfer: true,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred State"
    },
    {
        courseCode: "MATH-110",
        courseTitle: "College Algebra",
        grade: null,
        creditEarned: "3",
        gradePoints: null,
        hoursPossible: null,
        hoursEarned: null,
        transfer: true,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred State"
    },
    {
        courseCode: "ENGL-101",
        courseTitle: "English Composition I",
        grade: null,
        creditEarned: "3",
        gradePoints: null,
        hoursPossible: null,
        hoursEarned: null,
        transfer: true,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred State"
    },
    {
        courseCode: "PSYC-100",
        courseTitle: "Introduction to Psychology",
        grade: null,
        creditEarned: "3",
        gradePoints: null,
        hoursPossible: null,
        hoursEarned: null,
        transfer: true,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred State"
    },
    {
        courseCode: "ART-105",
        courseTitle: "Art Appreciation",
        grade: null,
        creditEarned: "3",
        gradePoints: null,
        hoursPossible: null,
        hoursEarned: null,
        transfer: true,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred State"
    },
    {
        courseCode: "CSCI-240",
        courseTitle: "Data Structures",
        grade: "A",
        creditEarned: "3",
        gradePoints: "11.25",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "MATH-220",
        courseTitle: "Discrete Mathematics",
        grade: "B+",
        creditEarned: "3",
        gradePoints: "9.9",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "ENG-210",
        courseTitle: "Technical Writing",
        grade: "A-",
        creditEarned: "3",
        gradePoints: "11.1",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "HIST-110",
        courseTitle: "U.S. History Since 1877",
        grade: "A",
        creditEarned: "3",
        gradePoints: "12",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "PE-105",
        courseTitle: "Health and Wellness",
        grade: "B",
        creditEarned: "3",
        gradePoints: "10.5",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "CSCI-310",
        courseTitle: "Operating Systems",
        grade: "A-",
        creditEarned: "3",
        gradePoints: "11.1",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "CSCI-320",
        courseTitle: "Computer Architecture",
        grade: "B+",
        creditEarned: "3",
        gradePoints: "9.9",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "STAT-200",
        courseTitle: "Statistics for Scientists",
        grade: "B",
        creditEarned: "3",
        gradePoints: "9",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "PHIL-101",
        courseTitle: "Introduction to Philosophy",
        grade: "A",
        creditEarned: "3",
        gradePoints: "12",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: [],
        schoolName: "DigiCred University"
    },
    {
        courseCode: "CSCI-299",
        courseTitle: "Internship Preparation",
        grade: "P", // Pass/Fail class
        creditEarned: "3",
        gradePoints: "0",
        hoursPossible: "3",
        hoursEarned: "3",
        transfer: false,
        inProgress: false,
        repeat: false,
        flags: ["Pass/Fail"],
        schoolName: "DigiCred University"
    }
];

const collegeTerms: CollegeTermDto[] = [
  {
    termGradeLevel: "Freshman",
    termYear: "2023",
    termSeason: "Fall",
    termSchoolName: "DigiCred State",
    termSchoolCode: "DCS456",

    termCredit: "15",
    termGpa: "3.52",
    academicStanding: "Good",

    termHoursPossible: "15",
    termHoursEarned: "15",
    termGradePoints: "54",
    cumulativeHoursPossible: "15",
    cumulativeHoursEarned: "15",
    cumulativeGradePoints: "54",
    cumulativeGpa: "3.60",

    courses: collegeCourses.slice(5)
  },
  {
    termGradeLevel: "Sophomore",
    termYear: "2024",
    termSeason: "Spring",
    termSchoolName: "DigiCred University",
    termSchoolCode: "CVU123",

    termCredit: "15",
    termGpa: "3.85",
    academicStanding: "Good",

    termHoursPossible: "15",
    termHoursEarned: "15",
    termGradePoints: "57.75",
    cumulativeHoursPossible: "30",
    cumulativeHoursEarned: "30",
    cumulativeGradePoints: "111.75",
    cumulativeGpa: "3.73",

    courses: collegeCourses.slice(5, 10)
  },
  {
    termGradeLevel: "Junior",
    termYear: "2024",
    termSeason: "Fall",
    termSchoolName: "DigiCred University",
    termSchoolCode: "CVU123",

    termCredit: "15",
    termGpa: "3.60",
    academicStanding: "Good",

    termHoursPossible: "15",
    termHoursEarned: "15",
    termGradePoints: "54",
    cumulativeHoursPossible: "45",
    cumulativeHoursEarned: "45",
    cumulativeGradePoints: "165.75",
    cumulativeGpa: "3.68",

    courses: collegeCourses.slice(10, 15)
  }
];

export const exampleCollegeStudent: CollegeTranscriptDto = {
  // Transcript Metadata
  transcriptDate: "2025-05-15",
  transcriptComments: "Official transcript issued by the Office of the Registrar.",

  // Student Information
  studentNumber: "202300123",
  studentFullName: "Ada Lovelace",
  studentBirthDate: "2003-09-22",
  studentPhone: "(555) 123-4567",
  studentEmail: "ada@university.edu",
  studentAddress: "123 College Ave, Apt 204, Cityville, ST 12345",
  studentSex: "Female",
  studentSsn: "XXX-XX-6789",
  studentContacts: "Mother: Sarah Lovelace (555) 234-5678",

  gradeLevel: "Junior",
  graduationDate: "2026-05-20",
  program: "B.S. in Computer Science",

  // School Information
  schoolName: "DigiCred University",
  schoolPhone: "(555) 987-6543",
  schoolAddress: "100 University Blvd\nCityville, ST 12345",
  schoolFax: "(555) 987-6544",
  schoolCode: "CVU123",
  schoolGradeLevels: "Freshman, Sophomore, Junior, Senior",

  // Grade Information
  gpa: "3.78", // Weighted
  earnedCredits: "75",

  terms: collegeTerms,

};
