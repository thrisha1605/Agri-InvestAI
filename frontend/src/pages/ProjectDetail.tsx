import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/auth";
import {
  addPartnerRequest,
  canInvestInProject,
  canPartnerRequestProject,
  fetchProjectInvestorSummary,
  getInvestmentUnavailableReason,
  getPartnerRequestUnavailableReason,
  getPartnerRequestsForPartner,
  getProjectInvestorSummary,
  getProjectStatusLabel,
  getProjectSettlementSummary,
  listProjects,
} from "@/lib/appData";
import { getPartnerProfile } from "@/lib/partnerProfile";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { InvestmentModal } from "@/components/InvestmentModal";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const project = useMemo(() => listProjects().find((item) => item.id === id), [id]);
  const [amount, setAmount] = useState("");
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [investorSummary, setInvestorSummary] = useState(() =>
    project
      ? getProjectInvestorSummary(project.id)
      : { projectId: "", investorCount: 0, totalInvested: 0, averageTicket: 0, investors: [] }
  );

  useEffect(() => {
    if (!project) {
      return;
    }

    setInvestorSummary(getProjectInvestorSummary(project.id));
    void fetchProjectInvestorSummary(project.id)
      .then((summary) => setInvestorSummary(summary))
      .catch(() => undefined);
  }, [project]);

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>;
  }

  const settlementSummary = getProjectSettlementSummary(project.id);
  const partnerProfile = user?.role === "AGRI_PARTNER" ? getPartnerProfile(user.id) : null;
  const canSeeInvestorBreakdown =
    user?.role === "ADMIN" || (user?.role === "FARMER" && project.farmerId === user.id);
  const cropAnalysis = project.cropAnalysis || project.projectInsights?.cropAnalysis;
  const waterAnalysis = project.waterAnalysis || project.projectInsights?.waterAnalysis;
  const esgBreakdown = project.esgBreakdown || project.projectInsights?.esgBreakdown;
  const investorAlerts = Array.isArray(project.investorAlerts)
    ? project.investorAlerts
    : Array.isArray(project.projectInsights?.investorAlerts)
      ? project.projectInsights.investorAlerts
      : [];
  const heroImage = project.images?.[0];
  const projectStatusLabel = getProjectStatusLabel(project);
  const investmentOpen = canInvestInProject(project);
  const investmentBlockedReason = getInvestmentUnavailableReason(project);
  const partnerRequestOpen = canPartnerRequestProject(project);
  const partnerRequestBlockedReason = getPartnerRequestUnavailableReason(project);

  const openInvestmentModal = () => {
    if (!user || user.role !== "INVESTOR") {
      toast.error("Login as investor to invest.");
      return;
    }

    if (!investmentOpen) {
      toast.error(investmentBlockedReason);
      return;
    }

    const amountNumber = Number(amount || 0);
    if (!amount || amountNumber < 10000) {
      toast.error("Enter a valid investment amount with minimum Rs. 10,000.");
      return;
    }

    setIsInvestmentModalOpen(true);
  };

  const handleInvestmentSuccess = () => {
    toast.success("Payment completed successfully.");
    setIsInvestmentModalOpen(false);
    setAmount("");
    navigate("/investor/dashboard");
  };

  const requestWork = async () => {
    if (!user || user.role !== "AGRI_PARTNER") {
      toast.error("Login as agri-partner to request work.");
      return;
    }

    if (partnerProfile && !partnerProfile.readyForProjects) {
      toast.error("Complete your partner profile before requesting project work.");
      navigate("/partner/profile");
      return;
    }

    const existing = getPartnerRequestsForPartner(user.id).some((request) => request.projectId === project.id);
    if (existing) {
      toast.error("Request already sent.");
      return;
    }

    if (!partnerRequestOpen) {
      toast.error(partnerRequestBlockedReason);
      return;
    }

    try {
      await addPartnerRequest({
        projectId: project.id,
        projectTitle: project.title,
        farmerId: project.farmerId,
        farmerName: project.farmerName,
        partnerId: user.id,
        partnerName: user.name,
        message: "Interested to work on this project",
        salary: project.monthlySalary || 10000,
      });
      toast.success("Work request sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send work request.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <BackButton />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {heroImage ? (
              <img
                src={heroImage}
                alt={project.title}
                className="h-80 w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-80 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-100 text-center">
                <div>
                  <p className="text-2xl font-semibold text-emerald-900">{project.cropType}</p>
                  <p className="mt-2 text-sm text-emerald-700">AI-enriched agricultural investment project</p>
                </div>
              </div>
            )}

            {project.images?.length > 1 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {project.images.map((src, index) => (
                  <img
                    key={`${project.id}-img-${index}`}
                    src={src}
                    alt={`${project.title} ${index + 1}`}
                    className="h-40 w-full rounded-xl border object-cover"
                  />
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700">{project.description}</p>

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p><strong>Farmer:</strong> {project.farmerName}</p>
                  <p><strong>Location:</strong> {project.location}, {project.state}</p>
                  <p><strong>Crop:</strong> {project.cropType}</p>
                  <p><strong>Soil Type:</strong> {project.soilType}</p>
                  <p><strong>Acreage:</strong> {project.acreage} acre(s)</p>
                  <p><strong>Approval:</strong> {project.approvalStage}</p>
                  <p><strong>Project Status:</strong> {projectStatusLabel}</p>
                  <p><strong>Monthly Partner Salary:</strong> {formatCurrency(project.monthlySalary || 0)}</p>
                </div>
              </CardContent>
            </Card>

            {investorAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Investor Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {investorAlerts.map((alert: string) => (
                    <div key={alert} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {alert}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(cropAnalysis || waterAnalysis || esgBreakdown) && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {cropAnalysis && (
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-sm text-emerald-700">Suitability</p>
                        <p className="mt-2 text-2xl font-bold">{cropAnalysis.suitabilityScore}</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-sm text-blue-700">Expected Yield</p>
                        <p className="mt-2 text-2xl font-bold">{cropAnalysis.expectedYield}</p>
                      </div>
                      <div className="rounded-xl bg-lime-50 p-4">
                        <p className="text-sm text-lime-700">Profit Estimate</p>
                        <p className="mt-2 text-2xl font-bold">{formatCurrency(Number(cropAnalysis.profitEstimate || 0))}</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-4">
                        <p className="text-sm text-amber-700">Risk Level</p>
                        <p className="mt-2 text-2xl font-bold">{cropAnalysis.riskLevel || project.riskLevel}</p>
                      </div>
                    </div>
                  )}

                  {waterAnalysis && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700">
                      <p><strong>Water Status:</strong> {waterAnalysis.label}</p>
                      <p><strong>Recommendation:</strong> {waterAnalysis.recommendation}</p>
                      <p><strong>Water Cost:</strong> {formatCurrency(Number(waterAnalysis.waterCost || 0))}</p>
                    </div>
                  )}

                  {esgBreakdown && (
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-sm text-emerald-700">Environmental</p>
                        <p className="mt-2 text-2xl font-bold">{esgBreakdown.environmentalScore}</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-sm text-blue-700">Social</p>
                        <p className="mt-2 text-2xl font-bold">{esgBreakdown.socialScore}</p>
                      </div>
                      <div className="rounded-xl bg-violet-50 p-4">
                        <p className="text-sm text-violet-700">Governance</p>
                        <p className="mt-2 text-2xl font-bold">{esgBreakdown.governanceScore}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Final ESG</p>
                        <p className="mt-2 text-2xl font-bold">{esgBreakdown.finalESGScore}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {canSeeInvestorBreakdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Investor Participation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">Investors</p>
                      <p className="mt-2 text-2xl font-bold">{investorSummary.investorCount}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">Total invested</p>
                      <p className="mt-2 text-2xl font-bold">{formatCurrency(investorSummary.totalInvested)}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-sm text-amber-700">Average ticket</p>
                      <p className="mt-2 text-2xl font-bold">{formatCurrency(investorSummary.averageTicket)}</p>
                    </div>
                  </div>

                  {investorSummary.investors.length === 0 ? (
                    <p className="text-sm text-slate-600">No investors have funded this project yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {investorSummary.investors.map((item) => (
                        <div key={`${item.investorId}_${item.createdAt}`} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{item.investorName}</p>
                            <p className="text-sm text-slate-600">{item.type} • {new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Finance Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>Funding Goal:</strong> {formatCurrency(project.fundingGoal)}</p>
                <p><strong>Funded Amount:</strong> {formatCurrency(project.fundedAmount)}</p>
                <p><strong>Funding Progress:</strong> {project.fundingPercent}%</p>
                <p><strong>Investor Count:</strong> {investorSummary.investorCount}</p>
                <p><strong>Expected Revenue:</strong> {formatCurrency(project.expectedRevenue)}</p>
                <p><strong>Estimated Expenses:</strong> {formatCurrency(project.estimatedExpenses)}</p>
                <p><strong>Water Cost:</strong> {formatCurrency(Number(project.waterCost || waterAnalysis?.waterCost || 0))}</p>
                <p><strong>Water Investment:</strong> {project.needsWaterInvestment ? "Required" : "Not required"}</p>
                <p><strong>Platform Fee:</strong> {(project.platformCommissionPercent ?? 3)}%</p>
              </CardContent>
            </Card>

            {settlementSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>Completion Settlement Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><strong>Total Profit:</strong> {formatCurrency(settlementSummary.totalProfit)}</p>
                  <p><strong>Platform Fee (3%):</strong> {formatCurrency(settlementSummary.platformFee)}</p>
                  <p><strong>Partner Salary Reserve:</strong> {formatCurrency(settlementSummary.totalPartnerSalary)}</p>
                  <p><strong>Investor ROI Pool:</strong> {formatCurrency(settlementSummary.investorPool)}</p>
                  <p><strong>Farmer Profit Share:</strong> {formatCurrency(settlementSummary.farmerShare)}</p>
                </CardContent>
              </Card>
            )}

            {user?.role === "INVESTOR" && (
              <Card>
                <CardHeader>
                  <CardTitle>Invest in this project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!investmentOpen && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {investmentBlockedReason}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="invest-amount">Amount</Label>
                    <Input
                      id="invest-amount"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="Enter amount"
                      type="number"
                      disabled={!investmentOpen}
                    />
                  </div>
                  <Button onClick={openInvestmentModal} className="w-full" disabled={!investmentOpen}>
                    {investmentOpen ? "Pay & Invest" : projectStatusLabel}
                  </Button>
                </CardContent>
              </Card>
            )}

            {user?.role === "AGRI_PARTNER" && project.helperNeeded && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!partnerRequestOpen && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      {partnerRequestBlockedReason}
                    </div>
                  )}
                  <p className="text-sm text-slate-600">
                    Complete your profile and documents to become eligible for salary-based project assignments.
                  </p>
                  <Button onClick={() => void requestWork()} className="w-full" disabled={!partnerRequestOpen}>
                    Send Work Request
                  </Button>
                </CardContent>
              </Card>
            )}

            <InvestmentModal
              project={project}
              isOpen={isInvestmentModalOpen}
              onClose={() => setIsInvestmentModalOpen(false)}
              onSuccess={handleInvestmentSuccess}
              initialAmount={Number(amount) > 0 ? Number(amount) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
