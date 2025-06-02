import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import util from 'util';

@Injectable()
export class AcaPyService {
    private readonly logger = new Logger(AcaPyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    private getRequestConfig(): AxiosRequestConfig {
        return {
            headers: {
                Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
                'X-API-KEY': this.configService.get<string>('API_KEY'),
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
        };
    }

    async getConnections(): Promise<any> {
        const connectionUrl = `${this.configService.get<string>('API_BASE_URL')}/connections?limit=100&offset=0`;
        const requestConfig: AxiosRequestConfig = this.getRequestConfig();
        try {
            this.httpService.get(connectionUrl, requestConfig).subscribe((response) => {
                console.log(response.data); // this will print the data
            });
            this.logger.log('Message sent successfully');
        } catch (error) {
            this.logger.error('Error sending message:', error.message);
            throw new Error('Failed to send message');
        }
    }

    async sendWelcomeMessage(connectionData: any): Promise<boolean> {
        const connectionId = connectionData.connection_id;
        const messageContent = this.configService.get<string>('SCHOOL_WELCOME_MESSAGE');

        try {
            await this.sendMessage(connectionId, messageContent);
            this.logger.log('Welcome message sent successfully');
            return true;
        } catch (error) {
            this.logger.error('Error sending welcome message:', error.message);
            return false;
        }
    }

    async sendCredOffer(credentialOfferBody: object): Promise<boolean> {
        const credentialRequestUrl = `${this.configService.get<string>('API_BASE_URL')}/issue-credential/send-offer`;

        try {
            await lastValueFrom(
                this.httpService
                    .post(credentialRequestUrl, credentialOfferBody, this.getRequestConfig())
                    .pipe(map((resp) => resp.data)),
            );
            this.logger.log('Credential offer sent successfully');
            return true;
        } catch (error) {
            this.logger.error('Error sending credential offer:', error.message);
            return false;
        }
    }

    async fetchCredentialRecord(credentialExchangeId: string): Promise<any> {
        const url = `${this.configService.get<string>('API_BASE_URL')}/issue-credential/records/${credentialExchangeId}`;

        try {
            const response = await lastValueFrom(
                this.httpService.get(url, this.getRequestConfig()).pipe(map((resp) => resp.data))
            );
            return response;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                this.logger.error(`Credential record not found for id: ${credentialExchangeId}`);
            } else {
                this.logger.error(`Error fetching credential record: ${error.message}`);
            }
            throw new Error('Failed to fetch credential record');
        }
    }

    async fetchCurrentMetadata(connId: string): Promise<any> {
        const url = `${this.configService.get<string>('SWAGGER_API_URL')}/connections/${connId}/metadata`;
        try {
            const response = await lastValueFrom(
                this.httpService.get(url, this.getRequestConfig())
                    .pipe(map((resp) => resp.data))
            );
            return response;
        } catch (error) {
            this.logger.error('Error fetching current metadata:', error.message);
            throw new Error('Failed to fetch current metadata');
        }
    }

    async updateMetadata(connId: string, metadata: any): Promise<boolean> {
        const url = `${this.configService.get<string>('SWAGGER_API_URL')}/connections/${connId}/metadata`;
        this.logger.log(`Updating metadata at URL: ${url} with data:`, metadata);

        try {
            const response = await lastValueFrom(
                this.httpService.post(url, { metadata }, this.getRequestConfig())
                    .pipe(map((resp) => resp))
            );

            if (response.status === 200) {
                this.logger.log('Metadata updated successfully.');
                return true;
            } else {
                this.logger.error(`Failed to update metadata: ${response.status} - ${response.statusText}`);
                return false;
            }
        } catch (error) {
            this.logger.error('Error updating metadata:', error.message);
            return false;
        }
    }

    async sendMessage(connectionId: string, messageDisplayed: string): Promise<void> {
        const messageUrl = `${this.configService.get<string>('API_BASE_URL')}/connections/${connectionId}/send-message`;
        const requestConfig: AxiosRequestConfig = this.getRequestConfig();
        const messageContent = { content: messageDisplayed };

        try {
            await lastValueFrom(
                this.httpService
                    .post(messageUrl, messageContent, requestConfig)
                    .pipe(map((resp) => resp.data)),
            );
            this.logger.log('Message sent successfully');
        } catch (error) {
            this.logger.error('Error sending message:', error.message);
            throw new Error('Failed to send message');
        }
    }
    async sendProofRequest(connectionId: string, data: object): Promise<void> {

        console.log("Verification request = ", JSON.stringify(data));
        const verificationRequestUrl = `${this.configService.get<string>('API_BASE_URL')}/present-proof-2.0/send-request`;
        const verificationRequestConfig: AxiosRequestConfig = this.getRequestConfig();

        try {
            await lastValueFrom(
                this.httpService.post(verificationRequestUrl, data, verificationRequestConfig).pipe(map((resp) => console.log(resp.data)))
            );
            this.logger.log('Proof request sent successfully');
        } catch (error) {
            //console.log("Send Proof Error=", error);
            this.logger.error('Error sending proof request:', error.message);
            throw new Error('Failed to send proof request');
        }
    }

    async sendProofRequest2(connectionId: string, data: object): Promise<void> {

        console.log("Verification request = ", JSON.stringify(data));
        const verificationRequestUrl = `${this.configService.get<string>('API_BASE_URL')}/present-proof-2.0/send-request`;
        const verificationRequestConfig: AxiosRequestConfig = this.getRequestConfig();

        try {
            await lastValueFrom(
                this.httpService.post(verificationRequestUrl, data, verificationRequestConfig).pipe(map((resp) => console.log(resp.data)))
            );
            this.logger.log('Proof request sent successfully');
        } catch (error) {
            this.logger.error('Error sending proof request:', error.message);
            throw new Error('Failed to send proof request');
        }
    }


    async getConnectionById(connectionId: string): Promise<any> {
        const connectionByIDFetchUrl = `${this.configService.get<string>('API_BASE_URL')}/connections/${connectionId}`;
        const connectionByIDFetchConfig: AxiosRequestConfig = this.getRequestConfig();
        try {
            const response = await lastValueFrom(
                this.httpService.get(connectionByIDFetchUrl, connectionByIDFetchConfig).pipe(map((resp) => resp.data))
            );
            this.logger.log('Connection data request sent successfully');
            return response;            
        } catch (error) {
            this.logger.error('Error sending connection data request:', error.message);
            throw new Error('Failed to send connection data request');
        }
    }

    async getMetadataByConnectionId(connectionId: string): Promise<any> {
        const metadataFetchUrl = `${this.configService.get<string>('API_BASE_URL')}/connections/${connectionId}/metadata`;
        const metadataFetchConfig: AxiosRequestConfig = this.getRequestConfig();

        try {
            const response = await lastValueFrom(
                this.httpService.get(metadataFetchUrl, metadataFetchConfig).pipe(map((resp) => resp.data))
            );
            this.logger.log('Metadata fetched successfully');
            return response?.results;
        } catch (error) {
            this.logger.error('Error fetching metadata:', error.message);
            throw new Error('Failed to fetch metadata');
        }
    }

}
