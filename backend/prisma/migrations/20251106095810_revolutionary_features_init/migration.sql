-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'PROVIDER', 'EMPLOYER', 'ADMIN', 'RESEARCHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualHealthTwin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "biologicalAge" DOUBLE PRECISION NOT NULL,
    "chronologicalAge" INTEGER NOT NULL,
    "cardiovascularModel" JSONB NOT NULL,
    "metabolicModel" JSONB NOT NULL,
    "immuneModel" JSONB NOT NULL,
    "neurologicalModel" JSONB NOT NULL,
    "musculoskeletalModel" JSONB NOT NULL,
    "respiratoryModel" JSONB NOT NULL,
    "digestiveModel" JSONB NOT NULL,
    "endocrineModel" JSONB NOT NULL,
    "riskScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualHealthTwin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "healthTwinId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "interventionData" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentalHealthAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crisisRiskScore" INTEGER NOT NULL,
    "behavioralPatterns" JSONB NOT NULL,
    "linguisticMarkers" JSONB NOT NULL,
    "sleepPatterns" JSONB NOT NULL,
    "socialEngagement" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "interventions" JSONB NOT NULL,
    "safetyPlan" JSONB,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentalHealthAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultiOmicsProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genomicData" JSONB NOT NULL,
    "pharmacogenomics" JSONB NOT NULL,
    "microbiomeData" JSONB NOT NULL,
    "metaboliteProfile" JSONB NOT NULL,
    "dietaryPatterns" JSONB NOT NULL,
    "physicalActivity" JSONB NOT NULL,
    "sleepData" JSONB NOT NULL,
    "stressLevels" JSONB NOT NULL,
    "geneNutrientInteractions" JSONB NOT NULL,
    "personalizedNutrition" JSONB NOT NULL,
    "supplementRecommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultiOmicsProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongevityProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "biologicalAge" DOUBLE PRECISION NOT NULL,
    "epigeneticAge" DOUBLE PRECISION,
    "cardiovascularAge" DOUBLE PRECISION NOT NULL,
    "metabolicAge" DOUBLE PRECISION NOT NULL,
    "cognitiveAge" DOUBLE PRECISION NOT NULL,
    "biomarkers" JSONB NOT NULL,
    "interventionProtocol" JSONB NOT NULL,
    "predictedLifespan" INTEGER NOT NULL,
    "healthspan" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongevityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongevityIntervention" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "adherence" DOUBLE PRECISION NOT NULL,
    "results" JSONB NOT NULL,

    CONSTRAINT "LongevityIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerMetrics" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "avgMentalHealthScore" DOUBLE PRECISION NOT NULL,
    "avgPhysicalHealthScore" DOUBLE PRECISION NOT NULL,
    "avgBiologicalAge" DOUBLE PRECISION NOT NULL,
    "burnoutRisk" DOUBLE PRECISION NOT NULL,
    "absenteeismPrediction" INTEGER NOT NULL,
    "projectedHealthcareCosts" DOUBLE PRECISION NOT NULL,
    "costReductionOpportunities" JSONB NOT NULL,
    "departmentMetrics" JSONB NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderMetrics" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "patientSatisfaction" DOUBLE PRECISION NOT NULL,
    "diagnosticAccuracy" DOUBLE PRECISION NOT NULL,
    "treatmentEffectiveness" DOUBLE PRECISION NOT NULL,
    "readmissionRate" DOUBLE PRECISION NOT NULL,
    "complicationRate" DOUBLE PRECISION NOT NULL,
    "specialtyPercentile" INTEGER NOT NULL,
    "improvementAreas" JSONB NOT NULL,
    "errorAnalysis" JSONB NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FederatedModel" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "participatingNodes" INTEGER NOT NULL,
    "totalDataPoints" BIGINT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "validationMetrics" JSONB NOT NULL,
    "differentialPrivacy" BOOLEAN NOT NULL,
    "encryptionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederatedModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "healthRiskScore" DOUBLE PRECISION NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "basePremium" DOUBLE PRECISION NOT NULL,
    "adjustedPremium" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "healthImprovements" JSONB NOT NULL,
    "potentialSavings" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugCandidate" (
    "id" TEXT NOT NULL,
    "compoundName" TEXT NOT NULL,
    "targetDisease" TEXT NOT NULL,
    "mechanismOfAction" TEXT NOT NULL,
    "efficacyScore" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL,
    "noveltyScore" DOUBLE PRECISION NOT NULL,
    "eligiblePatients" JSONB NOT NULL,
    "predictedEnrollment" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PandemicAlert" (
    "id" TEXT NOT NULL,
    "alertLevel" TEXT NOT NULL,
    "pathogen" TEXT NOT NULL,
    "symptomClusters" JSONB NOT NULL,
    "geographicSpread" JSONB NOT NULL,
    "transmissionRate" DOUBLE PRECISION NOT NULL,
    "spreadPrediction" JSONB NOT NULL,
    "impactAssessment" JSONB NOT NULL,
    "containmentStrategies" JSONB NOT NULL,
    "alertDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PandemicAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "modules" JSONB NOT NULL,
    "cmeCredits" DOUBLE PRECISION,
    "certificationType" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataMarketplaceListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "dataDescription" TEXT NOT NULL,
    "deidentified" BOOLEAN NOT NULL,
    "encryptionLevel" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "consentScope" JSONB NOT NULL,
    "pricePerAccess" DOUBLE PRECISION NOT NULL,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DataMarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPurchase" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerType" TEXT NOT NULL,
    "buyerOrganization" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "sellerEarnings" DOUBLE PRECISION NOT NULL,
    "researchPurpose" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualHealthTwin_userId_key" ON "VirtualHealthTwin"("userId");

