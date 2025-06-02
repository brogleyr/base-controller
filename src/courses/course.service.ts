import { Injectable } from '@nestjs/common';
import { COURSE_DATA } from './course.data';


@Injectable()
export class CourseService {
  getCourseInfo(courseName: string, courseCode: string) {
    const course = COURSE_DATA.find(
  (c) => 
    c.name.toLowerCase() === courseName.toLowerCase() && 
    c.code.toLowerCase() === courseCode.toLowerCase()
);


    if (!course) {
      return {
        error: `Course with name "${courseName}" and code "${courseCode}" not found.`
      };
    }

    return {
      description: course.description,
      technologicalSkills: course.technologicalSkills || [],
      skills: course.skills || [],
      abilities: course.abilities || []
    };
  }
}