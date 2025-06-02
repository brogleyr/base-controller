import { IActionExtension, Transition, Instance } from "@veridid/workflow-parser";
import { AcaPyService } from "src/services/acapy.service";
import { Injectable } from "@nestjs/common";
import { SisService } from "src/sis/sis.service";
import { ConfigService } from "@nestjs/config";
import { AiSkillsService } from "src/aiskills/aiskills.service";

@Injectable()
export class ExtendedAction implements IActionExtension {

    constructor(
      private readonly configService: ConfigService,
      private readonly acapyService: AcaPyService,
      private readonly sisService: SisService,
      private readonly aiSkillsService: AiSkillsService,
    ) {}

    async actions(actionInput: any, instance: Instance, action: any, transition: Transition): Promise<Transition>{
        console.log("^^^ Extension -> actions actionInputs=", actionInput, "action=", action);
        const connection_id = instance.client_id;
        const cred_def_id = action?.value?.cred_def;
        const schema_name = action?.value?.schema_name;
        console.log("Cred-defID=", cred_def_id);
        transition.type = "none-nodisplay";
        // handle the types of actions
        switch(action?.type) {
            case "extension":
                // check condition
                if(eval(action.condition)) {
                    // save the data from the workflow action to the instance data
                    instance.state_data = Object.assign(instance.state_data, action.value);
                }
                break;
            case "issuecredential-HSStudentCard":
                console.log("Issue High School Card Credential");
                // check condition
                if(eval(action.condition)) {
                    // issue the credential
                    console.log("Action=", action);
                    console.log("ActionInput=", actionInput);
                    if(action?.value?.type=="studentID") {
                        await this.sendHSStudentIDCredOffer(connection_id, cred_def_id);
                    }
                }
                break;
            case "issuecredential-HSTranscript":
                console.log("Issue High School Transcript Credential");
                // check condition
                if(eval(action.condition)) {
                    // issue the credential
                    console.log("Action=", action);
                    console.log("ActionInput=", actionInput);
                    if(action?.value?.type=="transcript") {
                        await this.sendHSTranscriptCredOffer(connection_id, cred_def_id);
                    }
                }
                break;
            case "issuecredential-CollegeStudentCard":
              console.log("Issue College Student Card Credential");
              // check condition
              if(eval(action.condition)) {
                  // issue the credential
                  console.log("Action=", action);
                  console.log("ActionInput=", actionInput);
                  if(action?.value?.type=="studentID") {
                      await this.sendCollegeStudentIDCredOffer(connection_id, cred_def_id);
                  }
              }
              break;
            case "issuecredential-CollegeTranscript":
              console.log("Issue College Transcript Credential");
              // check condition
              if(eval(action.condition)) {
                  // issue the credential
                  console.log("Action=", action);
                  console.log("ActionInput=", actionInput);
                  if(action?.value?.type=="transcript") {
                      await this.sendCollegeTranscriptCredOffer(connection_id, cred_def_id);
                  }
              }
              break;
            case "verifycredential-HSStudentCard":
                console.log("Verify High School Student CardCredential");
                // check condition
                if(eval(action.condition)) {
                    // issue the credential
                    console.log("Action=", action);
                    console.log("ActionInput=", actionInput);
                    if(action?.value?.type=="studentID") {
                        await this.sendHSStudentIDProofRequest2(connection_id, schema_name);
                    }
                }
                break;
            case "verifycredential-HSTranscript":
              console.log("Verify High School Transcript Credential");
              // check condition
              if(eval(action.condition)) {
                  // issue the credential
                  console.log("Action=", action);
                  console.log("ActionInput=", actionInput);
                  if(action?.value?.type=="transcript") {
                      await this.sendHSTranscriptProofRequest2(connection_id, schema_name);
                  }
              }
              break;
            case "analyzeCredential-Transcript":
              console.log("Performing transcript credential analysis");

              if (eval(action.condition)) {
                const aiSkillsResponse = await this.aiSkillsService.getTranscriptAndSendToAI("0023");
                if (aiSkillsResponse) {
                    instance.state_data.aiSkills = aiSkillsResponse;
                }
                else {
                    console.log("Could not get skills analysis");
                }
              }
              break;
            default:
                console.log("Action type is not an included workflow extension: ", action?.type);
                break;
        }
    
        return transition;
    };