-- CreateIndex
CREATE INDEX "VirtualHealthTwin_userId_idx" ON "VirtualHealthTwin"("userId");

-- CreateIndex
CREATE INDEX "Simulation_healthTwinId_idx" ON "Simulation"("healthTwinId");

-- CreateIndex
CREATE INDEX "MentalHealthAssessment_userId_idx" ON "MentalHealthAssessment"("userId");

-- CreateIndex
CREATE INDEX "MentalHealthAssessment_crisisRiskScore_idx" ON "MentalHealthAssessment"("crisisRiskScore");

-- CreateIndex
CREATE INDEX "MentalHealthAssessment_assessmentDate_idx" ON "MentalHealthAssessment"("assessmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "MultiOmicsProfile_userId_key" ON "MultiOmicsProfile"("userId");

-- CreateIndex
CREATE INDEX "MultiOmicsProfile_userId_idx" ON "MultiOmicsProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LongevityProfile_userId_key" ON "LongevityProfile"("userId");

-- CreateIndex
CREATE INDEX "LongevityProfile_userId_idx" ON "LongevityProfile"("userId");

-- CreateIndex
CREATE INDEX "LongevityIntervention_profileId_idx" ON "LongevityIntervention"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployerProfile_userId_idx" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployerMetrics_employerId_idx" ON "EmployerMetrics"("employerId");

-- CreateIndex
CREATE INDEX "EmployerMetrics_metricDate_idx" ON "EmployerMetrics"("metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "ProviderProfile_userId_idx" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "ProviderProfile_specialty_idx" ON "ProviderProfile"("specialty");

-- CreateIndex
CREATE INDEX "ProviderMetrics_providerId_idx" ON "ProviderMetrics"("providerId");

-- CreateIndex
CREATE INDEX "ProviderMetrics_metricDate_idx" ON "ProviderMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "FederatedModel_modelName_idx" ON "FederatedModel"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProfile_userId_key" ON "InsuranceProfile"("userId");

-- CreateIndex
CREATE INDEX "InsuranceProfile_userId_idx" ON "InsuranceProfile"("userId");

-- CreateIndex
CREATE INDEX "DrugCandidate_targetDisease_idx" ON "DrugCandidate"("targetDisease");

-- CreateIndex
CREATE INDEX "DrugCandidate_stage_idx" ON "DrugCandidate"("stage");

-- CreateIndex
CREATE INDEX "PandemicAlert_alertLevel_idx" ON "PandemicAlert"("alertLevel");

-- CreateIndex
CREATE INDEX "PandemicAlert_alertDate_idx" ON "PandemicAlert"("alertDate");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- CreateIndex
CREATE INDEX "Course_difficultyLevel_idx" ON "Course"("difficultyLevel");

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "DataMarketplaceListing_userId_idx" ON "DataMarketplaceListing"("userId");

-- CreateIndex
CREATE INDEX "DataMarketplaceListing_dataType_idx" ON "DataMarketplaceListing"("dataType");

-- CreateIndex
CREATE INDEX "DataMarketplaceListing_active_idx" ON "DataMarketplaceListing"("active");

-- CreateIndex
CREATE INDEX "DataPurchase_listingId_idx" ON "DataPurchase"("listingId");

-- CreateIndex
CREATE INDEX "DataPurchase_purchasedAt_idx" ON "DataPurchase"("purchasedAt");

-- AddForeignKey
ALTER TABLE "VirtualHealthTwin" ADD CONSTRAINT "VirtualHealthTwin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_healthTwinId_fkey" FOREIGN KEY ("healthTwinId") REFERENCES "VirtualHealthTwin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalHealthAssessment" ADD CONSTRAINT "MentalHealthAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultiOmicsProfile" ADD CONSTRAINT "MultiOmicsProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongevityProfile" ADD CONSTRAINT "LongevityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongevityIntervention" ADD CONSTRAINT "LongevityIntervention_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "LongevityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerMetrics" ADD CONSTRAINT "EmployerMetrics_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderMetrics" ADD CONSTRAINT "ProviderMetrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceProfile" ADD CONSTRAINT "InsuranceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataMarketplaceListing" ADD CONSTRAINT "DataMarketplaceListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataPurchase" ADD CONSTRAINT "DataPurchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "DataMarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
