import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  addPartnerRequest,
  canPartnerRequestProject,
  getPartnerRequestUnavailableReason,
  getPartnerRequestsForPartner,
  getProjectInvestorSummary,
  getProjectStatusLabel,
  listProjects,
} from "@/lib/appData";
import { authService } from "@/lib/auth";
import { getPartnerProfile } from "@/lib/partnerProfile";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function AvailableProjects() {
  const user = authService.getCurrentUser();
  if (!user) return null;

  const profile = getPartnerProfile(user.id);
  const requests = getPartnerRequestsForPartner(user.id);
  const availableProjects = listProjects().filter(
    (project) => canPartnerRequestProject(project) && project.assignedPartnerId !== user.id
  );

  const requestWork = async (project: any) => {
    if (!profile.readyForProjects) {
      toast.error("Complete your profile before requesting project work.");
      return;
    }

    if (requests.some((request) => request.projectId === project.id)) {
      toast.error("Request already sent for this project.");
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
        message: "Interested to work on this project",
        salary: project.monthlySalary || 10000,
      });
      toast.success("Work request sent successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send work request.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Projects</h1>
        <p className="text-gray-600">
          Projects that need helper support and can pay monthly salary into your wallet.
        </p>
      </div>

      {availableProjects.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            No projects are open for helper requests right now.
          </CardContent>
        </Card>
      )}

      {availableProjects.map((project) => {
        const investorSummary = getProjectInvestorSummary(project.id);

        return (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p><strong>Location:</strong> {project.location}, {project.state}</p>
                <p><strong>Crop:</strong> {project.cropType}</p>
                <p><strong>Farmer:</strong> {project.farmerName}</p>
                <p><strong>Monthly salary:</strong> {formatCurrency(project.monthlySalary || 0)}</p>
                <p><strong>Status:</strong> {getProjectStatusLabel(project)}</p>
                <p><strong>Investors:</strong> {investorSummary.investorCount}</p>
                <p><strong>Total invested:</strong> {formatCurrency(investorSummary.totalInvested)}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to={`/projects/${project.id}`}>View Project</Link>
                </Button>
                <Button onClick={() => void requestWork(project)}>Request Work</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
