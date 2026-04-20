import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProjectInvestorSummary,
  getProjectSettlementSummary,
  listInvestments,
  listProjects,
} from "@/lib/appData";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function ProjectFinanceDashboard() {
  const projects = listProjects();
  const investments = listInvestments();

  const totalInvestment = investments.reduce((sum, investment) => sum + Number(investment.amount || 0), 0);
  const completedProjects = projects.filter((project) => project.projectStatus === "COMPLETED");
  const settlementRollup = completedProjects.reduce(
    (acc, project) => {
      const settlement = getProjectSettlementSummary(project.id);
      if (!settlement) return acc;

      acc.totalProfit += settlement.totalProfit;
      acc.platformFee += settlement.platformFee;
      acc.totalPartnerSalary += settlement.totalPartnerSalary;
      acc.investorPool += settlement.investorPool;
      acc.farmerShare += settlement.farmerShare;
      return acc;
    },
    { totalProfit: 0, platformFee: 0, totalPartnerSalary: 0, investorPool: 0, farmerShare: 0 }
  );

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Platform Finance Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-5">
        {[
          ["Total Investments", formatCurrency(totalInvestment)],
          ["Project Profit", formatCurrency(settlementRollup.totalProfit)],
          ["Platform Commission (3%)", formatCurrency(settlementRollup.platformFee)],
          ["Partner Salaries", formatCurrency(settlementRollup.totalPartnerSalary)],
          ["Investor ROI Pool", formatCurrency(settlementRollup.investorPool)],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>{value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project-Level Investor Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project) => {
            const investorSummary = getProjectInvestorSummary(project.id);
            const settlement = getProjectSettlementSummary(project.id);

            return (
              <div key={project.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{project.title}</p>
                    <p className="text-sm text-slate-600">
                      {project.farmerName} • {project.cropType} • {project.projectStatus}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {project.approvalStage}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                  <p><strong>Investors:</strong> {investorSummary.investorCount}</p>
                  <p><strong>Total invested:</strong> {formatCurrency(investorSummary.totalInvested)}</p>
                  <p><strong>Average ticket:</strong> {formatCurrency(investorSummary.averageTicket)}</p>
                  <p><strong>Monthly salary:</strong> {formatCurrency(project.monthlySalary || 0)}</p>
                </div>

                {settlement && (
                  <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-4">
                    <p><strong>Profit:</strong> {formatCurrency(settlement.totalProfit)}</p>
                    <p><strong>Platform fee:</strong> {formatCurrency(settlement.platformFee)}</p>
                    <p><strong>Partner salary total:</strong> {formatCurrency(settlement.totalPartnerSalary)}</p>
                    <p><strong>Farmer share:</strong> {formatCurrency(settlement.farmerShare)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
