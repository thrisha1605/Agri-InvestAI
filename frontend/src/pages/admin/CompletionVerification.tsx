import {
  completeProject,
  getProjectInvestorSummary,
  getProjectSettlementSummary,
  listProjects,
  updateProject,
} from "@/lib/appData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function CompletionVerification() {
  const [projects, setProjects] = useState(
    listProjects().filter(
      (p) => p.completionRequested || (p as any).status === "COMPLETION_REQUESTED"
    )
  );

  const approveCompletion = (id: string) => {
    completeProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success("Project marked as COMPLETED and payouts distributed");
  };

  const rejectCompletion = (id: string) => {
    const reason = prompt("Enter rejection reason");

    updateProject(id, {
      status: "IN_PROGRESS",
      completionRequested: false,
      adminRemarks: reason || "Completion rejected by admin",
    });

    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success("Completion request rejected");
  };

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Completion Requests</h1>

      <div className="grid gap-6">
        {projects.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              No completion requests
            </CardContent>
          </Card>
        )}

        {projects.map((project) => {
          const investorSummary = getProjectInvestorSummary(project.id);
          const settlement = getProjectSettlementSummary(project.id);

          return (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <p><b>Farmer:</b> {project.farmerName}</p>
                  <p><b>Location:</b> {project.location}</p>
                  <p><b>Crop:</b> {project.cropType}</p>
                  <p><b>Progress:</b> {project.progress}%</p>
                  <p><b>Status:</b> {project.status}</p>
                  <p><b>Investors:</b> {investorSummary.investorCount}</p>
                  <p><b>Total invested:</b> {formatCurrency(investorSummary.totalInvested)}</p>
                  <p><b>Average ticket:</b> {formatCurrency(investorSummary.averageTicket)}</p>
                </div>

                {settlement && (
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm">
                    <p><b>Total profit:</b> {formatCurrency(settlement.totalProfit)}</p>
                    <p><b>Platform 3% fee:</b> {formatCurrency(settlement.platformFee)}</p>
                    <p><b>Partner salary total:</b> {formatCurrency(settlement.totalPartnerSalary)}</p>
                    <p><b>Investor ROI pool:</b> {formatCurrency(settlement.investorPool)}</p>
                    <p><b>Farmer share:</b> {formatCurrency(settlement.farmerShare)}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-3">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveCompletion(project.id)}
                  >
                    Approve Completion
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => rejectCompletion(project.id)}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
