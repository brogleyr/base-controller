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

	async skillsAnalysis(connectionId: any): Promise<any> {
		if (!connectionId) {
			throw new Error("Connection ID is required for skills analysis.");
		}
		const connectionEnrollment: Enrollment = await this.enrollmentService.findOne(connectionId);
		if (!connectionEnrollment) {
			throw new Error("Enrollment or transcript not found for the given connection ID.");
		}

		const analysisBody = this.formatTranscript(connectionEnrollment);
		const endpointUrl = this.configService.get("SKILLS_ANALYSIS_URL");
		const proxyUrl = this.configService.get("AUTHENTICATION_PROXY");

		return this.callEndpointViaProxy(endpointUrl, proxyUrl, analysisBody);
	}

	async jobsAnalysis(connectionId: any, skillsResponse: any) {
		if (!connectionId) {
			throw new Error("Connection ID is required for jobs analysis.");
		}
		const connectionEnrollment: Enrollment = await this.enrollmentService.findOne(connectionId);
		if (!connectionEnrollment) {
			throw new Error("Enrollment or transcript not found for the given connection ID.");
		}

		const formattedTranscript = this.formatTranscript(connectionEnrollment);
		const analysisBody = {
			...skillsResponse,
			...formattedTranscript
		}
		const endpointUrl = this.configService.get("JOBS_ANALYSIS_URL");
		const proxyUrl = this.configService.get("AUTHENTICATION_PROXY");

		return this.callEndpointViaProxy(endpointUrl, proxyUrl, analysisBody);
	}

	private async callEndpointViaProxy(endpointUrl, proxyUrl, body) {
		console.log("Body to be sent to AI Skills:", body);

		// TODO: Check for existence of env variables and validate URLs

		const urlPath = endpointUrl.split("/").slice(3);
		const hostName = endpointUrl.split("/").slice(2, 3).join("/");
		const requestUrl = proxyUrl + "/" + urlPath.join("/");

		try {
			const response = await lastValueFrom(
				this.httpService.post(
					requestUrl,
					body,
					{
						headers: {
							"Host": hostName,
							"Content-Type": "application/json",
						},
					}
				)
			);

			if (!response || !response.data || response.data.status !== 200 || !response.data.body) {
				throw new Error("Failed to retrieve data from the endpoint");
			}

			return response.data.body;
		}
		catch (e) {
			console.error(e);
			return null;
		}
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
