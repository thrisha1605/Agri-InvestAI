import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/auth";
import {
  addFarmerWithdrawal,
  addProgressUpdate,
  approveFarmerWithdrawal,
  fetchProjectProgress,
  fetchProjectById,
  fetchProjectWithdrawals,
  getProjectById,
  listProgress,
  listWithdrawals,
  startProject,
  updateProject,
  type AppProject,
  type FarmerWithdrawal,
  type MilestoneItem,
  type ProjectProgressUpdate,
} from "@/lib/appData";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  Bug,
  CheckCircle2,
  Clock3,
  Droplets,
  FileImage,
  FileText,
  HandCoins,
  IndianRupee,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Tractor,
  TrendingUp,
  Upload,
  UserCheck,
  Wallet,
  Warehouse,
} from "lucide-react";

type MilestoneKey =
  | "LAND_PREPARATION"
  | "SEED_SELECTION"
  | "SOWING_PLANTING"
  | "IRRIGATION_SETUP"
  | "FERTILIZATION"
  | "PEST_DISEASE_CONTROL"
  | "CROP_GROWTH"
  | "HARVESTING"
  | "STORAGE_DISTRIBUTION"
  | "SALE_COMPLETED"
  | "PROFIT_CALCULATION";

const milestoneMeta: Record<
  MilestoneKey,
  {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    percent: number;
  }
> = {
  LAND_PREPARATION: {
    title: "Land Preparation",
    description: "Ploughing, weed removal, soil preparation, and field readiness proof.",
    icon: Tractor,
    percent: 10,
  },
  SEED_SELECTION: {
    title: "Seed Selection",
    description: "Selection of seeds and nursery/seed readiness details.",
    icon: Sprout,
    percent: 18,
  },
  SOWING_PLANTING: {
    title: "Sowing / Planting",
    description: "Seed sowing or planting proof and planting notes.",
    icon: Sprout,
    percent: 28,
  },
  IRRIGATION_SETUP: {
    title: "Irrigation Setup",
    description: "Drip/sprinkler setup, water planning, and watering updates.",
    icon: Droplets,
    percent: 38,
  },
  FERTILIZATION: {
    title: "Fertilization",
    description: "Nutrient application and soil enrichment updates.",
    icon: Leaf,
    percent: 48,
  },
  PEST_DISEASE_CONTROL: {
    title: "Pest / Disease Control",
    description: "Pest monitoring, disease control activities, and crop protection proof.",
    icon: Bug,
    percent: 58,
  },
  CROP_GROWTH: {
    title: "Crop Growth Monitoring",
    description: "Periodic growth updates, crop health, and investor-visible proof.",
    icon: BarChart3,
    percent: 70,
  },
  HARVESTING: {
    title: "Harvesting",
    description: "Harvest completion, quantity capture, and harvest evidence.",
    icon: PackageCheck,
    percent: 82,
  },
  STORAGE_DISTRIBUTION: {
    title: "Storage / Distribution",
    description: "Storage, packaging, logistics, and transport updates.",
    icon: Warehouse,
    percent: 92,
  },
  SALE_COMPLETED: {
    title: "Sale Completed",
    description: "Crop sale completion and revenue recording.",
    icon: TrendingUp,
    percent: 97,
  },
  PROFIT_CALCULATION: {
    title: "Profit Calculation",
    description: "Final expenses, 3% platform fee, and stakeholder profit split.",
    icon: TrendingUp,
    percent: 100,
  },
};

