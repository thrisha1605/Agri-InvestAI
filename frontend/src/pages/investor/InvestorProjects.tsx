import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/auth";
import {
  canInvestInProject,
  createInvestment,
  fetchAllProjects,
  getInvestmentUnavailableReason,
  getProjectStatusLabel,
  listProjects,
} from "@/lib/appData";
import { createSip, syncRoleSipPlansFromBackend } from "@/lib/roleSip";
import { BackButton } from "@/components/BackButton";
import {
  Search,
  MapPin,
  Sprout,
  IndianRupee,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getVisibleInvestorProjects() {
  const projects = listProjects();

  return projects.filter((project: any) => {
    const status = project.projectStatus || project.status;
    const approvalStage = project.approvalStage || project.approvalStatus;

    return (
      approvalStage === 'APPROVED' &&
      [
        'OPEN_FOR_FUNDING',
        'READY_TO_START',
        'IN_PROGRESS',
        'HARVESTING',
        'SALE_COMPLETED',
        'PROFIT_CALCULATED',
        'COMPLETED',
      ].includes(status)
    );
  });
}

function getFundingProgress(project: any) {
  const goal = Number(project.fundingGoal || 0);
  const raised = Number(project.fundedAmount || project.raisedAmount || 0);
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

function getEstimatedROI(project: any) {
  if (project.expectedROI !== undefined && project.expectedROI !== null) {
    return Math.max(0, Math.round(Number(project.expectedROI || 0)));
  }

  const expectedRevenue = Number(project.expectedRevenue || 0);
  const estimatedExpenses = Number(project.estimatedExpenses || 0);
  const fundingGoal = Number(project.fundingGoal || 0);

  if (!fundingGoal) return 0;

  const projectedProfit = Math.max(expectedRevenue - estimatedExpenses, 0);
  const platformFee = projectedProfit * 0.03;
  const distributableProfit = projectedProfit - platformFee;
  const investorPool = distributableProfit * 0.6;

  return Math.max(0, Math.round((investorPool / fundingGoal) * 100));
}

export function InvestorProjects() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>(getVisibleInvestorProjects());

  useEffect(() => {
    let mounted = true;

    void fetchAllProjects()
      .then(() => {
        if (mounted) {
          setProjects(getVisibleInvestorProjects());
        }
      })
      .catch(() => {
        if (mounted) {
          setProjects(getVisibleInvestorProjects());
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const query = search.toLowerCase();
      return (
        (project.title || "").toLowerCase().includes(query) ||
        (project.cropType || "").toLowerCase().includes(query) ||
        (project.location || "").toLowerCase().includes(query) ||
        (project.farmerName || "").toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const investInProject = async (projectId: string, amount: number) => {
    if (!user) {
      toast.error("Please login as investor.");
      return;
    }

  const selectedProject = projects.find((p) => p.id === projectId);
  if (!selectedProject) return;
  if (!canInvestInProject(selectedProject)) {
    toast.error(getInvestmentUnavailableReason(selectedProject));
    return;
  }

  try {
      await createInvestment(user.id, {
        projectId,
        amount,
        paymentMethod: "UPI",
      });
      setProjects(getVisibleInvestorProjects());
      toast.success(`Successfully invested ${formatCurrency(amount)} in ${selectedProject.title}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete this investment.");
    }
  };

  const investWithSIP = async (projectId: string, amount: number) => {
    if (!user) {
      toast.error("Please login as investor.");
      return;
    }

  const selectedProject = projects.find((p) => p.id === projectId);
  if (!selectedProject) return;
  if (!canInvestInProject(selectedProject)) {
    toast.error(getInvestmentUnavailableReason(selectedProject));
    return;
  }

  try {
      await createSip({
        userId: user.id,
        projectId,
        amount,
        role: user.role,
        tenureYears: 1,
        goalLabel: `SIP for ${selectedProject.title}`,
        termsAccepted: true,
        interval: "MONTHLY",
        autoDebitEnabled: true,
      });
      await syncRoleSipPlansFromBackend(user.id);
      toast.success(`SIP of ${formatCurrency(amount)} started for ${selectedProject.title}`);
      navigate("/investor/wallet");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start SIP for this project.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <BackButton />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Investor Marketplace</h1>
          <p className="text-gray-600">
            Browse approved agricultural projects and invest only in admin-approved opportunities.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by crop, farmer, title, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">
              No approved investor-visible projects found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const fundingGoal = Number(project.fundingGoal || 0);
              const raisedAmount = Number(project.fundedAmount || project.raisedAmount || 0);
              const fundingProgress = getFundingProgress(project);
              const estimatedROI = getEstimatedROI(project);
              const cropAnalysis = project.cropAnalysis || project.projectInsights?.cropAnalysis;
              const waterAnalysis = project.waterAnalysis || project.projectInsights?.waterAnalysis;
              const esgBreakdown = project.esgBreakdown || project.projectInsights?.esgBreakdown;
              const investorAlerts = Array.isArray(project.investorAlerts)
                ? project.investorAlerts
                : Array.isArray(project.projectInsights?.investorAlerts)
                  ? project.projectInsights.investorAlerts
                  : [];
              const investmentOpen = canInvestInProject(project);
              const projectStatusLabel = getProjectStatusLabel(project);
              const blockedReason = getInvestmentUnavailableReason(project);

              return (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-3">
                      <span>{project.title}</span>
                      <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700">
                        {projectStatusLabel}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><strong>Farmer:</strong> {project.farmerName}</p>
                        <p className="flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-green-600" />
                          <span><strong>Crop:</strong> {project.cropType}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span><strong>Location:</strong> {project.location}</span>
                        </p>
                        <p><strong>Acreage:</strong> {project.acreage} acres</p>
                      </div>

                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-blue-600" />
                          <span><strong>Funding Goal:</strong> {formatCurrency(fundingGoal)}</span>
                        </p>
                        <p><strong>Raised:</strong> {formatCurrency(raisedAmount)}</p>
                        <p><strong>ESG Score:</strong> {Number(esgBreakdown?.finalESGScore ?? project.esgScore ?? 0).toFixed(0)}/100</p>
                        <p className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span><strong>Estimated ROI:</strong> {estimatedROI}%</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <PieChart className="h-4 w-4 text-purple-600" />
                          <span><strong>Approval:</strong> {project.approvalStage}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Suitability</p>
                        <p className="mt-1 text-xl font-bold text-emerald-900">
                          {cropAnalysis?.suitabilityScore ?? "--"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-amber-700">Risk</p>
                        <p className="mt-1 text-xl font-bold text-amber-900">
                          {cropAnalysis?.riskLevel || project.riskLevel || "MEDIUM"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-sky-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-sky-700">Water</p>
                        <p className="mt-1 text-sm font-semibold text-sky-900">
                          {waterAnalysis?.label || (project.needsWaterInvestment ? "Water infrastructure required" : "Source available")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Funding Progress</span>
                        <span>{fundingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full"
                          style={{ width: `${fundingProgress}%` }}
                        />
                      </div>
                    </div>

                    {investorAlerts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {investorAlerts.map((alert: string) => (
                          <span
                            key={alert}
                            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                          >
                            {alert}
                          </span>
                        ))}
                      </div>
                    )}

                    {project.images?.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {project.images
                          .filter((img: any) => typeof img === 'string' && img.trim().length > 0)
                          .slice(0, 3)
                          .map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt={project.title}
                              className="rounded-lg h-24 w-full object-cover"
                            />
                          ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => void investInProject(project.id, 10000)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!investmentOpen}
                      >
                        Invest ₹10,000
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => void investInProject(project.id, 25000)}
                        disabled={!investmentOpen}
                      >
                        Invest ₹25,000
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => void investWithSIP(project.id, 50)}
                        disabled={!investmentOpen}
                      >
                        Start SIP ₹50
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        View Details
                      </Button>
                    </div>

                    {!investmentOpen && (
                      <p className="text-sm text-slate-600">{blockedReason}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
