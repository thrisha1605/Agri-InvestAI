import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { authService } from "@/lib/auth";
import { getDashboardCounts, getFarmerProjects, updateProject } from "@/lib/appData";

import {
  Plus,
  Sprout,
  TrendingUp,
  Clock,
  CheckCircle,
  Brain,
  FlaskConical,
  Bug,
  Users,
  Wallet,
} from "lucide-react";

function approvalBadge(status: string) {
  const styles: Record<string, string> = {
    SENT_FOR_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERIFIED: "bg-blue-100 text-blue-800 border-blue-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={styles[status] || "bg-slate-100 text-slate-700 border-slate-200"}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

export function FarmerDashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  if (!user) return null;

  const counts = getDashboardCounts(user) as any;
  const myProjects = getFarmerProjects(user.id).slice(0, 5);

  const stats = [
    {
      label: "Total Projects",
      value: counts.totalProjects ?? 0,
      icon: Sprout,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Approved Projects",
      value: counts.approvedProjects ?? 0,
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Pending Approval",
      value: counts.pendingApproval ?? 0,
      icon: Clock,
      color: "text-orange-600 bg-orange-100",
    },
    {
      label: "Rejected Projects",
      value: counts.rejectedProjects ?? 0,
      icon: CheckCircle,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  const requestPartners = (projectId: string, approvalStage?: string) => {
    if (approvalStage !== "APPROVED") {
      alert("You can request workers only after admin approves the project.");
      return;
    }

    const workers = prompt("How many workers do you need?");
    if (!workers) return;

    const salary = prompt("Enter monthly salary per worker (₹)");
    if (!salary) return;

    const reason =
      prompt("Enter reason for worker request") ||
      "Need workers for field support and project execution";

    updateProject(projectId, {
      helperNeeded: true,
      workerRequestStatus: "REQUESTED" as any,
      workerRequestReason: reason as any,
      workerRequestCount: Number(workers),
      monthlySalary: Number(salary),
      helperRequestStatus: "OPEN",
    } as any);

    alert(`Worker request sent for ${workers} agri-partners`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Farmer Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name}!</p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid md:grid-cols-6 gap-5 mb-8">
          <Button asChild size="lg" className="h-auto py-6">
            <Link
              to="/farmer/create-project"
              className="flex flex-col items-center gap-2"
            >
              <Plus className="h-6 w-6" />
              <span>Create Project</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6">
            <Link
              to="/farmer/projects"
              className="flex flex-col items-center gap-2"
            >
              <Sprout className="h-6 w-6" />
              <span>My Projects</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6">
            <Link
              to="/farmer/ai-tools"
              className="flex flex-col items-center gap-2"
            >
              <Brain className="h-6 w-6" />
              <span>Crop Prediction</span>
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-auto py-6"
            onClick={() => navigate("/farmer/disease-analysis")}
          >
            <div className="flex flex-col items-center gap-2">
              <Bug className="h-6 w-6" />
              <span>Disease Detection</span>
            </div>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6">
            <Link
              to="/farmer/soil-ph"
              className="flex flex-col items-center gap-2"
            >
              <FlaskConical className="h-6 w-6" />
              <span>Soil pH Guide</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="secondary" className="h-auto py-6">
            <Link
              to="/farmer/wallet"
              className="flex flex-col items-center gap-2"
            >
              <Wallet className="h-6 w-6" />
              <span>Open Wallet</span>
            </Link>
          </Button>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`h-12 w-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>

                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* PROJECT LIST */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Projects</CardTitle>

            <Button asChild variant="ghost">
              <Link to="/farmer/projects">View All</Link>
            </Button>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {myProjects.length > 0 ? (
                myProjects.map((project) => {
                  const fundingProgress =
                    project.fundingGoal > 0
                      ? (project.fundedAmount / project.fundingGoal) * 100
                      : 0;

                  return (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {project.title}
                          </h3>

                          <p className="text-sm text-gray-600">
                            {project.cropType} • {project.acreage} acres •{" "}
                            {project.location}
                          </p>
                        </div>

                        <div className="text-sm space-y-2">
                          <div>
                            <strong>Status:</strong>{" "}
                            {"approvalStage" in project
                              ? approvalBadge((project as any).approvalStage)
                              : approvalBadge(
                                  project.approvalStatus === "PENDING"
                                    ? "SENT_FOR_APPROVAL"
                                    : project.approvalStatus
                                )}
                          </div>

                          <p>
                            <strong>Funded:</strong> ₹
                            {Number(project.fundedAmount || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* FUNDING PROGRESS */}
                      <Progress value={fundingProgress} />

                      <div className="flex flex-wrap gap-3">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/farmer/project/${project.id}`)}
                        >
                          Track Project
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            requestPartners(
                              project.id,
                              "approvalStage" in project
                                ? (project as any).approvalStage
                                : project.approvalStatus === "PENDING"
                                  ? "SENT_FOR_APPROVAL"
                                  : project.approvalStatus
                            )
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Request Workers
                        </Button>
                      </div>

                      {/* REJECTION REASON */}
                      {project.rejectionReason && (
                        <p className="text-red-600 text-sm">
                          <strong>Reason:</strong> {project.rejectionReason}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">
                    You haven't created any projects yet.
                  </p>

                  <Button asChild>
                    <Link to="/farmer/create-project">
                      Create Your First Project
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}