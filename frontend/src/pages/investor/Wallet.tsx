import { WalletHub } from "@/components/finance/WalletHub";
import { authService } from "@/lib/auth";
import { getInvestorInvestments } from "@/lib/appData";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function Wallet() {
  const user = authService.getCurrentUser();
  if (!user) return null;

  const investments = getInvestorInvestments(user.id);
  const totalInvested = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const completedProjects = investments.filter((item) =>
    ["PROFIT_CALCULATED", "COMPLETED"].includes(item.projectStatus)
  ).length;

  return (
    <WalletHub
      user={user}
      title="Investor Wallet"
      subtitle="Your investment wallet now supports payouts, SIP saving from Rs. 50, and flexible withdrawals through bank, UPI, GPay, Paytm, and more."
      highlights={[
        {
          label: "Active Investments",
          value: String(investments.filter((item) => item.projectStatus !== "COMPLETED").length),
          helper: "Projects currently running or waiting for settlement.",
        },
        {
          label: "Total Invested",
          value: formatCurrency(totalInvested),
          helper: "Combined one-time and SIP-backed investments across projects.",
        },
        {
          label: "Completed Projects",
          value: String(completedProjects),
          helper: "Return payouts are credited to your wallet after project completion.",
        },
      ]}
    />
  );
}
