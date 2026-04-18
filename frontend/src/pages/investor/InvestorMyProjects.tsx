import { authService } from "@/lib/auth";
import { getInvestorInvestments } from "@/lib/appData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function InvestorMyProjects() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  if (!user) return null;

  const investments = getInvestorInvestments(user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <BackButton />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Projects</CardTitle>
            <Button variant="outline" onClick={() => navigate("/projects")}>
              Browse More
            </Button>
          </CardHeader>

          <CardContent>
            {investments.length === 0 ? (
              <p className="text-gray-600">No invested projects yet.</p>
            ) : (
              <div className="space-y-4">
                {investments.map((i: any) => (
                  <div
                    key={i.id}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:justify-between gap-3"
                  >
                    <div>
                      <h3 className="font-semibold">{i.projectTitle}</h3>
                      <p className="text-sm text-gray-600">Farmer: {i.farmerName}</p>
                      <p className="text-sm text-gray-600">
                        Invested On: {i.createdAt ? new Date(i.createdAt).toLocaleDateString("en-IN") : "-"}
                      </p>
                    </div>

                    <div className="text-sm">
                      <p><strong>Amount:</strong> ₹{Number(i.amount || 0).toLocaleString("en-IN")}</p>
                      <p><strong>Project Status:</strong> {i.projectStatus}</p>
                      <p><strong>Payment Status:</strong> {i.paymentStatus}</p>
                      <p><strong>Type:</strong> {i.investmentType || "ONE_TIME"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}