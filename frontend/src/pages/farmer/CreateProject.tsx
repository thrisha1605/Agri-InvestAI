import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle, MapPin, Sprout, Droplets, DollarSign,
  Leaf, Image as ImageIcon, FileText, ArrowRight, ArrowLeft, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LandDetailsStep,
  CropInfoStep,
  IrrigationTimelineStep,
  FundingStep,
  ESGFactorsStep,
  ImageUploadStep,
  ReviewStep
} from '@/components/forms/ProjectWizardSteps';
import {
  landDetailsSchema,
  cropInfoSchema,
  irrigationTimelineSchema,
  fundingSchema,
  esgFactorsSchema,
  LandDetailsForm,
  CropInfoForm,
  IrrigationTimelineForm,
  FundingForm,
  ESGFactorsForm,
} from '@/lib/validations';
import { addProject } from '@/lib/appData';
import { authService } from '@/lib/auth';
import { calculateLocalEsgSummary, fetchProjectInsights, getWaterInvestmentPlan } from '@/lib/agriAi';

const STEPS = [
  { id: 1, title: 'Land Details', icon: MapPin, description: 'Location and soil information' },
  { id: 2, title: 'Crop Info', icon: Sprout, description: 'Crop type and variety' },
  { id: 3, title: 'Irrigation & Timeline', icon: Droplets, description: 'Water and schedule' },
  { id: 4, title: 'Funding', icon: DollarSign, description: 'Budget breakdown' },
  { id: 5, title: 'ESG Factors', icon: Leaf, description: 'Sustainability practices' },
  { id: 6, title: 'Images', icon: ImageIcon, description: 'Upload land/crop photos' },
  { id: 7, title: 'Documents', icon: FileText, description: 'Upload required proofs' },
  { id: 8, title: 'Review', icon: CheckCircle, description: 'Preview and submit' },
];

type DocumentState = {
  aadhaarDocument: File | null;
  landDocument: File | null;
  bankDocument: File | null;
  cultivationPlanDocument: File | null;
  soilTestDocument: File | null;
  waterSourceDocument: File | null;
  organicCertificate: File | null;
  otherDocument: File | null;
};

type UploadedDocumentItem = {
  label: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
};

