import { authService } from "@/lib/auth";
import { getInvestorInvestments, listInvestorReturns } from "@/lib/appData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function InvestorReturns() {
  const user = authService.getCurrentUser();
  if (!user) return null;

  const investments = getInvestorInvestments(user.id);
  const returnRecords = listInvestorReturns().filter((item) => item.investorId === user.id);
  const totalReturns = returnRecords.reduce((sum, item) => sum + Number(item.returnAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <BackButton />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Total Returns Credited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Returns are credited after project completion, 3% platform fee deduction, and partner salary settlement.
            </p>
            <p className="mt-4 text-3xl font-bold">{formatCurrency(totalReturns)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed ROI Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            {returnRecords.length === 0 ? (
              <p className="text-gray-600">No completed return settlements yet.</p>
            ) : (
              <div className="space-y-4">
                {returnRecords.map((record) => {
                  const investment = investments.find((item) => item.projectId === record.projectId);
                  const investedAmount = Number(record.investedAmount || investment?.amount || 0);
                  const roiPercent = investedAmount
                    ? Math.round((Number(record.returnAmount || 0) / investedAmount) * 100)
                    : 0;

                  return (
                    <div
                      key={record.id}
                      className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold">{investment?.projectTitle || record.projectId}</p>
                        <p className="text-sm text-gray-600">{record.status}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p><strong>Invested:</strong> {formatCurrency(investedAmount)}</p>
                        <p><strong>Return credited:</strong> {formatCurrency(record.returnAmount)}</p>
                        <p><strong>ROI:</strong> {roiPercent}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
