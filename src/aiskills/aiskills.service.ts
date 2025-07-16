// src/aiskills/aiskills.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SisService } from '../sis/sis.service';

import type { jobSkillExtendedType } from './types/jobSkillsExtended.type';

import { getJobEmbeddingData, getCourseEmbeddingData } from './logic/vectorDB.service';
import { getJobSkillData } from './logic/skillDB.service';

import { getCoursesFromSisWithId } from './logic/getStudentCourses.service';
import { standardizeCourses } from './logic/standardize.service';
import { cosineSimilarityMatrix, meanByColumn } from './logic/cosineSimilarity.service';
import { filterJobsGpt } from './logic/filterJobsGpt.service';
import { generateCareerSummary } from './logic/careerSummaryGpt.service';
import { countClustersFromCourses } from './logic/clustersFromCourses.service';

@Injectable()
export class AiSkillsService {
  constructor(
    private readonly sisService: SisService,
    private readonly httpService: HttpService,
  ) {}

  async jobSuggest(studentId: string): Promise<jobSkillExtendedType> {
    const coursesList = await getCoursesFromSisWithId(this.sisService, studentId);  
    const standCoursesList = standardizeCourses(coursesList)
    
    // Retrieve the job embeddings
    const allJobs = await getJobEmbeddingData();

    // Retrieve the cpurse embeddings
    const courseEmbeddings = await getCourseEmbeddingData(standCoursesList);
    
    const jobEmbeddings: number[][] = allJobs.map(job => job.emb);
    const jobUrls: string[] = allJobs.map(job => job.url);
    
    // Cosine similarity
    const embeddingSimMatrix = cosineSimilarityMatrix(courseEmbeddings, jobEmbeddings);
    const jobScores = meanByColumn(embeddingSimMatrix);
    
    // Top job selection
    const k = 15;
    const topK = jobScores
      .map((score, idx) => ({ idx, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    const topKIndices = topK.map((item) => item.idx);
    
    // Getting data for each top job
    const topKUrls: string[] = topKIndices
    .filter(idx => idx >= 0 && idx < jobUrls.length)  // safety guard
    .map(idx => jobUrls[idx]);
    
    const jobData = getJobSkillData(topKUrls);
    
    // Final selections using gpt-4.1-mini
    const jobDataFiltered = await filterJobsGpt(this.httpService, jobData, "gpt-4.1-mini", 5, process.env.OPENAI_API_KEY)
    
    return jobDataFiltered;
  }

  async skillReport(studentId: string): Promise<string> {
    const coursesList = await getCoursesFromSisWithId(this.sisService, studentId);  
    
    const standCoursesList = standardizeCourses(coursesList)
    const clustersCount = countClustersFromCourses(standCoursesList);
    
    // Get top 5 clusters directly
    const topClusters = [...clustersCount]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Generate summary for the student
    const result = await generateCareerSummary(
      this.httpService,
      topClusters,
      standCoursesList,
      'gpt-4.1-mini', 
      process.env.OPENAI_API_KEY
    );

    console.log('== Career Recommendation ==');
    console.log(result);

    
    return "Success";
  }
}

