import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetadataService } from '../metadata/metadata.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom, firstValueFrom, map } from 'rxjs';
import { WorkflowService } from 'src/workflow/workflow.service';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';
import { CreateEnrollmentDto } from 'src/enrollment/dto/create-enrollment.dto';
// import { parse, getWorkflowInstance, updateWorkflowInstanceByID } from '@veridid/workflow-parser';


@Injectable()
export class VerificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly metadataService: MetadataService,
    private readonly enrollmentService: EnrollmentService,
    private readonly workflowService: WorkflowService
  ) { }

/*   // Helper method to send a message
  private async sendMessage(connectionId: string, messageDisplayed: string): Promise<void> {
    const messageUrl = `${this.configService.get<string>('API_BASE_URL')}/connections/${connectionId}/send-message`;
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'X-API-KEY': this.configService.get<string>('API_KEY'),
      },
    };
    const messageContent = { content: messageDisplayed };

    try {
      await lastValueFrom(
        this.httpService.post(messageUrl, messageContent, requestConfig).pipe(map((resp) => resp.data))
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
 */

  async verify(connectionData: any): Promise<boolean> {
    const WORKFLOW_ID = 'NewStudentOrientation';
    const CURRENT_STATE = 'verifyID'
    const connectionId = connectionData.connection_id;
    console.log("Verfication data from request-sent state", connectionData);
    //Add threadId into workflow instance ID 
    const threadId = connectionData?.thread_id;
/*     const response = await getWorkflowInstanceByID(`${connectionId}`, `${WORKFLOW_ID}`)
    console.log("response from verify section", response);
    const instanceID = response?.instanceID;
    const instance = {
      instanceID: `${instanceID}`,
      workflowID: `${WORKFLOW_ID}`,
      connectionID: `${connectionId}`,
      currentState: `${CURRENT_STATE}`,
      stateData: { "threadId": `${threadId}` }
    }
    await updateWorkflowInstanceByID(`${instanceID}`, instance) */
    //------------------------------------------------------------------


    const send_message =
      `${this.configService.get<string>('API_BASE_URL')}/connections/` +
      connectionId +
      '/send-message';
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'X-API-KEY': this.configService.get<string>('API_KEY'),
      },
    };

    console.log('Call REST ', send_message, ' Options ', requestConfig);

    let messageContent: string | undefined;
    try {
      const verificationRecord = await this.fetchVerificationRecord(
        connectionData.presentation_exchange_id,
      );

      const schemaName =
        verificationRecord?.presentation_request?.requested_attributes
          ?.studentInfo?.restrictions?.[0]?.schema_name;

      if (schemaName) {
        if (schemaName === this.configService.get<string>('ID_SCHEMA_NAME')) {
          messageContent = this.configService.get<string>(
            'REQUEST_STUDENT_ID_VERIFICATION_MESSAGE',
          );
        } else if (
          schemaName ===
          this.configService.get<string>('TRANSCRIPT_SCHEMA_NAME')
        ) {
          messageContent = this.configService.get<string>(
            'REQUEST_STUDENT_TRANSCRIPT_VERIFICATION_MESSAGE',
          );
        } else {
          console.log('Schema name does not match student ID or transcript.');
        }
      } else {
        console.error('Schema name is undefined or empty.');
      }
    } catch (error) {
      console.error('Error fetching verification record:', error.message);
    }

    if (messageContent) {
     await lastValueFrom(
        this.httpService
          .post(send_message, { content: messageContent }, requestConfig)
          .pipe(map((resp) => resp.data)),
      );
    }

    return true;
  }

  async handleVerifiedState(credentialData: any): Promise<void> {
    console.log("+++ Credential verified");
    console.log("Save enrollment data credentialData=", JSON.stringify(credentialData?.by_format?.pres?.indy?.requested_proof?.revealed_attr_groups?.studentInfo?.values));
    const transcriptData = credentialData?.by_format?.pres?.indy?.requested_proof?.revealed_attr_groups?.studentInfo?.values;
    try {
      if(transcriptData != undefined) {
          const enrollment = new CreateEnrollmentDto();
          enrollment.studentNumber = transcriptData?.studentNumber?.raw;
          enrollment.studentFullName = transcriptData?.studentFullName?.raw;
          enrollment.gpa = JSON.parse(transcriptData?.studentInfo?.raw)?.gpa;
          enrollment.studentBirthDate = transcriptData?.studentBirthDate?.raw;
          enrollment.terms = JSON.parse(transcriptData?.terms?.raw);
          enrollment.studentInfo = JSON.parse(transcriptData?.studentInfo?.raw);
          enrollment.transcript = JSON.parse(transcriptData?.transcript?.raw);
          //console.log("Enrollment=", enrollment);
          // Save the transcript data in the enrollment table
          await this.enrollmentService.create(enrollment);
      }
      const connectionId = credentialData.connection_id;
      const threadId = credentialData.thread_id;
      const instance = await this.workflowService.getInstanceByData(connectionId, {threadID: threadId});
      if(instance?.client_id===connectionId) {
        const action = {
          workflowID: instance.workflow_id,
          actionID: "credential-verified",
          data: {}
        };           
        const displayData = await this.workflowService.parser.parse(connectionId, action);
        await this.workflowService.sendWorkflow(connectionId, displayData);
      }
    } catch (error) {
      console.error('Error handling verification state:', error);
    }
  }

  async handleAbandonedState(connectionData: any): Promise<void> {
    console.log("+++ Credential abandonded verification");
    const connectionId = connectionData.connection_id;
    const threadId = connectionData.thread_id;
    const instance = await this.workflowService.getInstanceByData(connectionId, {threadID: threadId});
    if(instance?.client_id===connectionId) {
      const action = {
        workflowID: instance.workflow_id,
        actionID: "credential-failed",
        data: {}
      };           
      const displayData = await this.workflowService.parser.parse(connectionId, action);
      await this.workflowService.sendWorkflow(connectionId, displayData);
    }
  }

  private async fetchVerificationRecord(
    presentationExchangeId: string,
  ): Promise<any> {
    const apiUrl = `${this.configService.get<string>('SWAGGER_API_URL')}/present-proof/records/${presentationExchangeId}`;

    const headers = {
      accept: 'application/json',
      'X-API-KEY': this.configService.get<string>('API_KEY'),
      Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
    };

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(apiUrl, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching verification record:', error);
    }
  }
}
