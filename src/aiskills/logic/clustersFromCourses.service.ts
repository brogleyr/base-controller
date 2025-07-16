import { courseSkillData } from '../data/courseSkills';

export function countClustersFromCourses(
  courses: Array<{ courseCode: string; courseTitle: string }>
): Array<[string, number]> {
  const clusterMap = new Map<string, number>();

  for (const course of courses) {
    const courseCode = course.courseCode.trim().toUpperCase();

    // Try to match by normalized code
    const matchedCourse = courseSkillData.find(
      (data) => data.code.trim().toUpperCase() === courseCode
    );

    if (!matchedCourse) continue;

    for (const [clusterName, value] of matchedCourse.clusters) {
      const current = clusterMap.get(clusterName) ?? 0;
      clusterMap.set(clusterName, current + value);
    }
  }

  return Array.from(clusterMap.entries());
}

