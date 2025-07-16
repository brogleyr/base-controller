import { SisService } from '../../sis/sis.service';
import { TranscriptDto } from '../../dtos/transcript.dto';

export async function getCoursesFromSisWithId(sisService: SisService, studentId: string): Promise<Array<{ courseCode: string; courseTitle: string }>> {
  const transcript: TranscriptDto = await sisService.getStudentTranscript(studentId);

  let terms: any[] = [];
  if (typeof transcript.terms === 'string') {
    try {
      terms = JSON.parse(transcript.terms);
    } catch (err) {
      console.error('Failed to parse transcript.terms as JSON:', err);
      terms = [];
    }
  } else {
    terms = transcript.terms;
  }

  const coursesList = [];
  for (const term of terms) {
    if (term && typeof term !== 'string' && Array.isArray(term.courses)) {
      for (const course of term.courses) {
        if (course.courseCode && course.courseTitle) {
          coursesList.push({
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
          });
        }
      }
    }
  }
  
  return coursesList;
}

