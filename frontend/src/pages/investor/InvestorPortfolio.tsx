import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { authService } from "@/lib/auth";
import { listInvestments, getProjectById } from "@/lib/appData";

export function InvestorPortfolio() {

  const user = authService.getCurrentUser();
  if (!user) return null;

  const investments = listInvestments().filter(
    (i) => i.investorId === user.id
  );

  const portfolio = investments.map((inv) => {
    const project = getProjectById(inv.projectId);

    if (!project) return null;

    const estimatedProfit =
      (project.expectedROI / 100) * inv.amount;

    const platformFee = estimatedProfit * 0.03;

    const finalReturn = inv.amount + estimatedProfit - platformFee;

    return {
      ...inv,
      project,
      estimatedProfit,
      platformFee,
      finalReturn,
    };
  }).filter(Boolean);

  const totalInvested = portfolio.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const expectedReturns = portfolio.reduce(
    (sum, p) => sum + p.finalReturn,
    0
  );

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">Investor Portfolio</h1>

      <div className="grid md:grid-cols-3 gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Total Invested</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalInvested.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Returns</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ₹{expectedReturns.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-bold">
              {portfolio.length}
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="space-y-4">

        {portfolio.map((item) => {

          const progress =
            (item.project.fundedAmount /
              item.project.fundingGoal) *
            100;

          return (

            <Card key={item.id}>

              <CardContent className="p-6 space-y-4">

                <div className="flex justify-between">

                  <div>
                    <h2 className="text-xl font-semibold">
                      {item.project.title}
                    </h2>

                    <p className="text-sm text-gray-600">
                      {item.project.cropType} • {item.project.location}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      Invested: ₹{item.amount.toLocaleString()}
                    </p>

                    <p className="text-green-600">
                      Expected Return: ₹
                      {Math.round(item.finalReturn).toLocaleString()}
                    </p>
                  </div>

                </div>

                <Progress value={progress} />

                <div className="flex justify-between text-sm text-gray-600">

                  <span>
                    Funded: ₹{item.project.fundedAmount.toLocaleString()}
                  </span>

                  <span>
                    Goal: ₹{item.project.fundingGoal.toLocaleString()}
                  </span>

                </div>

              </CardContent>

            </Card>

          );
        })}

      </div>

    </div>
  );
}