type UiLog = ProjectProgressUpdate & {
  title: string;
  cropHealth: string;
  proofName?: string;
  proofImage?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    SENT_FOR_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERIFIED: "bg-blue-100 text-blue-800 border-blue-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    NOT_STARTED: "bg-slate-100 text-slate-700 border-slate-200",
    OPEN_FOR_FUNDING: "bg-sky-100 text-sky-800 border-sky-200",
    READY_TO_START: "bg-emerald-100 text-emerald-800 border-emerald-200",
    IN_PROGRESS: "bg-indigo-100 text-indigo-800 border-indigo-200",
    HARVESTING: "bg-orange-100 text-orange-800 border-orange-200",
    SALE_COMPLETED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    PROFIT_CALCULATED: "bg-purple-100 text-purple-800 border-purple-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-slate-100 text-slate-700 border-slate-200",
    IN_PROGRESS_MILESTONE: "bg-indigo-100 text-indigo-800 border-indigo-200",
    COMPLETED_MILESTONE: "bg-green-100 text-green-800 border-green-200",
    REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    UNDER_VERIFICATION: "bg-blue-100 text-blue-800 border-blue-200",
    APPROVED_PAYOUT: "bg-emerald-100 text-emerald-800 border-emerald-200",
    DISBURSED: "bg-green-100 text-green-800 border-green-200",
  };
  const labels: Record<string, string> = {
    READY_TO_START: "FUND RAISED",
  };

  return (
    <Badge
      variant="outline"
      className={map[status] || "bg-gray-100 text-gray-800 border-gray-200"}
    >
      {labels[status] || status.replaceAll("_", " ")}
    </Badge>
  );
}

function milestoneUiStatus(milestone: MilestoneItem, idx: number, project: AppProject) {
  if (project.projectStatus === "NOT_STARTED" || project.approvalStage !== "APPROVED") {
    return idx === 0 ? "PENDING" : "LOCKED";
  }

  if (milestone.status === "COMPLETED") return "COMPLETED_MILESTONE";
  if (milestone.status === "IN_PROGRESS") return "IN_PROGRESS_MILESTONE";
  return "PENDING";
}

