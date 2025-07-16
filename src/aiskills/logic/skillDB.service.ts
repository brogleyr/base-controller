import type { jobSkillType } from '../types/jobSkills.type';
import { jobSkillData } from '../data/jobSkills';

export function getJobSkillData(urls: string[]): jobSkillType {
  const matches = jobSkillData.filter(job => urls.includes(job.url));
  return matches;
}






