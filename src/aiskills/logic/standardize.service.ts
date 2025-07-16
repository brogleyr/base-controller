import * as fs from 'fs';
import * as path from 'path';
import * as stringSimilarity from 'string-similarity';

import { courseSkillData } from '../data/courseSkills';
const standardizedCourses: [string, string][] = courseSkillData.map(course => 
[course.name, course.code]);


export function standardizeCourses(courses: any[]): Array<{ courseCode: string; courseTitle: string }> {
  const results: Array<{ courseCode: string; courseTitle: string }> = [];

  for (const coruse of courses) {
      const inputTitle = coruse.courseTitle?.toUpperCase() ?? '';
      const inputCode = coruse.courseCode?.toUpperCase() ?? '';

      let bestMatch = null;
      let bestScore = 0;

      for (const [stdTitle, stdCode] of standardizedCourses) {
        
        const titleScore = stringSimilarity.compareTwoStrings(inputTitle, stdTitle.toUpperCase());
        const codeScore = stringSimilarity.compareTwoStrings(inputCode, stdCode.toUpperCase());

        const finalScore = 0.7 * titleScore + 0.3 * codeScore;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = { courseCode: stdCode, courseTitle: stdTitle };
        }
      }
      
      if (bestMatch) {
        results.push(bestMatch);
      } else {
        results.push({ courseCode: inputCode, courseTitle: inputTitle }); // fallback
      }
    }
  return results;
}

