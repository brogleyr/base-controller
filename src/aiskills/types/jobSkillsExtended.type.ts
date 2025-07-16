export type jobSkillExtendedType = Array<{
  title: string;
  salary: string;
  location: string;
  url: string;
  requirementsAnalysis: {
    summary: string;
    justification: string;
    experienceRequired: string[];
    experiencePreferred: string[];
    softwareRequired: string[];
    softwarePreferred: string[];
    certifications: string[];
    education: string[];
    musthaves: string[];
    optionalRecommended: string[];
    atGlance: string[];
    expertiseRanking: string;
  };
}>;