export function ProjectTracking() {
  const { projectId, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const resolvedProjectId = projectId || id || "";

  const [project, setProject] = useState<AppProject | null>(null);
  const [logs, setLogs] = useState<UiLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<FarmerWithdrawal[]>([]);

  const [selectedMilestone, setSelectedMilestone] =
    useState<MilestoneKey>("LAND_PREPARATION");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityNotes, setActivityNotes] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [cropHealth, setCropHealth] = useState("Healthy");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedImageName, setSelectedImageName] = useState("");

  const [withdrawMilestone, setWithdrawMilestone] =
    useState<MilestoneKey>("LAND_PREPARATION");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");

  const [revenue, setRevenue] = useState("850000");
  const [adminRemark, setAdminRemark] = useState("");

  const loadData = async () => {
    if (!resolvedProjectId) return;

    const found = await fetchProjectById(resolvedProjectId).catch(() => getProjectById(resolvedProjectId));
    setProject(found || null);

    const allLogs = await fetchProjectProgress(resolvedProjectId).catch(() => listProgress(resolvedProjectId));
    const uiLogs: UiLog[] = allLogs.map((log) => ({
      ...log,
      title: log.title || milestoneMeta[log.milestoneKey as MilestoneKey]?.title || log.stage,
      cropHealth: log.cropHealth || "Healthy",
      proofName: log.proofName || (log.image ? "uploaded-image" : ""),
      proofImage: log.image,
      status:
        log.status === "VERIFIED"
          ? "VERIFIED"
          : log.status === "REJECTED"
            ? "REJECTED"
            : "PENDING",
    }));

    setLogs(uiLogs);

    const allWithdrawals = await fetchProjectWithdrawals(resolvedProjectId).catch(() => listWithdrawals(resolvedProjectId));
    setWithdrawals(allWithdrawals);
  };

  useEffect(() => {
    void loadData();
  }, [resolvedProjectId]);

  const currentFundingPercent = useMemo(() => {
    if (!project || !project.fundingGoal) return 0;
    return Math.round((project.fundedAmount / project.fundingGoal) * 100);
  }, [project]);

  const canFarmerStartProject =
    user?.role === "FARMER" &&
    project?.approvalStage === "APPROVED" &&
    currentFundingPercent >= 40 &&
    project?.projectStatus !== "IN_PROGRESS" &&
    project?.projectStatus !== "HARVESTING" &&
    project?.projectStatus !== "SALE_COMPLETED" &&
    project?.projectStatus !== "PROFIT_CALCULATED" &&
    project?.projectStatus !== "COMPLETED";

  const canFarmerUpdate =
    user?.role === "FARMER" &&
    project?.approvalStage === "APPROVED" &&
    currentFundingPercent >= 40 &&
    (project?.projectStatus === "IN_PROGRESS" || project?.projectStatus === "HARVESTING");

  const isInvestor = user?.role === "INVESTOR";
  const isPartner = user?.role === "AGRI_PARTNER";
  const isAdmin = user?.role === "ADMIN";

  const completion = useMemo(() => {
    if (!project?.milestones?.length) return 0;
    const done = project.milestones.filter((m) => m.status === "COMPLETED").length;
    return Math.round((done / project.milestones.length) * 100);
  }, [project]);

  const currentMilestone = useMemo(() => {
    if (!project?.milestones?.length) return null;
    return (
      project.milestones.find((m) => m.status === "IN_PROGRESS") ||
      project.milestones.find((m) => m.status === "PENDING") ||
      project.milestones[project.milestones.length - 1]
    );
  }, [project]);

  const displayProgress = useMemo(() => {
    if (!project) return 0;
    const storedProgress = Number(project.progress || 0);
    return storedProgress > 0 ? Math.round(storedProgress) : completion;
  }, [completion, project]);

  useEffect(() => {
    if (!currentMilestone) return;
    if (!(currentMilestone.key in milestoneMeta)) return;
    setSelectedMilestone(currentMilestone.key as MilestoneKey);
  }, [currentMilestone]);

  const prefersFarmerActions = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname.includes("/progress") || searchParams.get("tab") === "farmer-actions";
  }, [location.pathname, location.search]);

  const defaultTab = prefersFarmerActions && canFarmerUpdate ? "farmer-actions" : "overview";
  const milestoneOptions = useMemo(() => {
    if (!project?.milestones?.length) return [];
    return currentMilestone ? [currentMilestone] : project.milestones.filter((item) => item.status !== "COMPLETED");
  }, [currentMilestone, project]);

  const numericRevenue = Number(revenue || 0);
  const numericExpenses = Number(project?.estimatedExpenses || 0);
  const netProfit = Math.max(numericRevenue - numericExpenses, 0);
  const platformCommission = Math.round(netProfit * 0.03);
  const distributableProfit = Math.max(netProfit - platformCommission, 0);
  const investorReturnPool = Math.round(distributableProfit * 0.6);
  const farmerProfitPool = Math.round(distributableProfit * 0.3);
  const partnerProfitPool = Math.round(distributableProfit * 0.1);

  const releasedFunds = withdrawals
    .filter((w) => w.status === "DISBURSED")
    .reduce((sum, item) => sum + item.amount, 0);

  const pendingRelease = withdrawals
    .filter((w) => w.status === "REQUESTED" || w.status === "UNDER_VERIFICATION")
    .reduce((sum, item) => sum + item.amount, 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setSelectedImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleStartProject = () => {
    if (!project) return;
    if (currentFundingPercent < 40) {
      toast.error("Project can start only after at least 40% funding.");
      return;
    }

    startProject(project.id);

    const milestones = [...project.milestones];
    if (milestones.length > 0 && milestones[0].status === "PENDING") {
      milestones[0].status = "IN_PROGRESS";
      updateProject(project.id, {
        milestones,
        activeStatus: "ACTIVE",
      });
    }

    void loadData();
    toast.success("Project started successfully.");
  };

  const addProgress = () => {
    if (!project) return;

    if (!canFarmerUpdate) {
      toast.error("Project progress can only be updated after approval and 40% funding.");
      return;
    }

    if (!activityTitle.trim() || !activityNotes.trim()) {
      toast.error("Please fill activity title and notes.");
      return;
    }

    if (!selectedImage) {
      toast.error("Please upload crop image proof.");
      return;
    }

    if (currentMilestone?.key && selectedMilestone !== currentMilestone.key) {
      const activeMilestoneTitle =
        milestoneMeta[currentMilestone.key as MilestoneKey]?.title || currentMilestone.title;
      toast.error(`Please complete the current milestone first: ${activeMilestoneTitle}.`);
      return;
    }

    const milestoneIndex = project.milestones.findIndex((m) => m.key === selectedMilestone);
    if (milestoneIndex === -1) {
      toast.error("Invalid milestone.");
      return;
    }

    const updateTimestamp = activityDate
      ? new Date(`${activityDate}T12:00:00`).toISOString()
      : new Date().toISOString();
    const updatedMilestones = [...project.milestones];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      status: "COMPLETED",
      notes: activityNotes.trim(),
      image: selectedImage,
      updatedAt: updateTimestamp,
    };

    const nextIndex = milestoneIndex + 1;
    if (nextIndex < updatedMilestones.length && updatedMilestones[nextIndex].status === "PENDING") {
      updatedMilestones[nextIndex] = {
        ...updatedMilestones[nextIndex],
        status: "IN_PROGRESS",
      };
    }

    let nextProjectStatus = project.projectStatus;
    if (selectedMilestone === "HARVESTING") nextProjectStatus = "HARVESTING";
    if (selectedMilestone === "SALE_COMPLETED") nextProjectStatus = "SALE_COMPLETED";
    if (selectedMilestone === "PROFIT_CALCULATION") nextProjectStatus = "PROFIT_CALCULATED";

    const nextMilestoneKey =
      (updatedMilestones.find((item) => item.status === "IN_PROGRESS")?.key as MilestoneKey | undefined) ||
      selectedMilestone;

    addProgressUpdate({
      projectId: project.id,
      farmerId: project.farmerId,
      milestoneKey: selectedMilestone,
      stage: selectedMilestone,
      title: activityTitle.trim(),
      progress: milestoneMeta[selectedMilestone].percent,
      notes: activityNotes.trim(),
      image: selectedImage,
      cropHealth: cropHealth.trim(),
      proofName: selectedImageName || "proof-upload",
      date: activityDate,
      visibleToInvestor: true,
      visibleToPartner: true,
      visibleToAdmin: true,
    });

    updateProject(project.id, {
      milestones: updatedMilestones,
      progress: milestoneMeta[selectedMilestone].percent,
      currentStage: milestoneMeta[nextMilestoneKey]?.title || activityTitle.trim(),
      projectStatus: nextProjectStatus,
    });

    setActivityTitle("");
    setActivityNotes("");
    setSelectedImage("");
    setSelectedImageName("");
    setActivityDate(new Date().toISOString().slice(0, 10));
    setCropHealth("Healthy");
    void loadData();
    toast.success("Progress update posted successfully.");
  };

  const requestWithdrawal = async () => {
    if (!project) return;

    if (!canFarmerUpdate) {
      toast.error("Withdrawal can be requested only after project starts.");
      return;
    }

    if (!withdrawAmount || !withdrawReason.trim()) {
      toast.error("Please enter amount and reason.");
      return;
    }

    try {
      await addFarmerWithdrawal({
        projectId: project.id,
        farmerId: project.farmerId,
        farmerName: project.farmerName,
        milestoneKey: withdrawMilestone,
        amount: Number(withdrawAmount),
        reason: withdrawReason,
        proofImage: selectedImage || undefined,
      });

      setWithdrawAmount("");
      setWithdrawReason("");
      await loadData();
      toast.success("Withdrawal request sent to admin.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send withdrawal request.");
    }
  };

  const verifyLatestUpdate = () => {
    if (!project || logs.length === 0) {
      toast.error("No pending updates available.");
      return;
    }

    const latest = logs[0];
    const updatedLogs = logs.map((log, idx) =>
      idx === 0 ? { ...log, status: "VERIFIED" as const } : log
    );
    setLogs(updatedLogs);

    toast.success(`Milestone verified: ${latest.title}`);
  };

  const disburseLatestWithdrawal = async () => {
    if (withdrawals.length === 0) {
      toast.error("No withdrawal requests found.");
      return;
    }

    const latest = withdrawals[0];
    try {
      await approveFarmerWithdrawal(latest.id, adminRemark || "Disbursed by admin");
      setAdminRemark("");
      await loadData();
      toast.success("Withdrawal disbursed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to disburse withdrawal.");
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-10 text-center text-gray-600">
              Project not found.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const approvalStatusText = project.approvalStage;
  const approvalRejected = project.approvalStage === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl md:text-3xl">Farming Project Tracking</CardTitle>
                  <CardDescription className="mt-1">
                    Project ID: {project.id} • {project.title}
                  </CardDescription>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">Crop: {project.cropType}</Badge>
                    <Badge variant="secondary">Land: {project.acreage} Acres</Badge>
                    <Badge variant="secondary">Location: {project.location}, {project.state}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {statusBadge(approvalStatusText)}
                  {statusBadge(project.projectStatus)}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{displayProgress}%</p>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-sm text-muted-foreground">Current Milestone</p>
                  <p className="text-lg font-semibold">{currentMilestone?.title || "Not started"}</p>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-sm text-muted-foreground">Funding Progress</p>
                  <p className="text-lg font-semibold">{currentFundingPercent}%</p>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-sm text-muted-foreground">Expected ROI</p>
                  <p className="text-lg font-semibold">{Number(project.expectedROI || 0)}%</p>
                </div>
              </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Project Progress</span>
                    <span>{displayProgress}% completed</span>
                  </div>
                <Progress value={displayProgress} className="h-3" />
              </div>

              {approvalRejected && project.rejectionReason && (
                <div className="rounded-2xl border bg-red-50 p-4 text-sm text-red-700">
                  <strong>Rejected by Admin:</strong> {project.rejectionReason}
                </div>
              )}

              {user?.role === "FARMER" && canFarmerStartProject && (
                <Button onClick={handleStartProject} className="w-fit rounded-2xl">
                  Start Project
                </Button>
              )}
              <Button onClick={() => navigate(`/project/milestones/${project.id}`)}>
                View Milestones
              </Button>
            </CardHeader>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Funding & Profit Snapshot</CardTitle>
              <CardDescription>
                Project starts only after admin approval and minimum 40% funding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <span className="text-sm text-muted-foreground">Funding Goal</span>
                <span className="font-semibold">{formatCurrency(project.fundingGoal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <span className="text-sm text-muted-foreground">Raised Amount</span>
                <span className="font-semibold">{formatCurrency(project.fundedAmount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <span className="text-sm text-muted-foreground">Released Funds</span>
                <span className="font-semibold">{formatCurrency(releasedFunds)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <span className="text-sm text-muted-foreground">Pending Release</span>
                <span className="font-semibold">{formatCurrency(pendingRelease)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3 bg-amber-50">
                <span className="text-sm text-muted-foreground">Platform Commission (3%)</span>
                <span className="font-semibold text-amber-700">{formatCurrency(platformCommission)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3 bg-emerald-50">
                <span className="text-sm text-muted-foreground">Distributable Profit</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(distributableProfit)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Project Activation Status</CardTitle>
            <CardDescription>
              Farmers can update milestones only after admin approval and 40% funding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {statusBadge(project.approvalStage)}
              <Badge variant="outline">Funding Progress: {currentFundingPercent}%</Badge>
              <Badge variant="outline">Minimum Required to Start: 40%</Badge>
            </div>

            {project.approvalStage === "SENT_FOR_APPROVAL" && (
              <div className="rounded-2xl border bg-amber-50 p-4 text-sm">
                Project has been sent for admin approval. Farmer cannot start progress updates yet.
              </div>
            )}

            {project.approvalStage === "VERIFIED" && (
              <div className="rounded-2xl border bg-blue-50 p-4 text-sm">
                Project is verified by admin and waiting for final approval.
              </div>
            )}

            {project.approvalStage === "APPROVED" && project.projectStatus === "OPEN_FOR_FUNDING" && (
              <div className="rounded-2xl border bg-sky-50 p-4 text-sm">
                Project is approved and visible to investors. Waiting for minimum 40% investment.
              </div>
            )}

            {project.approvalStage === "APPROVED" && project.projectStatus === "READY_TO_START" && (
              <div className="rounded-2xl border bg-emerald-50 p-4 text-sm">
                Project has admin approval and enough funding. Farmer can now start project work.
              </div>
            )}

            {project.projectStatus === "IN_PROGRESS" && (
              <div className="rounded-2xl border bg-indigo-50 p-4 text-sm">
                Farmer can upload milestone progress, pictures, and notes. These updates are visible to admin, investors, and agri-partners.
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs key={`${resolvedProjectId}-${defaultTab}`} defaultValue={defaultTab} className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-2 rounded-2xl bg-white p-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="updates">Activity Updates</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="settlement">Settlement</TabsTrigger>
            {canFarmerUpdate && <TabsTrigger value="farmer-actions">Farmer Actions</TabsTrigger>}
            {isPartner && <TabsTrigger value="partner-support">Agri-Partner Support</TabsTrigger>}
            {isAdmin && <TabsTrigger value="admin-panel">Admin Panel</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Project Dashboard</CardTitle>
                  <CardDescription>
                    Farmer updates are visible to admin, investors, and agri-partners
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-indigo-600" />
                      <h3 className="font-semibold">Current Stage</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentMilestone?.title || "Waiting for project activation"}
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold">Crop Health</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Latest crop updates and proof uploads are visible here.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold">Funding Utilization</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(releasedFunds)} released and {formatCurrency(pendingRelease)} pending release.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <h3 className="font-semibold">Admin Tracking</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Admin can track milestones, updates, and withdrawals from this project.
                    </p>
                  </div>
                </CardContent>
              </Card>

          
            </div>
          </TabsContent>

          <TabsContent value="milestones">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Farming Milestone Timeline</CardTitle>
                <CardDescription>
                  Farmer updates project from first step to harvest and profit stage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.milestones.map((milestone, index) => {
                  const meta = milestoneMeta[milestone.key as MilestoneKey];
                  const Icon = meta?.icon || FileText;

                  return (
                    <div key={milestone.key} className="flex gap-4 rounded-2xl border bg-white p-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        {index < project.milestones.length - 1 && (
                          <div className="mt-2 h-full w-px bg-slate-200" />
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{meta?.title || milestone.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {meta?.description || ""}
                            </p>
                          </div>
                          {statusBadge(milestoneUiStatus(milestone, index, project))}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-muted-foreground">Progress Target</p>
                            <p className="font-medium">{meta?.percent || 0}%</p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="font-medium">
                              {milestone.updatedAt
                                ? new Date(milestone.updatedAt).toLocaleDateString("en-IN")
                                : "Not updated"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-muted-foreground">Proof</p>
                            <p className="font-medium">{milestone.image ? "Uploaded" : "Not uploaded"}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-dashed p-3">
                          <p className="text-xs text-muted-foreground">Latest Notes</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {milestone.notes || "No notes added yet."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates">
            <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Activity Updates Log</CardTitle>
                  <CardDescription>
                    What the farmer uploaded is visible to admin, investors, and agri-partners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No activity updates yet.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{log.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {milestoneMeta[log.milestoneKey as MilestoneKey]?.title || log.stage} •{" "}
                              {new Date(log.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          {statusBadge(log.status)}
                        </div>

                        <p className="mt-3 text-sm text-slate-700">{log.notes}</p>

                        {log.proofImage && (
                          <div className="mt-4">
                            <img
                              src={log.proofImage}
                              alt={log.title}
                              className="h-56 w-full rounded-2xl object-cover border"
                            />
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-muted-foreground">Crop Health</p>
                            <p className="font-medium">{log.cropHealth}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-muted-foreground">Proof File</p>
                            <p className="font-medium">{log.proofName || "Uploaded image"}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-muted-foreground">Visible To</p>
                            <p className="font-medium">Farmer, Investor, Partner, Admin</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Project Visibility Notes</CardTitle>
                  <CardDescription>How this project is shared across roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border p-4">
                    <h3 className="font-semibold">Investor Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Only after admin approval, investors can see and track this project.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <h3 className="font-semibold">Agri-Partner Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Agri-partners can track this only after worker request approval.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <h3 className="font-semibold">Admin Monitoring</h3>
                    <p className="text-sm text-muted-foreground">
                      Admin can view all proof uploads, progress, and payout requests.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Crop Proof Gallery</CardTitle>
                <CardDescription>
                  All uploaded milestone images from the farmer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.filter((item) => item.proofImage).length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                    No proof files uploaded yet.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {logs
                      .filter((item) => item.proofImage)
                      .map((item) => (
                        <div key={item.id} className="rounded-2xl border p-4">
                          <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-100 overflow-hidden">
                            {item.proofImage ? (
                              <img
                                src={item.proofImage}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileImage className="h-10 w-10 text-slate-500" />
                            )}
                          </div>
                          <div className="mt-4 space-y-1">
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.proofName || "Uploaded image"}</p>
                            <p className="text-xs text-muted-foreground">
                              {milestoneMeta[item.milestoneKey as MilestoneKey]?.title || item.stage}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Withdrawal Tracking</CardTitle>
                  <CardDescription>
                    Farmer requests amount with reason. Admin verifies and disburses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {withdrawals.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No withdrawal requests yet.
                    </div>
                  ) : (
                    withdrawals.map((item) => (
                      <div key={item.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{formatCurrency(item.amount)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {milestoneMeta[item.milestoneKey as MilestoneKey]?.title || item.milestoneKey} •{" "}
                              {new Date(item.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          {statusBadge(item.status)}
                        </div>
                        <p className="mt-3 text-sm">{item.reason}</p>
                        {item.adminRemark && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Admin Remark: {item.adminRemark}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {canFarmerUpdate ? (
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Request Milestone Withdrawal</CardTitle>
                    <CardDescription>
                      Farmer can request amount for approved milestone work
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Milestone</Label>
                      <select
                        value={withdrawMilestone}
                        onChange={(e) => setWithdrawMilestone(e.target.value as MilestoneKey)}
                        className="w-full rounded-xl border bg-background px-3 py-2"
                      >
                        {project.milestones.map((m) => (
                          <option key={m.key} value={m.key}>
                            {milestoneMeta[m.key as MilestoneKey]?.title || m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount Required</Label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        placeholder="Example: Drip irrigation setup, labour, fertilizer purchase..."
                        rows={5}
                      />
                    </div>

                    <Button onClick={() => void requestWithdrawal()} className="w-full rounded-2xl">
                      <HandCoins className="mr-2 h-4 w-4" />
                      Send Withdrawal Request
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Fund Release Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <span className="text-sm text-muted-foreground">Released</span>
                      <span className="font-semibold">{formatCurrency(releasedFunds)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="font-semibold">{formatCurrency(pendingRelease)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settlement">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Profit Settlement</CardTitle>
                  <CardDescription>
                    Final sale, expenses, 3% platform fee, and stakeholder distribution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Market Sale Revenue</Label>
                    <Input value={revenue} onChange={(e) => setRevenue(e.target.value)} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border p-4">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-xl font-bold">{formatCurrency(numericExpenses)}</p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className="text-xl font-bold">{formatCurrency(netProfit)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-amber-50 p-4">
                    <p className="text-sm text-muted-foreground">Platform Commission (3%)</p>
                    <p className="text-xl font-bold text-amber-700">{formatCurrency(platformCommission)}</p>
                  </div>

                  <div className="rounded-2xl border bg-emerald-50 p-4">
                    <p className="text-sm text-muted-foreground">Distributable Profit</p>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(distributableProfit)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Stakeholder Share</CardTitle>
                  <CardDescription>Distribution after platform commission</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs text-muted-foreground">Investor Share (60%)</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(investorReturnPool)}</p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-xs text-muted-foreground">Farmer Share (30%)</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(farmerProfitPool)}</p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-xs text-muted-foreground">Agri-Partner Share (10%)</p>
                    <p className="mt-1 text-2xl font-bold">{formatCurrency(partnerProfitPool)}</p>
                  </div>

                  <Separator />

                  <div className="rounded-2xl border border-dashed p-4">
                    <p className="text-sm text-muted-foreground">
                      Net Profit = Revenue - Expenses. Platform keeps 3% commission from profit.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {canFarmerUpdate && (
            <TabsContent value="farmer-actions">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Update Project Progress</CardTitle>
                    <CardDescription>
                      Upload milestone proof, crop image, notes, and stage completion
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Milestone</Label>
                      <select
                        value={selectedMilestone}
                        onChange={(e) => setSelectedMilestone(e.target.value as MilestoneKey)}
                        className="w-full rounded-xl border bg-background px-3 py-2"
                        disabled={milestoneOptions.length <= 1}
                      >
                        {milestoneOptions.map((m) => (
                          <option key={m.key} value={m.key}>
                            {milestoneMeta[m.key as MilestoneKey]?.title || m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Activity Title</Label>
                      <Input
                        value={activityTitle}
                        onChange={(e) => setActivityTitle(e.target.value)}
                        placeholder="Example: Drip irrigation completed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Activity Notes</Label>
                      <Textarea
                        value={activityNotes}
                        onChange={(e) => setActivityNotes(e.target.value)}
                        placeholder="Describe work completed in the field..."
                        rows={5}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Update Date</Label>
                        <Input
                          type="date"
                          value={activityDate}
                          onChange={(e) => setActivityDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Crop Health</Label>
                        <Input
                          value={cropHealth}
                          onChange={(e) => setCropHealth(e.target.value)}
                          placeholder="Healthy / Moderate / Needs Attention"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Crop Image Proof</Label>
                      <Input type="file" accept="image/*" onChange={handleImageUpload} />
                      {selectedImageName && (
                        <p className="text-xs text-green-600">Selected image: {selectedImageName}</p>
                      )}
                    </div>

                    <Button onClick={addProgress} className="w-full rounded-2xl">
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Progress Update
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Farmer Action Checklist</CardTitle>
                    <CardDescription>
                      Required actions for transparent project tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border p-4">
                      <h3 className="font-semibold">Upload milestone pictures</h3>
                      <p className="text-sm text-muted-foreground">
                        Add proof image for each major farming stage.
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <h3 className="font-semibold">Add notes</h3>
                      <p className="text-sm text-muted-foreground">
                        Mention crop condition, disease status, irrigation, and field observations.
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <h3 className="font-semibold">Track stage completion</h3>
                      <p className="text-sm text-muted-foreground">
                        Mark milestone progress from first stage to harvest and profit stage.
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <h3 className="font-semibold">Request milestone funds</h3>
                      <p className="text-sm text-muted-foreground">
                        Request amount with particular reason, then admin verifies and disburses.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isPartner && (
            <TabsContent value="partner-support">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle>Agri-Partner Support View</CardTitle>
                  <CardDescription>
                    Agri-partners can track what the farmer uploaded after worker approval
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm text-muted-foreground">
                      Assigned Partner: {project.assignedPartnerName || "Not assigned"}
                    </p>
                    <p className="font-medium mt-1">
                      Worker Request Status: {project.workerRequestStatus}
                    </p>
                  </div>

                  {logs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No farmer updates available yet.
                    </div>
                  ) : (
                    logs.slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-2xl border p-4">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="admin-panel">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Milestone Verification</CardTitle>
                    <CardDescription>
                      Verify farmer updates visible to all stakeholders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <p className="font-medium">Latest submitted update</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Review picture proof, notes, and milestone stage before verifying.
                      </p>
                    </div>

                    <Button onClick={verifyLatestUpdate} className="w-full rounded-2xl">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify Latest Update
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl">
                  <CardHeader>
                    <CardTitle>Withdrawal Verification & Disbursal</CardTitle>
                    <CardDescription>
                      Admin verifies farmer withdrawal and disburses amount
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Admin Remark</Label>
                      <Textarea
                        value={adminRemark}
                        onChange={(e) => setAdminRemark(e.target.value)}
                        placeholder="Enter payout remark"
                        rows={4}
                      />
                    </div>

                    <Button onClick={() => void disburseLatestWithdrawal()} className="w-full rounded-2xl">
                      <IndianRupee className="mr-2 h-4 w-4" />
                      Disburse Latest Withdrawal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
