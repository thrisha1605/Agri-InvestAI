import { listProjects, listInvestments } from "@/lib/appData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function formatCurrency(amount: number) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function AdminAnalytics() {
  const projects = listProjects();
  const investments = listInvestments();

  const totalFunding = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const platformRevenue = totalFunding * 0.03;
  const pendingProjects = projects.filter((project) => project.approvalStatus === "PENDING").length;
  const approvedProjects = projects.filter((project) => project.approvalStage === "APPROVED").length;
  const completedProjects = projects.filter((project) => project.projectStatus === "COMPLETED").length;
  const waterInfraProjects = projects.filter((project) => Boolean(project.needsWaterInvestment)).length;
  const highRiskProjects = projects.filter(
    (project) => String(project.riskLevel || project.cropAnalysis?.riskLevel || "").toUpperCase() === "HIGH",
  ).length;
  const avgEsgScore =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((sum, project) => sum + Number(project.esgScore || project.esgBreakdown?.finalESGScore || 0), 0) /
            projects.length,
        );

  const projectStatusData = [
    { name: "Pending", value: pendingProjects },
    { name: "Approved", value: approvedProjects },
    { name: "Completed", value: completedProjects },
  ];

  const riskData = [
    {
      name: "Low",
      value: projects.filter(
        (project) => String(project.riskLevel || project.cropAnalysis?.riskLevel || "").toUpperCase() === "LOW",
      ).length,
    },
    {
      name: "Medium",
      value: projects.filter(
        (project) => String(project.riskLevel || project.cropAnalysis?.riskLevel || "").toUpperCase() === "MEDIUM",
      ).length,
    },
    {
      name: "High",
      value: highRiskProjects,
    },
  ];

  const cropFundingData = projects
    .map((project) => ({
      name: String(project.cropType || "UNKNOWN"),
      funding: Number(project.fundedAmount || project.raisedAmount || 0),
      waterCost: Number(project.waterCost || 0),
    }))
    .sort((left, right) => right.funding - left.funding)
    .slice(0, 8);

  const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b"];

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="mt-2 text-sm text-slate-600">
          Funding, ESG quality, water infrastructure demand, and agronomic risk across the marketplace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Platform Funding</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalFunding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Platform Revenue (3%)</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(platformRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Approved Projects</p>
            <p className="mt-2 text-2xl font-bold">{approvedProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Pending Approval</p>
            <p className="mt-2 text-2xl font-bold">{pendingProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Water Infra Needed</p>
            <p className="mt-2 text-2xl font-bold">{waterInfraProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Average ESG</p>
            <p className="mt-2 text-2xl font-bold">{avgEsgScore}/100</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={projectStatusData} dataKey="value" outerRadius={110} label>
                  {projectStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agronomic Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Funding by Crop</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={cropFundingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="funding" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intelligence Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-medium text-emerald-900">High-risk projects</p>
              <p className="mt-1 text-2xl font-bold text-emerald-950">{highRiskProjects}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="font-medium text-sky-900">Water infrastructure demand</p>
              <p className="mt-1">
                {waterInfraProjects} project(s) currently require borewell or similar water investment support.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="font-medium text-amber-900">Investor screening</p>
              <p className="mt-1">
                ESG and agronomic risk are now stored with each project, so approval and investor review can use the
                same data model.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
