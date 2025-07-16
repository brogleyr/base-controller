import type { jobSkillType } from '../types/jobSkills.type';
import type { jobSkillExtendedType } from '../types/jobSkillsExtended.type';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

const openaiUrl = 'https://api.openai.com/v1/chat/completions';

export async function filterJobsGpt(
  httpService: HttpService,
  jobData: jobSkillType,
  modelType: string,
  topKReturned: number,
  apiKey: string,
): Promise<jobSkillExtendedType> {
  const systemPrompt = `
    You are a job matching AI. Given a list of job postings and a student's skills, return a JSON object with a field "matches" that is an array.
    Each element in "matches" should have two fields:
      - "index": the 0-based index of the job in the list.
      - "justification": a short explanation (less than or equal to 300 characters) of why this job is a good fit for the student. Example: "You have demonstrated knowledge in finances and management, which aligns well with the main objective of..."
    Only return the JSON object. Do not add any other commentary or explanation.
  `;

  const jsonSchema = {
    type: "object",
    properties: {
      matches: {
        type: "array",
        minItems: 1,
        maxItems: topKReturned,
        items: {
          type: "object",
          properties: {
            index: {
              type: "integer",
              minimum: 0,
              maximum: jobData.length - 1
            },
            justification: {
              type: "string",
              maxLength: 300
            }
          },
          required: ["index", "justification"]
        }
      }
    },
    required: ["matches"]
  };

  const userPrompt = JSON.stringify(jobData);

  const response = await lastValueFrom(
    httpService.post(
      openaiUrl,
      {
        model: modelType,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    ),
  );

  const content = response.data.choices[0].message.content;
  let matches: { index: number; justification: string }[] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.matches)) {
      matches = parsed.matches.slice(0, topKReturned);
    }
  } catch (err) {
    console.error('Could not parse GPT JSON output:', content);
    throw new Error('Invalid GPT JSON output');
  }

  // Build a map from index to justification for easy lookup
  const justificationMap = new Map<number, string>();
  matches.forEach(({ index, justification }) => {
    justificationMap.set(index, justification);
  });

  // Map indices to jobs and append justification field from the map
  const selectedJobs: jobSkillExtendedType = matches
    .map(({ index }) => jobData[index])
    .filter(job => !!job)
    .map(job => ({
	  ...job,
	  requirementsAnalysis: {
	    ...job.requirementsAnalysis,
	    justification: justificationMap.get(jobData.indexOf(job)) ?? "",
	  }
	}));

  return selectedJobs;
}