export function CreateProject() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<any>({});
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [projectInsights, setProjectInsights] = useState<Record<string, unknown> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [documents, setDocuments] = useState<DocumentState>({
    aadhaarDocument: null,
    landDocument: null,
    bankDocument: null,
    cultivationPlanDocument: null,
    soilTestDocument: null,
    waterSourceDocument: null,
    organicCertificate: null,
    otherDocument: null,
  });

  const landForm = useForm<LandDetailsForm>({
    resolver: zodResolver(landDetailsSchema),
    defaultValues: projectData.landDetails || {
      landOwnership: 'OWNED',
      temperature: 26,
      humidity: 65,
      rainfall: 800,
    },
  });

  const cropForm = useForm<CropInfoForm>({
    resolver: zodResolver(cropInfoSchema),
    defaultValues: projectData.cropInfo || {
      yieldUnit: 'QUINTAL',
      organicCertified: false,
      nitrogen: undefined,
      phosphorus: undefined,
      potassium: undefined,
    },
  });

  const irrigationForm = useForm<IrrigationTimelineForm>({
    resolver: zodResolver(irrigationTimelineSchema),
    defaultValues: projectData.irrigation || {
      irrigationMethod: 'DRIP',
    },
  });

  const fundingForm = useForm<FundingForm>({
    resolver: zodResolver(fundingSchema),
    defaultValues: projectData.funding || {
      seedsCost: 0,
      fertilizersCost: 0,
      pesticidesCost: 0,
      laborCost: 0,
      irrigationCost: 0,
      machineryRental: 0,
      otherCosts: 0,
      expectedRevenue: 0,
      minimumInvestment: 10000,
    },
  });

  const esgForm = useForm<ESGFactorsForm>({
    resolver: zodResolver(esgFactorsSchema),
    defaultValues: projectData.esg || {
      waterUsage: 160000,
      fertilizerType: 'INTEGRATED',
      pesticideLevel: 'MEDIUM',
      renewableEnergy: 20,
      fairWages: false,
      workersEmployed: 4,
      communityBenefit: 60,
      documentsUploaded: 0,
      transparencyScore: 70,
      trustScore: 72,
    },
  });

  const handleDocumentUpload = (
    key: keyof DocumentState,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setDocuments((prev) => ({ ...prev, [key]: file }));
  };

  const validateDocuments = () => {
    if (!documents.aadhaarDocument) {
      toast.error('Please upload Aadhaar / Government ID proof');
      return false;
    }

    if (!documents.landDocument) {
      toast.error('Please upload land ownership or lease document');
      return false;
    }

    if (!documents.bankDocument) {
      toast.error('Please upload bank / UPI payment proof');
      return false;
    }

    if (!documents.cultivationPlanDocument) {
      toast.error('Please upload cultivation plan document');
      return false;
    }

    return true;
  };

  const countUploadedDocuments = () =>
    Object.values(documents).filter(Boolean).length;

  const prepareReviewData = async (data: any) => {
    const nextEsg = {
      ...(data.esg || {}),
      documentsUploaded: countUploadedDocuments(),
    };

    const nextData = {
      ...data,
      esg: nextEsg,
    };

    try {
      const insights = await fetchProjectInsights({
        landDetails: nextData.landDetails,
        cropInfo: nextData.cropInfo,
        irrigation: nextData.irrigation,
        funding: nextData.funding,
        esg: nextEsg,
        documents: getDocumentItems(),
      });
      setProjectInsights(insights);
      return { ...nextData, projectInsights: insights };
    } catch (error) {
      console.warn('Project insight preview fallback', error);
      const waterPlan = getWaterInvestmentPlan(nextData.irrigation?.waterSource);
      const esgSummary = calculateLocalEsgSummary(nextEsg);
      const baseFunding =
        Number(nextData.funding?.seedsCost || 0) +
        Number(nextData.funding?.fertilizersCost || 0) +
        Number(nextData.funding?.pesticidesCost || 0) +
        Number(nextData.funding?.laborCost || 0) +
        Number(nextData.funding?.irrigationCost || 0) +
        Number(nextData.funding?.machineryRental || 0) +
        Number(nextData.funding?.otherCosts || 0);
      const totalInvestment = baseFunding + Number(waterPlan.waterCost || 0);
      const expectedRevenue = Number(nextData.funding?.expectedRevenue || 0);
      const localInsights = {
        waterAnalysis: waterPlan,
        esgBreakdown: esgSummary,
        totalInvestment,
        expectedRevenue,
        expectedROI:
          totalInvestment > 0
            ? Math.round(((expectedRevenue - totalInvestment) / totalInvestment) * 100)
            : 0,
        needsWaterInvestment: waterPlan.needsWaterInvestment,
        waterCost: waterPlan.waterCost,
      };
      setProjectInsights(localInsights);
      return { ...nextData, projectInsights: localInsights };
    }
  };

  const handleNext = async () => {
    let isValid = false;
    let data: any = {};

    switch (currentStep) {
      case 1:
        isValid = await landForm.trigger();
        if (isValid) data = { landDetails: landForm.getValues() };
        break;

      case 2:
        isValid = await cropForm.trigger();
        if (isValid) data = { cropInfo: cropForm.getValues() };
        break;

      case 3:
        isValid = await irrigationForm.trigger();
        if (isValid) data = { irrigation: irrigationForm.getValues() };
        break;

      case 4:
        isValid = await fundingForm.trigger();
        if (isValid) data = { funding: fundingForm.getValues() };
        break;

      case 5:
        isValid = true;
        data = { esg: esgForm.getValues() };
        break;

      case 6:
        isValid = uploadedImages.length >= 3;
        if (!isValid) {
          toast.error('Please upload at least 3 images of your land and crop');
          return;
        }
        data = { images: uploadedImages };
        break;

      case 7:
        isValid = validateDocuments();
        if (isValid) {
          data = { documents };
        }
        break;

      default:
        isValid = true;
    }

    if (isValid) {
      let nextProjectData = { ...projectData, ...data };

      if (currentStep === 5) {
        generateProjectDescription(nextProjectData);
      }

      if (currentStep === 7) {
        nextProjectData = await prepareReviewData(nextProjectData);
        generateProjectDescription(nextProjectData);
      }

      setProjectData(nextProjectData);
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const buildProjectDescription = (data: any) => {
    const { landDetails, cropInfo, irrigation, funding, esg, projectInsights: currentInsights } = data;

    const totalCost =
      Number(funding?.seedsCost || 0) +
      Number(funding?.fertilizersCost || 0) +
      Number(funding?.pesticidesCost || 0) +
      Number(funding?.laborCost || 0) +
      Number(funding?.irrigationCost || 0) +
      Number(funding?.machineryRental || 0) +
      Number(funding?.otherCosts || 0);

    const esgSummary = currentInsights?.esgBreakdown || calculateLocalEsgSummary({
      waterUsage: esg?.waterUsage || 0,
      fertilizerType: esg?.fertilizerType || 'CHEMICAL',
      pesticideLevel: esg?.pesticideLevel || 'MEDIUM',
      renewableEnergy: esg?.renewableEnergy || 0,
      workersEmployed: esg?.workersEmployed || 0,
      fairWages: esg?.fairWages || false,
      communityBenefit: esg?.communityBenefit || 0,
      documentsUploaded: esg?.documentsUploaded || 0,
      transparencyScore: esg?.transparencyScore || 0,
      trustScore: esg?.trustScore || 0,
    });
    const waterPlan = currentInsights?.waterAnalysis || getWaterInvestmentPlan(irrigation?.waterSource);
    const totalInvestment = Number(currentInsights?.totalInvestment || totalCost + Number(waterPlan?.waterCost || 0));
    const expectedRevenue = Number(currentInsights?.expectedRevenue || funding?.expectedRevenue || 0);
    const roi = totalInvestment > 0 ? (((expectedRevenue - totalInvestment) / totalInvestment) * 100).toFixed(1) : '0';
    const cropAnalysis = currentInsights?.cropAnalysis as Record<string, unknown> | undefined;

    return `
This is a professionally managed ${cropInfo?.cropType?.toLowerCase()} cultivation project spread across ${landDetails?.acreage} acres of ${landDetails?.soilType?.toLowerCase()} soil in ${landDetails?.location}, ${landDetails?.district}, ${landDetails?.state}.

Crop variety: ${cropInfo?.cropVariety}
Expected yield: ${Number(currentInsights?.expectedYield || cropInfo?.expectedYield || 0)} ${cropInfo?.yieldUnit?.toLowerCase()}
Planting date: ${irrigation?.plantingDate ? new Date(irrigation.plantingDate).toLocaleDateString('en-IN') : '-'}
Harvest date: ${irrigation?.harvestDate ? new Date(irrigation.harvestDate).toLocaleDateString('en-IN') : '-'}
Weather: ${landDetails?.temperature || '-'} C, ${landDetails?.humidity || '-'}% humidity, ${landDetails?.rainfall || '-'} mm rainfall
Soil chemistry: pH ${landDetails?.soilPH || '-'}, N ${cropInfo?.nitrogen ?? '-'}, P ${cropInfo?.phosphorus ?? '-'}, K ${cropInfo?.potassium ?? '-'}

Irrigation method: ${irrigation?.irrigationMethod}
Water source: ${irrigation?.waterSource || '-'}
Water assessment: ${waterPlan?.label || 'No water warning'}

Sustainability:
Environmental score: ${esgSummary?.environmentalScore || 0}
Social score: ${esgSummary?.socialScore || 0}
Governance score: ${esgSummary?.governanceScore || 0}
Final ESG score: ${esgSummary?.finalESGScore || 0} (${esgSummary?.label || 'Pending'})

Crop analysis:
Suitability score: ${cropAnalysis?.suitabilityScore || '-'}
Risk level: ${cropAnalysis?.riskLevel || currentInsights?.riskLevel || '-'}
Estimated profit: Rs. ${Number(cropAnalysis?.profitEstimate || 0).toLocaleString('en-IN')}

Financial overview:
Base cultivation cost: Rs. ${totalCost.toLocaleString('en-IN')}
Water infrastructure cost: Rs. ${Number(waterPlan?.waterCost || 0).toLocaleString('en-IN')}
Total project cost: Rs. ${totalInvestment.toLocaleString('en-IN')}
Expected revenue: Rs. ${expectedRevenue.toLocaleString('en-IN')}
Estimated ROI: ${roi}%
    `.trim();
  };

  const generateProjectDescription = (data: any) => {
    const description = buildProjectDescription(data);
    setGeneratedDescription(description);
    toast.success('AI-generated project description created!');
  };

  const getDocumentItems = (): UploadedDocumentItem[] => {
    const items: UploadedDocumentItem[] = [];

    const pushIfExists = (file: File | null, label: string) => {
      if (!file) return;
      items.push({
        label,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
      });
    };

    pushIfExists(documents.aadhaarDocument, 'Aadhaar / Government ID Proof');
    pushIfExists(documents.landDocument, 'Land Ownership / Lease Document');
    pushIfExists(documents.bankDocument, 'Bank Passbook / Cancelled Cheque / UPI Proof');
    pushIfExists(documents.cultivationPlanDocument, 'Cultivation Plan Document');
    pushIfExists(documents.soilTestDocument, 'Soil Test Report');
    pushIfExists(documents.waterSourceDocument, 'Water Source / Irrigation Proof');
    pushIfExists(documents.organicCertificate, 'Organic / Government Certificate');
    pushIfExists(documents.otherDocument, 'Other Supporting Document');

    return items;
  };

  const isImageFile = (file?: File | null) => !!file && file.type.startsWith('image/');
  const isPdfFile = (file?: File | null) => !!file && file.type === 'application/pdf';

  const encodeFileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const buildPersistedDocumentItems = async (): Promise<UploadedDocumentItem[]> => {
    const items: UploadedDocumentItem[] = [];
    const orderedDocuments: Array<[File | null, string]> = [
      [documents.aadhaarDocument, 'Aadhaar / Government ID Proof'],
      [documents.landDocument, 'Land Ownership / Lease Document'],
      [documents.bankDocument, 'Bank Passbook / Cancelled Cheque / UPI Proof'],
      [documents.cultivationPlanDocument, 'Cultivation Plan Document'],
      [documents.soilTestDocument, 'Soil Test Report'],
      [documents.waterSourceDocument, 'Water Source / Irrigation Proof'],
      [documents.organicCertificate, 'Organic / Government Certificate'],
      [documents.otherDocument, 'Other Supporting Document'],
    ];

    for (const [file, label] of orderedDocuments) {
      if (!file) continue;
      items.push({
        label,
        fileName: file.name,
        fileUrl: await encodeFileToDataUrl(file),
        fileType: file.type,
      });
    }

    return items;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }
    if (isSubmitting) {
      return;
    }

    const docsSummary = `
Required Documents:
- Aadhaar / ID Proof: ${documents.aadhaarDocument?.name || 'Not uploaded'}
- Land Document: ${documents.landDocument?.name || 'Not uploaded'}
- Bank / UPI Proof: ${documents.bankDocument?.name || 'Not uploaded'}
- Cultivation Plan: ${documents.cultivationPlanDocument?.name || 'Not uploaded'}

Optional Documents:
- Soil Test: ${documents.soilTestDocument?.name || 'Not uploaded'}
- Water Source Proof: ${documents.waterSourceDocument?.name || 'Not uploaded'}
- Organic Certificate: ${documents.organicCertificate?.name || 'Not uploaded'}
- Other Document: ${documents.otherDocument?.name || 'Not uploaded'}
    `.trim();

    try {
      setIsSubmitting(true);

      const finalProjectData = projectData.projectInsights
        ? projectData
        : await prepareReviewData(projectData);

      setProjectData(finalProjectData);

      const adminDocuments = await buildPersistedDocumentItems();
      const insights = (finalProjectData.projectInsights || projectInsights || {}) as Record<string, any>;
      const cropAnalysis = insights.cropAnalysis as Record<string, any> | undefined;
      const waterPlan = (insights.waterAnalysis || getWaterInvestmentPlan(finalProjectData.irrigation?.waterSource)) as Record<string, any>;
      const esgSummary = (insights.esgBreakdown || calculateLocalEsgSummary({
        waterUsage: finalProjectData.esg?.waterUsage || 0,
        fertilizerType: finalProjectData.esg?.fertilizerType || 'CHEMICAL',
        pesticideLevel: finalProjectData.esg?.pesticideLevel || 'MEDIUM',
        renewableEnergy: finalProjectData.esg?.renewableEnergy || 0,
        workersEmployed: finalProjectData.esg?.workersEmployed || 0,
        fairWages: finalProjectData.esg?.fairWages || false,
        communityBenefit: finalProjectData.esg?.communityBenefit || 0,
        documentsUploaded: finalProjectData.esg?.documentsUploaded || adminDocuments.length,
        transparencyScore: finalProjectData.esg?.transparencyScore || 0,
        trustScore: finalProjectData.esg?.trustScore || 0,
      })) as Record<string, any>;

      const baseFunding =
        Number(finalProjectData.funding?.seedsCost || 0) +
        Number(finalProjectData.funding?.fertilizersCost || 0) +
        Number(finalProjectData.funding?.pesticidesCost || 0) +
        Number(finalProjectData.funding?.laborCost || 0) +
        Number(finalProjectData.funding?.irrigationCost || 0) +
        Number(finalProjectData.funding?.machineryRental || 0) +
        Number(finalProjectData.funding?.otherCosts || 0);
      const waterCost = Number(waterPlan?.waterCost || insights.waterCost || 0);
      const totalInvestment = Number(insights.totalInvestment || baseFunding + waterCost);
      const expectedRevenueValue = Number(insights.expectedRevenue || finalProjectData.funding?.expectedRevenue || 0);
      const expectedYieldValue = Number(insights.expectedYield || finalProjectData.cropInfo?.expectedYield || 0);
      const expectedROIValue =
        totalInvestment > 0
          ? Math.round(((expectedRevenueValue - totalInvestment) / totalInvestment) * 100)
          : 0;
      const esgScore = Number(esgSummary.finalESGScore || 0);
      const riskLevel = String(cropAnalysis?.riskLevel || insights.riskLevel || 'MEDIUM');
      const investorAlerts = Array.isArray(insights.investorAlerts) ? insights.investorAlerts : [];
      const titleCrop = String(cropAnalysis?.crop || finalProjectData.cropInfo?.cropType || 'Crop');
      const description = buildProjectDescription(finalProjectData);
      const fullDescription = `${description}\n\n${docsSummary}`;

      setGeneratedDescription(description);

      const imageUrls = await Promise.all(
        uploadedImages.map((img) => encodeFileToDataUrl(img))
      );

      await addProject(
        {
          title: `${titleCrop} Cultivation Project`,
          description: fullDescription,
          location: finalProjectData.landDetails?.location || '',
          state: finalProjectData.landDetails?.state || 'Karnataka',
          cropType: finalProjectData.cropInfo?.cropType || '',
          acreage: Number(finalProjectData.landDetails?.acreage || 0),
          fundingGoal: totalInvestment,
          timeline: finalProjectData.irrigation?.harvestDate || '6 months',
          soilType: finalProjectData.landDetails?.soilType || '',
          irrigationType: finalProjectData.irrigation?.irrigationMethod || '',
          expectedRevenue: expectedRevenueValue,
          expectedExpenses: totalInvestment,
          expectedROI: expectedROIValue,
          expectedYield: expectedYieldValue,
          esgScore,
          riskLevel,
          status: 'PENDING',
          approvalStage: 'SENT_FOR_APPROVAL',
          approvalStatus: 'PENDING',
          projectStatus: 'NOT_STARTED',
          farmerName: user?.name || 'Farmer',
          farmerEmail: user?.email || '',
          phone: user?.phone || '',
          landDocument: documents.landDocument?.name || '',
          aadhaarDocument: documents.aadhaarDocument?.name || '',
          bankDocument: documents.bankDocument?.name || '',
          cultivationPlanDocument: documents.cultivationPlanDocument?.name || '',
          soilTestDocument: documents.soilTestDocument?.name || '',
          waterSourceDocument: documents.waterSourceDocument?.name || '',
          organicCertificate: documents.organicCertificate?.name || '',
          otherDocument: documents.otherDocument?.name || '',
          landDetails: finalProjectData.landDetails,
          cropInfo: finalProjectData.cropInfo,
          irrigation: finalProjectData.irrigation,
          funding: finalProjectData.funding,
          esg: finalProjectData.esg,
          projectInsights: insights,
          cropAnalysis,
          waterAnalysis: waterPlan,
          esgBreakdown: esgSummary,
          investorAlerts,
          needsWaterInvestment: Boolean(waterPlan?.needsWaterInvestment),
          waterCost,
          waterInvestmentLabel: waterPlan?.label || '',
          documents: adminDocuments,
          images: imageUrls,
          progressPhotos: imageUrls.map((url, index) => ({
            id: `progress-${Date.now()}-${index}`,
            title: `Uploaded Farm Image ${index + 1}`,
            imageUrl: url,
            uploadedAt: new Date().toLocaleDateString('en-IN'),
            note: 'Initial farmer-uploaded project proof image',
          })),
          tags: [
            finalProjectData.cropInfo?.cropType || '',
            finalProjectData.landDetails?.soilType || '',
            finalProjectData.irrigation?.irrigationMethod || '',
            Boolean(waterPlan?.needsWaterInvestment) ? 'Water Infrastructure Required' : '',
            riskLevel,
          ].filter(Boolean),
        } as any,
        user
      );

      toast.success('Project submitted successfully! It has been sent to admin for approval.');
      setTimeout(() => navigate('/farmer/dashboard'), 1500);
    } catch (error) {
      console.error('Project submission failed', error);
      toast.error('Unable to save the project to the backend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
          <p className="text-gray-600">
            Follow the steps to create your agricultural project and send it to admin for approval
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-8 overflow-x-auto pb-4">
          <div className="flex gap-2 min-w-max">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all min-w-[220px] ${
                    isActive
                      ? 'border-green-600 bg-green-50'
                      : isCompleted
                      ? 'border-green-600 bg-green-100'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>

                  <div>
                    <p className={`font-semibold text-sm ${isActive ? 'text-green-700' : isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {(() => {
                const StepIcon = STEPS[currentStep - 1].icon;
                return <StepIcon className="h-6 w-6 text-green-600" />;
              })()}
              <div>
                <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {currentStep === 1 && <LandDetailsStep form={landForm} />}
            {currentStep === 2 && <CropInfoStep form={cropForm} />}
            {currentStep === 3 && <IrrigationTimelineStep form={irrigationForm} />}
            {currentStep === 4 && <FundingStep form={fundingForm} />}
            {currentStep === 5 && <ESGFactorsStep form={esgForm} />}
            {currentStep === 6 && (
              <ImageUploadStep
                uploadedImages={uploadedImages}
                setUploadedImages={setUploadedImages}
              />
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="rounded-xl border bg-amber-50 p-4">
                  <h3 className="font-semibold mb-2">Required Documents for Admin Verification</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Aadhaar / ID Proof</Badge>
                    <Badge>Land Ownership / Lease</Badge>
                    <Badge>Bank / UPI Proof</Badge>
                    <Badge>Cultivation Plan</Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Aadhaar / Government ID Proof *</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('aadhaarDocument', e)} />
                    {documents.aadhaarDocument && <p className="text-xs text-green-600">{documents.aadhaarDocument.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Land Ownership / Lease Document *</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('landDocument', e)} />
                    {documents.landDocument && <p className="text-xs text-green-600">{documents.landDocument.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Bank Passbook / Cancelled Cheque / UPI Proof *</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('bankDocument', e)} />
                    {documents.bankDocument && <p className="text-xs text-green-600">{documents.bankDocument.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Cultivation Plan Document *</Label>
                    <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('cultivationPlanDocument', e)} />
                    {documents.cultivationPlanDocument && <p className="text-xs text-green-600">{documents.cultivationPlanDocument.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Soil Test Report</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('soilTestDocument', e)} />
                    {documents.soilTestDocument && <p className="text-xs text-green-600">{documents.soilTestDocument.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Water Source / Irrigation Proof</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('waterSourceDocument', e)} />
                    {documents.waterSourceDocument && <p className="text-xs text-green-600">{documents.waterSourceDocument.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Organic / Government Certificate</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload('organicCertificate', e)} />
                    {documents.organicCertificate && <p className="text-xs text-green-600">{documents.organicCertificate.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Other Supporting Document</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => handleDocumentUpload('otherDocument', e)} />
                    {documents.otherDocument && <p className="text-xs text-green-600">{documents.otherDocument.name}</p>}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <h3 className="font-semibold mb-4">Selected Document Preview</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {(
                      [
                        { label: 'Aadhaar / Government ID Proof', file: documents.aadhaarDocument },
                        { label: 'Land Ownership / Lease Document', file: documents.landDocument },
                        { label: 'Bank Passbook / Cancelled Cheque / UPI Proof', file: documents.bankDocument },
                        { label: 'Cultivation Plan Document', file: documents.cultivationPlanDocument },
                        { label: 'Soil Test Report', file: documents.soilTestDocument },
                        { label: 'Water Source / Irrigation Proof', file: documents.waterSourceDocument },
                        { label: 'Organic / Government Certificate', file: documents.organicCertificate },
                        { label: 'Other Supporting Document', file: documents.otherDocument },
                      ] as const
                    )
                      .filter((item) => item.file)
                      .map((item, index) => {
                        const file = item.file as File;
                        const fileUrl = URL.createObjectURL(file);

                        return (
                          <div key={index} className="rounded-lg border p-4 space-y-3">
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-gray-500 break-all">{file.name}</p>
                            </div>

                            {isImageFile(file) ? (
                              <img
                                src={fileUrl}
                                alt={item.label}
                                className="h-40 w-full rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-lg border bg-gray-50 text-sm text-gray-600">
                                PDF / Document Preview
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => setPreviewUrl(fileUrl)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View File
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 8 && (
              <div className="space-y-6">
                <ReviewStep
                  projectData={projectInsights ? { ...projectData, projectInsights } : projectData}
                  generatedDescription={generatedDescription}
                  setGeneratedDescription={setGeneratedDescription}
                />

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Uploaded Documents Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
                    <p><strong>Aadhaar:</strong> {documents.aadhaarDocument?.name || 'Not uploaded'}</p>
                    <p><strong>Land Document:</strong> {documents.landDocument?.name || 'Not uploaded'}</p>
                    <p><strong>Bank / UPI Proof:</strong> {documents.bankDocument?.name || 'Not uploaded'}</p>
                    <p><strong>Cultivation Plan:</strong> {documents.cultivationPlanDocument?.name || 'Not uploaded'}</p>
                    <p><strong>Soil Test:</strong> {documents.soilTestDocument?.name || 'Not uploaded'}</p>
                    <p><strong>Water Source Proof:</strong> {documents.waterSourceDocument?.name || 'Not uploaded'}</p>
                    <p><strong>Organic Certificate:</strong> {documents.organicCertificate?.name || 'Not uploaded'}</p>
                    <p><strong>Other Document:</strong> {documents.otherDocument?.name || 'Not uploaded'}</p>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">What Admin Can Verify</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
                    <p>• Farmer identity proof</p>
                    <p>• Land ownership / lease proof</p>
                    <p>• Bank / UPI payout proof</p>
                    <p>• Cultivation plan file</p>
                    <p>• Soil and irrigation supporting proof</p>
                    <p>• Farmer uploaded land / crop photos</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="px-6 bg-green-600 hover:bg-green-700">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 bg-green-600 hover:bg-green-700 text-lg"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Submit Project'}
            </Button>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-4xl rounded-xl bg-white p-4 shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-md bg-red-500 px-3 py-1 text-sm text-white"
              onClick={() => setPreviewUrl(null)}
            >
              Close
            </button>

            {previewUrl.endsWith('.pdf') ? (
              <iframe
                src={previewUrl}
                className="h-[80vh] w-full rounded-lg border"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
