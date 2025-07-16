import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

const openaiUrl = 'https://api.openai.com/v1/chat/completions';

export async function generateCareerSummary(
  httpService: HttpService,
  topClusters: Array<[string, number]>,
  courses: Array<{ courseCode: string; courseTitle: string }>,
  modelType: string,
  apiKey: string
): Promise<{
  top_career: string;
  top_second_career: string;
  skill_summary: string;
}> {
  const systemPrompt = `
    You are a helpful assistant, with a goal to generate data for a student, based on the skills the student has and the courses they took in university. Specifically, you will need to generate the "top_career" which the student is likely to be working towards, or which their learning matches towards, and a short summary of their skills and how it matches to the career. Write the summary to the student, using "you" and "your". Your output must be a json_schema output.
  `;

  const userPrompt = `
I have a student whose skills were analysed and put into a list format, with the skill name and a number next to it signifying how many skills of this type they have. This could be considered their level of familiarity with the topic.

This is the list of their top areas of skills:
${JSON.stringify(topClusters, null, 2)}

This is the list of their courses:
${JSON.stringify(courses, null, 2)}

Could you please ensure the summary is only a few sentences, not long.
`;

  const jsonSchema = {
    type: 'object',
    properties: {
      top_career: {
        type: 'string',
        description:
          'The most suitable or recommended career path based on the student’s skills and courses.',
      },
      top_second_career: {
        type: 'string',
        description:
          'The second suitable or recommended career path based on the student’s skills and courses. Perhaps the student has a second direction in learning.',
      },
      skill_summary: {
        type: 'string',
        description:
          "A summary of the student's most prominent and important skills. Be kind. Write directly to the student using 'You' and 'Your'.",
      },
    },
    required: ['top_career', 'top_second_career', 'skill_summary'],
    additionalProperties: false,
  };

  const response = await lastValueFrom(
  httpService.post(
    openaiUrl,
    {
      model: modelType,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: 'json_object',
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
);


  const content = response.data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse GPT JSON output:', content);
    throw new Error('Invalid JSON returned by GPT');
  }
}

