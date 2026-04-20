import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getProjectById,
  listInvestorReturns,
  listInvestments,
  listPartnerSalaries,
  listProjects,
  listWithdrawals,
  updateInvestorReturnStatus,
  updatePartnerSalaryStatus,
  updateFarmerWithdrawalStatus,
} from "@/lib/appData";
import {
  BarChart3,
  IndianRupee,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    UNDER_VERIFICATION: "bg-blue-100 text-blue-800 border-blue-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    DISBURSED: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-slate-100 text-slate-700 border-slate-200",
    PAID: "bg-green-100 text-green-800 border-green-200",
    AVAILABLE: "bg-cyan-100 text-cyan-800 border-cyan-200",
  };

  return (
    <Badge
      variant="outline"
      className={map[status] || "bg-slate-100 text-slate-700 border-slate-200"}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

export function ProjectFinanceDashboard() {
  const projects = listProjects();
  const investments = listInvestments();
  const withdrawals = listWithdrawals();
  const salaries = listPartnerSalaries();
  const returns = listInvestorReturns();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [payoutRef, setPayoutRef] = useState("");

  const project = selectedProjectId ? getProjectById(selectedProjectId) : null;

  const projectInvestments = useMemo(
    () => investments.filter((i: any) => i.projectId === selectedProjectId),
    [investments, selectedProjectId]
  );

  const projectWithdrawals = useMemo(
    () => withdrawals.filter((w: any) => w.projectId === selectedProjectId),
    [withdrawals, selectedProjectId]
  );

  const projectSalaries = useMemo(
    () => salaries.filter((s: any) => s.projectId === selectedProjectId),
    [salaries, selectedProjectId]
  );

  const projectReturns = useMemo(
    () => returns.filter((r: any) => r.projectId === selectedProjectId),
    [returns, selectedProjectId]
  );

  const totalInvestment = projectInvestments.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0
  );

  const farmerWithdrawn = projectWithdrawals
    .filter((w: any) => w.status === "DISBURSED")
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const farmerPending = projectWithdrawals
    .filter((w: any) => w.status !== "DISBURSED")
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const totalSalaryPaid = projectSalaries
    .filter((s: any) => s.status === "PAID")
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const totalSalaryPending = projectSalaries
    .filter((s: any) => s.status !== "PAID")
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const totalReturnPaid = projectReturns
    .filter((r: any) => r.status === "DISBURSED")
    .reduce((sum: number, item: any) => sum + Number(item.returnAmount || 0), 0);

  const totalReturnPending = projectReturns
    .filter((r: any) => r.status !== "DISBURSED")
    .reduce((sum: number, item: any) => sum + Number(item.returnAmount || 0), 0);

  const revenue = Number((project as any)?.expectedRevenue || 0);
  const expenses = Number((project as any)?.estimatedExpenses || 0);
  const netProfit = Math.max(revenue - expenses, 0);
  const platformCommission = Math.round(netProfit * 0.03);
  const distributableProfit = Math.max(netProfit - platformCommission, 0);

  const markWithdrawalDisbursed = (id: string) => {
    updateFarmerWithdrawalStatus(id, "DISBURSED", payoutRef || "Paid by admin");
    setPayoutRef("");
    toast.success("Farmer withdrawal disbursed.");
    window.location.reload();
  };

  const markSalaryPaid = (id: string) => {
    updatePartnerSalaryStatus(id, "PAID", payoutRef || "Salary payout");
    setPayoutRef("");
    toast.success("Partner salary marked as paid.");
    window.location.reload();
  };

  const markReturnPaid = (id: string) => {
    updateInvestorReturnStatus(id, "DISBURSED", payoutRef || "Investor return payout");
    setPayoutRef("");
    toast.success("Investor return disbursed.");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Project Finance Dashboard</h1>
          <p className="text-gray-600">
            Track project-wise funds, farmer withdrawals, partner salaries, investor returns, and platform 3% commission.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
            <CardDescription>Choose a project to see complete financial flow</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border bg-white px-3 py-2"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title} - {p.farmerName}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {project && (
          <>
            <div className="grid md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-gray-500">Total Investment</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="h-5 w-5 text-amber-600" />
                    <p className="text-sm text-gray-500">Farmer Withdrawn</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(farmerWithdrawn)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <IndianRupee className="h-5 w-5 text-purple-600" />
                    <p className="text-sm text-gray-500">Salary Paid</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(totalSalaryPaid)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-gray-500">Investor Returns Paid</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(totalReturnPaid)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-gray-500">Platform 3% Commission</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(platformCommission)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profit Summary</CardTitle>
                  <CardDescription>Revenue, expenses, net profit, and distributable amount</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Expected Revenue</span>
                    <span className="font-semibold">{formatCurrency(revenue)}</span>
                  </div>

                  <div className="rounded-xl border p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Estimated Expenses</span>
                    <span className="font-semibold">{formatCurrency(expenses)}</span>
                  </div>

                  <div className="rounded-xl border p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Net Profit</span>
                    <span className="font-semibold">{formatCurrency(netProfit)}</span>
                  </div>

                  <div className="rounded-xl border bg-amber-50 p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Platform Fee (3%)</span>
                    <span className="font-semibold text-amber-700">{formatCurrency(platformCommission)}</span>
                  </div>

                  <div className="rounded-xl border bg-emerald-50 p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Distributable Profit</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(distributableProfit)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Finance Actions</CardTitle>
                  <CardDescription>Quick overview of pending payouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Farmer Pending</span>
                    <span className="font-semibold">{formatCurrency(farmerPending)}</span>
                  </div>

                  <div className="rounded-xl border p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Salary Pending</span>
                    <span className="font-semibold">{formatCurrency(totalSalaryPending)}</span>
                  </div>

                  <div className="rounded-xl border p-4 flex justify-between">
                    <span className="text-sm text-gray-500">Investor Returns Pending</span>
                    <span className="font-semibold">{formatCurrency(totalReturnPending)}</span>
                  </div>

                  <Input
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="Enter payout / Razorpay reference"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Farmer Withdrawals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectWithdrawals.length === 0 ? (
                    <p className="text-sm text-gray-600">No farmer withdrawals.</p>
                  ) : (
                    projectWithdrawals.map((item: any) => (
                      <div key={item.id} className="rounded-xl border p-4 space-y-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold">{formatCurrency(item.amount)}</p>
                            <p className="text-sm text-gray-600">{item.milestoneKey?.replaceAll("_", " ")}</p>
                          </div>
                          {statusBadge(item.status)}
                        </div>

                        <p className="text-sm">{item.reason}</p>

                        {item.status !== "DISBURSED" && (
                          <Button onClick={() => markWithdrawalDisbursed(item.id)} className="w-full">
                            Disburse Farmer Amount
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agri-Partner Salaries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectSalaries.length === 0 ? (
                    <p className="text-sm text-gray-600">No salary entries.</p>
                  ) : (
                    projectSalaries.map((item: any) => (
                      <div key={item.id} className="rounded-xl border p-4 space-y-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.partnerName}</p>
                            <p className="text-sm text-gray-600">{item.month}</p>
                          </div>
                          {statusBadge(item.status)}
                        </div>

                        <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>

                        {item.status !== "PAID" && (
                          <Button onClick={() => markSalaryPaid(item.id)} className="w-full">
                            Mark Salary Paid
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investor Returns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projectReturns.length === 0 ? (
                    <p className="text-sm text-gray-600">No investor return requests.</p>
                  ) : (
                    projectReturns.map((item: any) => (
                      <div key={item.id} className="rounded-xl border p-4 space-y-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.investorName}</p>
                            <p className="text-sm text-gray-600">
                              Invested: {formatCurrency(item.investedAmount)}
                            </p>
                          </div>
                          {statusBadge(item.status)}
                        </div>

                        <p className="text-sm font-medium">
                          Return: {formatCurrency(item.returnAmount)}
                        </p>

                        {item.status !== "DISBURSED" && (
                          <Button onClick={() => markReturnPaid(item.id)} className="w-full">
                            Disburse Investor Return
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}