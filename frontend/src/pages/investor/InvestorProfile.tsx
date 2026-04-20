import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/BackButton";

export function InvestorProfile() {
  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <BackButton />

        <Card>
          <CardHeader>
            <CardTitle>Investor Profile</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p><strong>Name:</strong> {user?.name || "-"}</p>
            <p><strong>Email:</strong> {user?.email || "-"}</p>
            <p><strong>Phone:</strong> {user?.phone || "-"}</p>
            <p>
              <strong>Wallet Balance:</strong> ₹
              {Number(user?.walletBalance || 0).toLocaleString("en-IN")}
            </p>
            <p><strong>Role:</strong> {user?.role || "INVESTOR"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}