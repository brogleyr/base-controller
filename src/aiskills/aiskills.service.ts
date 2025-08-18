// src/aiskills/aiskills.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';


@Injectable()
export class AiSkillsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly enrollmentService: EnrollmentService
  ) {}

  // Calls the jobs analysis endpoint through a proxy if necessary
  async jobsAnalysis(connection_id: any): Promise<string | null> {
    if (!connection_id) {
      throw new Error("Connection ID is required for jobs analysis.");
    }
    const connectionEnrollment: Enrollment = await this.enrollmentService.findOne(connection_id);
    if (!connectionEnrollment) {
      throw new Error("Enrollment or transcript not found for the given connection ID.");
    }

    const analysisBody = this.formatTranscript(connectionEnrollment);
    console.log("Body to be sent to AI Skills:", analysisBody);


    const endpointUrl = this.configService.get("JOBS_ANALYSIS_URL");
    const proxyUrl = this.configService.get("AUTHENTICATION_PROXY");

    // TODO: Check for existence of env variables and validate URLs

    const urlPath = endpointUrl.split("/").slice(3);
    const hostName = endpointUrl.split("/").slice(2, 3).join("/");
    const requestUrl = proxyUrl + "/" + urlPath.join("/");

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          requestUrl,
          {
            headers: {
              "Host": hostName
            },
            body: {
              
            }
          }
        )
      );

      if (!response || !response.data || response.data.status !== 200 || !response.data.body) {
        throw new Error("Failed to retrieve data from the jobs analysis endpoint.");
      }

      return response.data.body;
    }
    catch (e) {
      console.error(e);
      return "Credential analysis could not be completed, please try again later.";
    }
  }

  skillAnalysis(connection_id: any) {
    
  }

  // Puts the transcript into a structured object for AI analysis
  private formatTranscript(transcript: any): { coursesList: [string, string][], source: string } {
    let terms = transcript?.terms;

    if (typeof terms === 'string') {
      try {
        terms = JSON.parse(terms);
      } catch (error) {
        throw new Error("Transcript passed to credential analysis did not have properly formed terms: ");
      }
    }

    if (!Array.isArray(terms)) {
      return { coursesList: [], source: transcript?.schoolName || '' };
    }

    const coursesList: [string, string][] = [];
    for (const term of terms) {
      if (Array.isArray(term.courses)) {
        for (const course of term.courses) {
          // Use courseTitle and courseCode, fallback to empty string if missing
          coursesList.push([
            course.courseTitle || '',
            course.courseCode || ''
          ]);
        }
      }
    }

    return {
      coursesList,
      source: transcript?.schoolName || ''
    };
  }

  // Main code which executes the process
  async getTranscriptAndSendToAI(transcript: any): Promise<string> {
    console.log("Preparing transcript for skills analysis");
    if (!transcript) {
      throw new Error('Transcript not found');
    }

    // Format the transcript
    const transcriptFormatted = this.formatTranscript(transcript);
    const prompt = `${transcriptFormatted}`;

    console.log('\n=== GENERATED PROMPT ===');
    console.log(prompt);
    console.log('=== END OF PROMPT ===\n');

    // Analytical response
    const response = await this.sendPromptToOpenAI(prompt);

    console.log('\n=== GENERATED ANALYTICAL RESPONSE ===');
    console.log(response);
    console.log('=== END OF ANALYTICAL RESPONSE ===\n');

    // JSON formatting response this is the format of json_response, which is what AI Skills returns
    const jsonSchema = {
      type: 'object',
      properties: {
        "abilities": {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              afiliated_courses: { type: 'array', items: { type: 'string' } },
              level: { type: 'integer' },
            },
            required: ['name', 'afiliated_courses', 'level'],
          },
        },
        'tools': {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              afiliated_courses: { type: 'array', items: { type: 'string' } },
              level: { type: 'integer' },
            },
            required: ['name', 'afiliated_courses', 'level'],
          },
        },
        "skills": {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              afiliated_courses: { type: 'array', items: { type: 'string' } },
              level: { type: 'integer' },
            },
            required: ['name', 'afiliated_courses', 'level'],
          },
        },
        "knowledge": {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              afiliated_courses: { type: 'array', items: { type: 'string' } },
              level: { type: 'integer' },
            },
            required: ['name', 'afiliated_courses', 'level'],
          },
        },
      },
      required: ['Abilities', 'Tech and Tools', 'Skills', 'Knowledge'],
    };

    const json_prompt = `
      Hello there, I have an analytical response from another ChatGPT. What I need you to do is retrieve the '5. Final List' and put the listed Abilities, Tech and Tools, Skills, and Knowledge into the corresponding JSON structure which will also be provided to you.
      That list also has additional information, such as the affiliated_courses in [], and the Level, which must also be added to the given JSON schema. 

      This is the ChatGPT’s response I would like you to retrieve the '5. Final List' from. MAKE ABSOLUTE SURE THAT YOU COPY THE WORDS AS THEY ARE, LETTER FOR LETTER:
      ${response}
    `;

    // The json_responce contains a list of "Abilities", "Tech and Tools", "Skills", "Knowledge" along with the 
    // courses where a given skill is derived from. It also includes a value "Level" which suggests how fimilar the
    // student is with some skill.
    
    // The top_matches contains a list of 5 occupations the students skills mostly fall under. It contains the 
    // occupation title, "occupation", the percentage of match "percentage", the matched skills "matchedSkills", 
    // and a few other values.
    const json_response = await this.sendJsonSchemaRequest(json_prompt, jsonSchema);
    

    try {
      const formattedResponse = this.formatJsonResponse(json_response);
      return formattedResponse;
    } catch (err) {
      throw new Error("Response from OpenAI could not be parsed as valid skills data, information cannot be extracted")
    }
  }

  // Sending the prompt to OpenAI for analytical analysis
  private async sendPromptToOpenAI(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiUrl = 'https://api.openai.com/v1/chat/completions';

    let depth: number = 1; // Select the depth of skills which will be outputed (1, 2, 3), this doesn't relate to the "top_matches"
    let depthPrompt: string = '';

    if (depth === 1) {
      depthPrompt = '(Abilities: 5, Tech and Tools: 3, Skills: 3, and Knowledge: 3)';
    } else if (depth === 2) {
      depthPrompt = '(Abilities: 10, Tech and Tools: 6, Skills: 5, and Knowledge: 5)';
    } else if (depth === 3) {
      depthPrompt = '(Abilities: 26, Tech and Tools: 9, Skills: 6, and Knowledge: 6)';
    } else {
      depthPrompt = '(Abilities: 5, Tech and Tools: 3, Skills: 3, and Knowledge: 3)'; // default
    }

    const response = await lastValueFrom(
      this.httpService.post(
        openaiUrl,
        {
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: `
                You work in a high school education environment; specifically, you specialize in understanding which skills, technology, and knowledge students gain from completing specific high school courses. Your main objective today is taking in student transcripts and listing the abilities, tech and tools, skills, and knowledge that the student is most likely to have, assuming they have completed all courses and retained knowledge from them.
                It must be clarified that we only have the description of the course, and nothing else. This means that many decisions you make are educational approximations; therefore, assumptions are acceptable, but must be justified with solid evidence from a course’s description.
                To make the job easier, we have already pre-selected a list of "matches" (e.g., Abilities, Tech and Tools, Skills, and Knowledge) that students gain for individual courses. Those matches are also assumptions; we have tried our best to select the most fitting ones.
                Here is your task: Given a student’s full course list (usually 12–24 courses), create a sophisticated and justifiable list of (Abilities, Tech and Tools, Skills, and Knowledge) that the student is most likely to have. Key point: Your job here is to have the grand view of the student and their interests; you must recognize that these courses are interconnected and will require deep analysis.
                Another key point: You must recognize that your job is the grand view, therefore reflection is a key step here. Please follow this protocol.

                ### 1. Objective
                At the beginning, state your objective and what you are trying to achieve. Recognize that your goal is the grand view of all courses the student has completed.

                ### 2. First Look
                At the first look, write a sentence about what you think the student is passionate about; try to understand who they are. If there is no clear pattern, say so—some students are still lost and haven’t decided a career direction.

                ### 3. Analysis
                For each course, list the (Abilities, Tech and Tools, Skills, and Knowledge), and describe how they connect to the student’s vision and the course. Then estimate the level of familiarity and/or experience the student would have with a given (Abilities, Tech and Tools, Skills, and Knowledge) on a scale of 1/10, and justify it.

                ### 4. Interconnection
                Recognize that education is a complex system; when a student is taught multiple courses, their knowledge may interconnect and mix. Analyze each course and try to understand whether any course fits with another; if so, what other (Abilities, Tech and Tools, Skills, and Knowledge) might the student gain from them combined.

                ### 5. Final Decision
                Remember that you have a specific max limit of (Abilities, Tech and Tools, Skills, and Knowledge) you may list: ${depthPrompt}. Therefore, choose wisely. If there are fewer skills than the given value, do not make up skills—leave it. THE SKILL NAME MUST MATCH AS PROVIDED IN THE STUDENT’S TRANSCRIPT, LETTER FOR LETTER.

                Print out your final selections in a neat list with headings (Abilities, Tech and Tools, Skills, and Knowledge). We require your output to be in a specific format and have specific additional information, apart from simply the name of the skills. Please follow this template.

                This is your template—change anything in {}, but anything outside, do not change:
                {Category}
                x. {Skill Name}
                [{list the courses which attribute to the skill}] [Level: {the 1/10 scale of familiarity you provided in the analysis}]

                Finally, the user will provide you with the transcript in JSON format.
              `,
            },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      ),
    );

    const result = response.data.choices[0].message.content;
    console.log('OpenAI response:', result);
    return result;
  }

  // Sending the prompt to openai to convert into JSON
  private async sendJsonSchemaRequest(prompt: string, jsonSchema: object): Promise<any> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const openaiUrl = 'https://api.openai.com/v1/chat/completions';

    const response = await lastValueFrom(
      this.httpService.post(
        openaiUrl,
        {
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant which helps transform user inputs into a structured JSON response.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'CourseInfo',
                description: 'Extracts structured abilities, skills, tech/tools, and knowledge based on input.',
                parameters: jsonSchema,
              },
            },
          ],
          tool_choice: {
            type: 'function',
            function: {
              name: 'CourseInfo',
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const toolCalls = response.data.choices?.[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error('No tool call found in OpenAI response.');
    }

    const jsonArgs = toolCalls[0].function.arguments;
    try {
      return JSON.parse(jsonArgs);
    } catch (err) {
      throw new Error('Failed to parse function.arguments as JSON.');
    }
  }

  formatJsonResponse(response: any): string {
    let formattedResponse = "";
    
    for (const skill of [...response["abilities"], ...response["skills"], ...response["knowledge"]]) {
      formattedResponse += skill["name"] + "\n";
      for (const item of skill["afiliated_courses"]) {
        formattedResponse += "\t- " + item + "\n";
      }
      formattedResponse += "\n";
    }
    return formattedResponse;
  }
}

