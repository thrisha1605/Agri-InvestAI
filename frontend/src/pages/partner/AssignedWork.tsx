import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProjectInvestorSummary, getProjectStatusLabel, listProjects } from "@/lib/appData";
import { authService } from "@/lib/auth";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function AssignedWork() {
  const user = authService.getCurrentUser();
  if (!user) return null;

  const assignedProjects = listProjects().filter(
    (project) =>
      project.workerRequestStatus === "ASSIGNED" && project.assignedPartnerId === user.id
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Assigned Work</h1>
        <p className="text-gray-600">
          Projects where you are approved to work and receive monthly salary credit.
        </p>
      </div>

      {assignedProjects.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No assigned projects yet.
          </CardContent>
        </Card>
      )}

      {assignedProjects.map((project) => {
        const investorSummary = getProjectInvestorSummary(project.id);

        return (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p><strong>Farmer:</strong> {project.farmerName}</p>
                <p><strong>Status:</strong> {getProjectStatusLabel(project)}</p>
                <p><strong>Monthly salary:</strong> {formatCurrency(project.monthlySalary || 0)}</p>
                <p><strong>Funding:</strong> {formatCurrency(project.fundedAmount)} / {formatCurrency(project.fundingGoal)}</p>
                <p><strong>Investors:</strong> {investorSummary.investorCount}</p>
                <p><strong>Total invested:</strong> {formatCurrency(investorSummary.totalInvested)}</p>
              </div>

              <Button asChild>
                <Link to={`/projects/${project.id}`}>Track Project</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
