import { WalletHub } from "@/components/finance/WalletHub";
import { authService } from "@/lib/auth";
import { getFarmerProjects, getProjectInvestorSummary } from "@/lib/appData";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function FarmerWallet() {
  const user = authService.getCurrentUser();
  if (!user) return null;

  const myProjects = getFarmerProjects(user.id);
  const totalFundingRaised = myProjects.reduce((sum, project) => sum + Number(project.fundedAmount || 0), 0);
  const totalInvestorBackers = myProjects.reduce(
    (sum, project) => sum + getProjectInvestorSummary(project.id).investorCount,
    0
  );

  return (
    <WalletHub
      user={user}
      title="Farmer Wallet"
      subtitle="Track project profits, request withdrawals after completion, and build long-term savings with flexible SIP plans."
      highlights={[
        {
          label: "Projects Created",
          value: String(myProjects.length),
          helper: "Approved and submitted farming opportunities under your account.",
        },
        {
          label: "Funding Raised",
          value: formatCurrency(totalFundingRaised),
          helper: "Total investor money committed across your projects.",
        },
        {
          label: "Investor Backers",
          value: String(totalInvestorBackers),
          helper: "Farmer and admin can see how many investors joined your projects.",
        },
      ]}
    />
  );
}
