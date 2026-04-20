import { authService } from "@/lib/auth";
import { getInvestorInvestments } from "@/lib/appData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function InvestorPayments() {
  const user = authService.getCurrentUser();
  const items = user ? getInvestorInvestments(user.id) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <BackButton />

        <Card>
          <CardHeader>
            <CardTitle>💳 Payment History</CardTitle>
          </CardHeader>

          <CardContent>
            {items.length === 0 ? (
              <p className="text-center text-gray-500">No payments yet</p>
            ) : (
              items.map((i: any) => (
                <div key={i.id} className="border p-4 rounded-xl mb-4 shadow-sm">

                  <div className="flex justify-between">
                    <p className="font-semibold text-green-700">Payment Successful</p>
                    <Badge className="bg-green-100 text-green-700">SUCCESS</Badge>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{i.projectTitle}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-sm">

                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-bold">{formatCurrency(i.amount)}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Method</p>
                      <p>{i.paymentMethod || "ONLINE"}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Type</p>
                      <p>{i.investmentType || "ONE_TIME"}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Transaction</p>
                      <p className="truncate">{i.transactionId || "N/A"}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Date</p>
                      <p>
                        {i.createdAt
                          ? new Date(i.createdAt).toLocaleDateString("en-IN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="text-green-600 font-semibold">
                        {i.paymentStatus || "SUCCESS"}
                      </p>
                    </div>

                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}