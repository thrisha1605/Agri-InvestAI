import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";
import {
  addPartnerRequest,
  canPartnerRequestProject,
  getDashboardCounts,
  getPartnerRequestUnavailableReason,
  getPartnerRequestsForPartner,
  getProjectInvestorSummary,
  getProjectStatusLabel,
  listProjects,
} from "@/lib/appData";
import { getPartnerProfile } from "@/lib/partnerProfile";
import { getUserSipPlans } from "@/lib/roleSip";
import {
  ArrowRight,
  Briefcase,
  FileCheck,
  HandCoins,
  IndianRupee,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function PartnerDashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  if (!user) return null;

  const counts = getDashboardCounts(user) as {
    availableProjects: number;
    assignedWork: number;
    totalEarnings: number;
  };
  const profile = getPartnerProfile(user.id);
  const myRequests = getPartnerRequestsForPartner(user.id);
  const activeSipPlans = getUserSipPlans(user.id).filter((plan) => plan.status === "ACTIVE");
  const availableProjects = listProjects().filter(
    (project) => canPartnerRequestProject(project) && project.assignedPartnerId !== user.id
  );
  const assignedProjects = listProjects().filter(
    (project) =>
      project.workerRequestStatus === "ASSIGNED" && project.assignedPartnerId === user.id
  );

  const requestWork = async (project: any) => {
    if (!profile.readyForProjects) {
      toast.error("Complete your profile with photo, Aadhaar, and certificates before requesting work.");
      navigate("/partner/profile");
      return;
    }

    if (myRequests.some((request) => request.projectId === project.id)) {
      toast.error("You have already sent a request for this project.");
      return;
    }

    if (!canPartnerRequestProject(project)) {
      toast.error(getPartnerRequestUnavailableReason(project));
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
        message: "Interested in supporting this project as an agri partner.",
        salary: project.monthlySalary || 10000,
      });
      toast.success("Work request sent successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send work request.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(187,247,208,0.55),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eefbf4_100%)] py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardContent className="bg-slate-950 p-8 text-white">
              <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs tracking-[0.2em] text-emerald-200 uppercase">
                Agri Partner Growth Desk
              </p>
              <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
                Build a verified field profile, earn monthly salary, and grow savings from your wallet.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Salary is auto-credited to your wallet. After project completion, you can withdraw through bank account,
                UPI, Paytm, GPay, PhonePe, or other payout methods.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                {[
                  {
                    label: "Profile readiness",
                    value: `${profile.completionPercent}%`,
                    icon: FileCheck,
                  },
                  {
                    label: "Available projects",
                    value: String(counts.availableProjects),
                    icon: Briefcase,
                  },
                  {
                    label: "Assigned work",
                    value: String(counts.assignedWork),
                    icon: ShieldCheck,
                  },
                  {
                    label: "Salary earned",
                    value: formatCurrency(counts.totalEarnings),
                    icon: IndianRupee,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <item.icon className="mb-3 h-5 w-5 text-emerald-200" />
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  <Link to="/partner/profile">Complete Profile</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link to="/partner/wallet">Open Wallet</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Partner Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Verification progress</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{profile.completionPercent}%</p>
                <p className="mt-2 text-sm text-slate-600">
                  Upload your photo, Aadhaar card, certificates, and payment details to start earning from projects.
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>{profile.photoDataUrl ? "Profile photo uploaded" : "Profile photo pending"}</p>
                <p>{profile.aadhaarFileName ? "Aadhaar proof uploaded" : "Aadhaar proof pending"}</p>
                <p>
                  {profile.certificateFileNames.length > 0
                    ? `${profile.certificateFileNames.length} certificate file(s) uploaded`
                    : "Certificates pending"}
                </p>
                <p>{profile.readyForProjects ? "Ready for project assignments" : "Complete profile to unlock work requests"}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Active SIP plans</p>
                    <p className="mt-2 text-2xl font-bold">{activeSipPlans.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Pending requests</p>
                    <p className="mt-2 text-2xl font-bold">
                      {myRequests.filter((request) => request.status === "PENDING").length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>High-Potential Projects for Partners</CardTitle>
              <Button variant="ghost" asChild>
                <Link to="/partner/available-projects" className="inline-flex items-center gap-2">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableProjects.slice(0, 3).map((project) => {
                const investorSummary = getProjectInvestorSummary(project.id);

                return (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{project.title}</p>
                        <p className="text-sm text-slate-600">
                          {project.location}, {project.state} • {project.cropType}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Salary: {formatCurrency(project.monthlySalary || 0)} / month
                        </p>
                        <p className="text-sm text-slate-600">
                          Investor backing: {investorSummary.investorCount} investor(s), {formatCurrency(investorSummary.totalInvested)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" asChild>
                          <Link to={`/projects/${project.id}`}>View</Link>
                        </Button>
                        <Button onClick={() => void requestWork(project)}>
                          <HandCoins className="mr-2 h-4 w-4" />
                          Request Work
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableProjects.length === 0 && (
                <p className="text-sm text-slate-600">No approved helper projects are open right now.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Assigned Work Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedProjects.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No assigned projects yet. Complete your profile and send requests to start earning.
                </p>
              ) : (
                assignedProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{project.title}</p>
                        <p className="text-sm text-slate-600">Farmer: {project.farmerName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        {getProjectStatusLabel(project)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                      <p>Funding: {formatCurrency(project.fundedAmount)}</p>
                      <p>Monthly salary: {formatCurrency(project.monthlySalary || 0)}</p>
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-slate-900">Salary Wallet Flow</p>
                    <p className="text-sm text-slate-600">
                      Monthly salary gets auto-credited to your wallet, and then you can withdraw it using any supported payout option.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