    async receiveInvitation(invite: string) {


    }

    async sendHSStudentIDProofRequest2(connection_id: string, schema_name: string) {
      const schema = schema_name.split(":");
      const proofRequest = {
        "auto_remove": false,
        "trace": true,
        "auto_verify": true,
        "comment": "Student Card Proof Request",
        "connection_id": connection_id,
        "presentation_request": {
          "indy": {
            "name": "Proof of NC High School Student Card",
            "nonce": "1234567890",
            "version": "1.0",
            "requested_attributes": {
              "0_BarcodeFields_uuid": {
                  "name": "BarcodeFields",
                  "restrictions": [{"schema_name": schema[2]}]
              },
              "0_BirthDate_uuid": {
                  "name": "BirthDate",
                  "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_CardURL_uuid": {
                "name": "CardURL",
                "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_Expiration_uuid": {
                "name": "Expiration",
                "restrictions": [{"schema_name": schema[2]}]
              },
              "0_FullName_uuid": {
                "name": "FullName",
                "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_NfcFields_uuid": {
                "name": "NfcFields",
                "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_QrcodeFields_uuid": {
                "name": "QrcodeFields",
                "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_SchoolName_uuid": {
                "name": "SchoolName",
                "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_StudentNumber_uuid": {
                "name": "StudentNumber",
                "restrictions": [{"schema_name": schema[2]}]
              },  
              "0_StudentPhoto_uuid": {
                "name": "StudentPhoto",
                "restrictions": [{"schema_name": schema[2]}]
              },  
            },
            "requested_predicates": {},
          }
        }
      }
      return this.acapyService.sendProofRequest2(connection_id, proofRequest);
    }

    async sendHSTranscriptProofRequest2(connection_id: string, schema_name: string) {
      const schema = schema_name.split(":");
      const proofRequest = {
        "connection_id": connection_id,
        "auto_verify": true,
        "auto_remove": false,
        "comment": "Student Transcript Proof Request",
        "trace": false,
        "presentation_request": {
            "indy": {
                "name": "proof-request",
                "nonce": "1234567890",
                "version": "1.0",
                "requested_attributes": {
                    "studentInfo": {
                        "names": [
                            "studentBirthDate",
                            "studentFullName",
                            "studentInfo",
                            "studentNumber",
                            "terms",
                            "transcript"
                        ],
                        "restrictions": [
                            {
                                "schema_name": schema[2]
                            }
                        ]
                    }
                },
                "requested_predicates": {}
            }
        }
      }
      return this.acapyService.sendProofRequest2(connection_id, proofRequest);
    }

    async sendHSTranscriptCredOffer(connection_id: string, cred_def_id: string) {
      console.log("sendTranscriptCredOffer", connection_id);
      const connectionData = await this.acapyService.getConnectionById(connection_id);
      console.log("ConnectionData=", connectionData);
      const studentID = this.extractStudentNumber(connectionData?.alias).trim();
      console.log("Student ID=", studentID);
      const studentTranscript: any = await this.sisService.getStudentTranscript(studentID);
      console.log("studentTranscript", studentTranscript);
    
      let studentInfo: any = {}
      let transcript: any = {}

      studentInfo.studentPhone =  (studentTranscript?.studentPhone==undefined) ? " " : studentTranscript?.studentPhone.toString()
      studentInfo.studentEmail =  (studentTranscript?.studentEmail==undefined) ? " " : studentTranscript?.studentEmail.toString()
      studentInfo.studentAddress =  (studentTranscript?.studentAddress==undefined) ? " " : studentTranscript?.studentAddress.toString()
      studentInfo.studentSsn =  (studentTranscript?.studentSsn==undefined) ? " " : studentTranscript?.studentSsn.toString()
      studentInfo.studentSex =  (studentTranscript?.studentSex==undefined) ? " " : studentTranscript?.studentSex.toString()
      studentInfo.studentContacts =  (studentTranscript?.studentContacts==undefined) ? " " : studentTranscript?.studentContacts.toString()
      studentInfo.studentStateId =  (studentTranscript?.studentStateId==undefined) ? " " : studentTranscript?.studentStateId.toString()
      studentInfo.schoolName =  (studentTranscript?.schoolName==undefined) ? " " : studentTranscript?.schoolName.toString()
      studentInfo.schoolAddress =  (studentTranscript?.schoolAddress==undefined) ? " " : studentTranscript?.schoolAddress.toString()
      studentInfo.schoolPhone =  (studentTranscript?.schoolPhone==undefined) ? " " : studentTranscript?.schoolPhone.toString()
      studentInfo.schoolFax =  (studentTranscript?.schoolFax==undefined) ? " " : studentTranscript?.schoolFax.toString()
      studentInfo.schoolCode =  (studentTranscript?.schoolCode==undefined) ? " " : studentTranscript?.schoolCode.toString()
      studentInfo.schoolDistrict =  (studentTranscript?.schoolDistrict==undefined) ? " " : studentTranscript?.schoolDistrict.toString()
      studentInfo.schoolDistrictPhone =  (studentTranscript?.schoolDistrictPhone==undefined) ? " " : studentTranscript?.schoolDistrictPhone.toString()
      studentInfo.schoolAccreditation =  (studentTranscript?.schoolAccreditation==undefined) ? " " : studentTranscript?.schoolAccreditation.toString()
      studentInfo.schoolCeebCode =  (studentTranscript?.schoolCeebCode==undefined) ? " " : studentTranscript?.schoolCeebCode.toString()
      studentInfo.schoolPrincipal =  (studentTranscript?.schoolPrincipal==undefined) ? " " : studentTranscript?.schoolPrincipal.toString()
      studentInfo.schoolPrincipalPhone =  (studentTranscript?.schoolPrincipalPhone==undefined) ? " " : studentTranscript?.schoolPrincipalPhone.toString()
      studentInfo.schoolGradeLevels =  (studentTranscript?.schoolGradeLevels==undefined) ? " " : studentTranscript?.schoolGradeLevels.toString()
      studentInfo.guardianName =  (studentTranscript?.guardianName==undefined) ? " " : studentTranscript?.guardianName.toString()
      studentInfo.guardianPhone =  (studentTranscript?.guardianPhone==undefined) ? " " : studentTranscript?.guardianPhone.toString()
      studentInfo.guardianEmail =  (studentTranscript?.guardianEmail==undefined) ? " " : studentTranscript?.guardianEmail.toString()
      studentInfo.gradeLevel =  (studentTranscript?.gradeLevel==undefined) ? " " : studentTranscript?.gradeLevel.toString()
      studentInfo.graduationDate =  (studentTranscript?.graduationDate==undefined) ? " " : studentTranscript?.graduationDate.toString()
      studentInfo.workExperience =  (studentTranscript?.workExperience==undefined) ? " " : studentTranscript?.workExperience.toString()
      studentInfo.achievements =  (studentTranscript?.achievements==undefined) ? " " : studentTranscript?.achievements.toString()

      transcript.program =  (studentTranscript?.program==undefined) ? " " : studentTranscript?.program.toString()
      transcript.gpa =  (studentTranscript?.gpa==undefined) ? " " : studentTranscript?.gpa.toString()
      transcript.gpaUnweighted =  (studentTranscript?.gpaUnweighted==undefined) ? " " : studentTranscript?.gpaUnweighted.toString()
      transcript.totalPoints =  (studentTranscript?.totalPoints==undefined) ? " " : studentTranscript?.totalPoints.toString()
      transcript.totalPointsUnweighted =  (studentTranscript?.totalPointsUnweighted==undefined) ? " " : studentTranscript?.totalPointsUnweighted.toString()
      transcript.classRank =  (studentTranscript?.classRank==undefined) ? " " : studentTranscript?.classRank.toString()
      transcript.attemptedCredits =  (studentTranscript?.attemptedCredits==undefined) ? " " : studentTranscript?.attemptedCredits.toString()
      transcript.earnedCredits =  (studentTranscript?.earnedCredits==undefined) ? " " : studentTranscript?.earnedCredits.toString()
      transcript.requiredCredits =  (studentTranscript?.requiredCredits==undefined) ? " " : studentTranscript?.requiredCredits.toString()
      transcript.remainingCredits =  (studentTranscript?.remainingCredits==undefined) ? " " : studentTranscript?.remainingCredits.toString()
      transcript.endorsements =  (studentTranscript?.endorsements==undefined) ? " " : studentTranscript?.endorsements.toString()
      transcript.mathRigor =  (studentTranscript?.mathRigor==undefined) ? " " : studentTranscript?.mathRigor.toString()
      transcript.cirriculumProgram =  (studentTranscript?.cirriculumProgram==undefined) ? " " : studentTranscript?.cirriculumProgram.toString()
      transcript.reqirementsRemaining =  (studentTranscript?.reqirementsRemaining==undefined) ? " " : studentTranscript?.reqirementsRemaining.toString()
      transcript.tests =  (studentTranscript?.tests==undefined) ? " " : studentTranscript?.tests.toString()
      transcript.creditSummary =  (studentTranscript?.creditSummary==undefined) ? " " : studentTranscript?.creditSummary.toString()
      transcript.ctePrograms =  (studentTranscript?.ctePrograms==undefined) ? " " : studentTranscript?.ctePrograms.toString()
      transcript.transcriptDate =  (studentTranscript?.transcriptDate==undefined) ? " " : studentTranscript?.transcriptDate.toString()
      transcript.transcriptComments =  (studentTranscript?.transcriptComments==undefined) ? " " : studentTranscript?.transcriptComments.toString()

      // get data for send offer
      const credentialOfferBody = {
        "auto_issue": true,
        "auto_remove": false,
        "connection_id": connection_id,
        "cred_def_id": cred_def_id,
        "credential_preview": {
          "@type": "issue-credential/1.0/credential-preview",
          "attributes": [
            {
              "name": "studentNumber",
              "value": (studentTranscript?.studentNumber==undefined) ? " " : studentTranscript?.studentNumber.toString()
            },
            {
              "name": "studentFullName",
              "value": (studentTranscript?.studentFullName==undefined) ? " " : studentTranscript?.studentFullName.toString()
            },
            {
              "name": "studentBirthDate",
              "value": (studentTranscript?.studentBirthDate==undefined) ? " " : studentTranscript?.studentBirthDate.toString()
            },
            {
              "name": "terms",
              "value": (studentTranscript?.terms==undefined) ? " " : studentTranscript?.terms.toString()
            },
            {
              "name": "studentInfo",
              "value": JSON.stringify(studentInfo)
            },
            {
              "name": "transcript",
              "value": JSON.stringify(transcript)
            }
          ]
        }
      }
      console.log("Credential offer=", credentialOfferBody);
      console.log("Credential attributes=", credentialOfferBody.credential_preview.attributes);
      await this.acapyService.sendCredOffer(credentialOfferBody);

  }

  async sendHSStudentIDCredOffer(connection_id: string, cred_def_id: string) {
        console.log("sendStudentIDCredOffer", connection_id);
        const connectionData = await this.acapyService.getConnectionById(connection_id);
        console.log("ConnectionData=", connectionData);
        const studentID = this.extractStudentNumber(connectionData?.alias).trim();
        console.log("Student ID=", studentID);
        const studentInfo = await this.sisService.getStudentId(studentID);
        console.log("studentInfo", studentInfo);
        // get data for send offer
        const credentialOfferBody = {
          "auto_issue": true,
          "connection_id": connection_id,
          "cred_def_id": cred_def_id,
          "credential_preview": {
            "@type": "issue-credential/1.0/credential-preview",
            "attributes": [
              {
                "name": "StudentNumber",
                "value": studentInfo.studentNumber
              },
              {
                "name": "FullName",
                "value": studentInfo.studentFullName
              },
              {
                "name": "SchoolName",
                "value": studentInfo.schoolName
              },
              {
                "name": "Expiration",
                "value": "20260701"
              },
              {
                "name": "CardURL",
                "value": ""
              },
              {
                "name": "BirthDate",
                "value": ""
              },
              {
                "name": "QrcodeFields",
                "value": "StudentNumber"
              },
              {
                "name": "BarcodeFields",
                "value": "StudentNumber"
              },
              {
                "name": "NfcFields",
                "value": "StudentNumber"
              }
            ]
          }
        }
        console.log("Credential offer=", credentialOfferBody);
        console.log("Credential attributes=", credentialOfferBody.credential_preview.attributes);
        await this.acapyService.sendCredOffer(credentialOfferBody);
  }

  async sendCollegeStudentIDCredOffer(connection_id: string, cred_def_id: string) {
      console.log("sendStudentIDCredOffer", connection_id);
      const connectionData = await this.acapyService.getConnectionById(connection_id);
      console.log("ConnectionData=", connectionData);
      const studentID = this.extractStudentNumber(connectionData?.alias).trim();
      console.log("Student ID=", studentID);
      const studentInfo = await this.sisService.getStudentId(studentID);
      console.log("studentInfo", studentInfo);
      // get data for send offer
      const credentialOfferBody = {
        "auto_issue": true,
        "auto_remove": false,
        "connection_id": connection_id,
        "cred_def_id": cred_def_id,
        "credential_preview": {
          "@type": "issue-credential/1.0/credential-preview",
          "attributes": [
            {
              "name": "StudentNumber",
              "value": studentInfo.studentNumber
            },
            {
              "name": "FullName",
              "value": studentInfo.studentFullName
            },
            {
              "name": "SchoolName",
              "value": studentInfo.schoolName
            },
            {
              "name": "Expiration",
              "value": "20260701"
            },
            {
              "name": "CardURL",
              "value": ""
            },
            {
              "name": "BirthDate",
              "value": ""
            },
            {
              "name": "QrcodeFields",
              "value": "StudentNumber"
            },
            {
              "name": "BarcodeFields",
              "value": "StudentNumber"
            },
            {
              "name": "NfcFields",
              "value": "StudentNumber"
            },
            {
              "name": "StudentPhoto",
              "value": studentInfo.studentPhoto
            }
          ]
        }
      }
      console.log("Credential offer=", credentialOfferBody);
      console.log("Credential attributes=", credentialOfferBody.credential_preview.attributes);
      await this.acapyService.sendCredOffer(credentialOfferBody);
  }

  async sendCollegeTranscriptCredOffer(connection_id: string, cred_def_id: string) {
    console.log("sendCollegeTranscriptCredOffer", connection_id);
    const connectionData = await this.acapyService.getConnectionById(connection_id);
    console.log("ConnectionData=", connectionData);
    const studentID = this.extractStudentNumber(connectionData?.alias).trim();
    console.log("Student ID=", studentID);
    const studentTranscript: any = await this.sisService.getStudentTranscript(studentID);
    console.log("studentTranscript", studentTranscript);
  
    let studentInfo: any = {}
    let transcript: any = {}

    studentInfo.studentPhone =  (studentTranscript?.studentPhone==undefined) ? " " : studentTranscript?.studentPhone.toString()
    studentInfo.studentEmail =  (studentTranscript?.studentEmail==undefined) ? " " : studentTranscript?.studentEmail.toString()
    studentInfo.studentAddress =  (studentTranscript?.studentAddress==undefined) ? " " : studentTranscript?.studentAddress.toString()
    studentInfo.studentSsn =  (studentTranscript?.studentSsn==undefined) ? " " : studentTranscript?.studentSsn.toString()
    studentInfo.studentSex =  (studentTranscript?.studentSex==undefined) ? " " : studentTranscript?.studentSex.toString()
    studentInfo.studentContacts =  (studentTranscript?.studentContacts==undefined) ? " " : studentTranscript?.studentContacts.toString()
    studentInfo.studentStateId =  (studentTranscript?.studentStateId==undefined) ? " " : studentTranscript?.studentStateId.toString()
    studentInfo.schoolName =  (studentTranscript?.schoolName==undefined) ? " " : studentTranscript?.schoolName.toString()
    studentInfo.schoolAddress =  (studentTranscript?.schoolAddress==undefined) ? " " : studentTranscript?.schoolAddress.toString()
    studentInfo.schoolPhone =  (studentTranscript?.schoolPhone==undefined) ? " " : studentTranscript?.schoolPhone.toString()
    studentInfo.schoolFax =  (studentTranscript?.schoolFax==undefined) ? " " : studentTranscript?.schoolFax.toString()
    studentInfo.schoolCode =  (studentTranscript?.schoolCode==undefined) ? " " : studentTranscript?.schoolCode.toString()
    studentInfo.schoolDistrict =  (studentTranscript?.schoolDistrict==undefined) ? " " : studentTranscript?.schoolDistrict.toString()
    studentInfo.schoolDistrictPhone =  (studentTranscript?.schoolDistrictPhone==undefined) ? " " : studentTranscript?.schoolDistrictPhone.toString()
    studentInfo.schoolAccreditation =  (studentTranscript?.schoolAccreditation==undefined) ? " " : studentTranscript?.schoolAccreditation.toString()
    studentInfo.schoolCeebCode =  (studentTranscript?.schoolCeebCode==undefined) ? " " : studentTranscript?.schoolCeebCode.toString()
    studentInfo.schoolPrincipal =  (studentTranscript?.schoolPrincipal==undefined) ? " " : studentTranscript?.schoolPrincipal.toString()
    studentInfo.schoolPrincipalPhone =  (studentTranscript?.schoolPrincipalPhone==undefined) ? " " : studentTranscript?.schoolPrincipalPhone.toString()
    studentInfo.schoolGradeLevels =  (studentTranscript?.schoolGradeLevels==undefined) ? " " : studentTranscript?.schoolGradeLevels.toString()
    studentInfo.guardianName =  (studentTranscript?.guardianName==undefined) ? " " : studentTranscript?.guardianName.toString()
    studentInfo.guardianPhone =  (studentTranscript?.guardianPhone==undefined) ? " " : studentTranscript?.guardianPhone.toString()
    studentInfo.guardianEmail =  (studentTranscript?.guardianEmail==undefined) ? " " : studentTranscript?.guardianEmail.toString()
    studentInfo.gradeLevel =  (studentTranscript?.gradeLevel==undefined) ? " " : studentTranscript?.gradeLevel.toString()
    studentInfo.graduationDate =  (studentTranscript?.graduationDate==undefined) ? " " : studentTranscript?.graduationDate.toString()
    studentInfo.workExperience =  (studentTranscript?.workExperience==undefined) ? " " : studentTranscript?.workExperience.toString()
    studentInfo.achievements =  (studentTranscript?.achievements==undefined) ? " " : studentTranscript?.achievements.toString()

    transcript.program =  (studentTranscript?.program==undefined) ? " " : studentTranscript?.program.toString()
    transcript.gpa =  (studentTranscript?.gpa==undefined) ? " " : studentTranscript?.gpa.toString()
    transcript.gpaUnweighted =  (studentTranscript?.gpaUnweighted==undefined) ? " " : studentTranscript?.gpaUnweighted.toString()
    transcript.totalPoints =  (studentTranscript?.totalPoints==undefined) ? " " : studentTranscript?.totalPoints.toString()
    transcript.totalPointsUnweighted =  (studentTranscript?.totalPointsUnweighted==undefined) ? " " : studentTranscript?.totalPointsUnweighted.toString()
    transcript.classRank =  (studentTranscript?.classRank==undefined) ? " " : studentTranscript?.classRank.toString()
    transcript.attemptedCredits =  (studentTranscript?.attemptedCredits==undefined) ? " " : studentTranscript?.attemptedCredits.toString()
    transcript.earnedCredits =  (studentTranscript?.earnedCredits==undefined) ? " " : studentTranscript?.earnedCredits.toString()
    transcript.requiredCredits =  (studentTranscript?.requiredCredits==undefined) ? " " : studentTranscript?.requiredCredits.toString()
    transcript.remainingCredits =  (studentTranscript?.remainingCredits==undefined) ? " " : studentTranscript?.remainingCredits.toString()
    transcript.endorsements =  (studentTranscript?.endorsements==undefined) ? " " : studentTranscript?.endorsements.toString()
    transcript.mathRigor =  (studentTranscript?.mathRigor==undefined) ? " " : studentTranscript?.mathRigor.toString()
    transcript.cirriculumProgram =  (studentTranscript?.cirriculumProgram==undefined) ? " " : studentTranscript?.cirriculumProgram.toString()
    transcript.reqirementsRemaining =  (studentTranscript?.reqirementsRemaining==undefined) ? " " : studentTranscript?.reqirementsRemaining.toString()
    transcript.tests =  (studentTranscript?.tests==undefined) ? " " : studentTranscript?.tests.toString()
    transcript.creditSummary =  (studentTranscript?.creditSummary==undefined) ? " " : studentTranscript?.creditSummary.toString()
    transcript.ctePrograms =  (studentTranscript?.ctePrograms==undefined) ? " " : studentTranscript?.ctePrograms.toString()
    transcript.transcriptDate =  (studentTranscript?.transcriptDate==undefined) ? " " : studentTranscript?.transcriptDate.toString()
    transcript.transcriptComments =  (studentTranscript?.transcriptComments==undefined) ? " " : studentTranscript?.transcriptComments.toString()

    // get data for send offer
    const credentialOfferBody = {
      "auto_issue": true,
      "auto_remove": false,
      "connection_id": connection_id,
      "cred_def_id": cred_def_id,
      "credential_preview": {
        "@type": "issue-credential/1.0/credential-preview",
        "attributes": [
          {
            "name": "studentNumber",
            "value": (studentTranscript?.studentNumber==undefined) ? " " : studentTranscript?.studentNumber.toString()
          },
          {
            "name": "studentFullName",
            "value": (studentTranscript?.studentFullName==undefined) ? " " : studentTranscript?.studentFullName.toString()
          },
          {
            "name": "gpa",
            "value": (studentTranscript?.gpa==undefined) ? " " : studentTranscript?.gpa.toString()
          },
          {
            "name": "studentBirthDate",
            "value": (studentTranscript?.studentBirthDate==undefined) ? " " : studentTranscript?.studentBirthDate.toString()
          },
          {
            "name": "terms",
            "value": (studentTranscript?.terms==undefined) ? " " : studentTranscript?.terms.toString()
          },
          {
            "name": "studentInfo",
            "value": JSON.stringify(studentInfo)
          },
          {
            "name": "transcript",
            "value": JSON.stringify(transcript)
          }
        ]
      }
    }
    console.log("Credential offer=", credentialOfferBody);
    console.log("Credential attributes=", credentialOfferBody.credential_preview.attributes);
    await this.acapyService.sendCredOffer(credentialOfferBody);

  }

  private extractStudentNumber(alias: string): string | null {
        const parts = alias.split(' -studentID- ');
        return parts.length > 1 ? parts[1] : null;
  }
}