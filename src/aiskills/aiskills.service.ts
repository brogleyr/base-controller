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
	) { }

	async skillsAnalysis(connection_id: any): Promise<string | null> {
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
					analysisBody,
					{
						headers: {
							"Host": hostName,
							"Content-Type": "application/json",
						},
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

	jobsAnalysis(connection_id: any) {

	}


	private formatTranscript(enrollment: Enrollment): { coursesList: [string, string][], source: string } {
		let terms = enrollment?.terms;

		if (typeof terms === 'string') {
			try {
				terms = JSON.parse(terms);
			} catch (error) {
				throw new Error("Transcript passed to credential analysis did not have properly formed terms: ");
			}
		}

		if (!Array.isArray(terms)) {
			return { coursesList: [], source: enrollment?.school_name || '' };
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
			source: enrollment?.school_name || ''
		};
	}
}
