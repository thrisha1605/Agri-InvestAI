import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/lib/auth';
import {
  fetchFarmerProjects,
  getFarmerProjects,
  getProjectInvestorSummary,
  getProjectStatusLabel,
  getProjectSettlementSummary,
} from '@/lib/appData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function approvalBadge(status: string) {
  const styles: Record<string, string> = {
    SENT_FOR_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    VERIFIED: 'bg-blue-100 text-blue-800 border-blue-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Badge
      variant="outline"
      className={styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}
    >
      {status.replaceAll('_', ' ')}
    </Badge>
  );
}

function formatCurrency(amount: number) {
  return `Rs.${Math.round(Number(amount || 0)).toLocaleString('en-IN')}`;
}

export function FarmerProjects() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(() => (user ? getFarmerProjects(user.id) : []));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetchFarmerProjects()
      .then((backendProjects) => {
        if (backendProjects.length > 0) {
          setProjects(backendProjects);
        } else {
          setProjects(getFarmerProjects(user.id));
        }
      })
      .catch(() => {
        setProjects(getFarmerProjects(user.id));
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">My Projects</h1>

        <div className="grid gap-6">
          {projects.length > 0 ? (
            projects.map((project) => {
              const investorSummary = getProjectInvestorSummary(project.id);
              const settlement = getProjectSettlementSummary(project.id);

              return (
                <Card key={project.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.cropType} • {project.location}
                      </p>
                    </div>
                    {approvalBadge(project.approvalStage)}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-sm text-emerald-700">Investors</p>
                        <p className="mt-2 text-2xl font-bold">{investorSummary.investorCount}</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-sm text-blue-700">Total invested</p>
                        <p className="mt-2 text-2xl font-bold">
                          {formatCurrency(investorSummary.totalInvested)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-4">
                        <p className="text-sm text-amber-700">Average ticket</p>
                        <p className="mt-2 text-2xl font-bold">
                          {formatCurrency(investorSummary.averageTicket)}
                        </p>
                      </div>
                    </div>

                    <p><strong>Funding Goal:</strong> {formatCurrency(project.fundingGoal)}</p>
                    <p><strong>Funded Amount:</strong> {formatCurrency(project.fundedAmount)}</p>
                    <p><strong>Project Status:</strong> {getProjectStatusLabel(project)}</p>
                    <p><strong>Approval Status:</strong> {project.approvalStage.replaceAll('_', ' ')}</p>
                    <p><strong>Progress:</strong> {project.progress}%</p>

                    {settlement && (
                      <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                        <p><strong>Estimated platform fee:</strong> {formatCurrency(settlement.platformFee)}</p>
                        <p><strong>Estimated partner salary reserve:</strong> {formatCurrency(settlement.totalPartnerSalary)}</p>
                        <p><strong>Estimated farmer share:</strong> {formatCurrency(settlement.farmerShare)}</p>
                      </div>
                    )}

                    {project.approvalStage === 'APPROVED' && (
                      <p className="text-emerald-700">
                        <strong>Admin Decision:</strong> Approved
                      </p>
                    )}

                    {project.approvalStage === 'REJECTED' && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                        <p><strong>Admin Decision:</strong> Rejected</p>
                        <p><strong>Reason:</strong> {project.rejectionReason || 'No reason provided by admin.'}</p>
                      </div>
                    )}

                    {project.approvalStage === 'SENT_FOR_APPROVAL' && (
                      <p className="text-yellow-700">
                        <strong>Admin Decision:</strong> Sent for approval
                      </p>
                    )}

                    {project.approvalStage === 'VERIFIED' && (
                      <p className="text-blue-700">
                        <strong>Admin Decision:</strong> Verified and waiting for final approval
                      </p>
                    )}

                    {project.completionRequested ? (
                      <p className="text-orange-600">Completion request pending admin approval</p>
                    ) : null}

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Button asChild variant="outline">
                        <Link to={`/farmer/projects/${project.id}/progress`}>
                          Update Progress
                        </Link>
                      </Button>

                      <Button onClick={() => navigate(`/farmer/project/${project.id}`)}>
                        Track Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="mb-4 text-gray-600">No projects created yet.</p>
                <Button asChild>
                  <Link to="/farmer/create-project">Create Project</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
