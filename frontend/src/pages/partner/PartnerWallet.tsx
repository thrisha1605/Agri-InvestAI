import { WalletHub } from "@/components/finance/WalletHub";
import { authService } from "@/lib/auth";
import { getPartnerRequestsForPartner, listPartnerSalaries } from "@/lib/appData";

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

export function PartnerWallet() {
  const user = authService.getCurrentUser();
  if (!user) return null;

  const partnerRequests = getPartnerRequestsForPartner(user.id);
  const paidSalaries = listPartnerSalaries().filter(
    (salary) => salary.partnerId === user.id && salary.status === "PAID"
  );
  const totalSalary = paidSalaries.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <WalletHub
      user={user}
      title="Partner Wallet"
      subtitle="Monthly salary is auto-credited to your wallet, and you can withdraw it to bank, UPI, Paytm, GPay, PhonePe, or any supported payout handle."
      highlights={[
        {
          label: "Accepted Work",
          value: String(partnerRequests.filter((request) => request.status === "APPROVED").length),
          helper: "Projects where you are approved to support the farmer.",
        },
        {
          label: "Salary Credited",
          value: formatCurrency(totalSalary),
          helper: "Auto-credited monthly salary records that have already been paid.",
        },
        {
          label: "Salary Cycles",
          value: String(paidSalaries.length),
          helper: "Each completed month is tracked before you withdraw funds.",
        },
      ]}
    />
  );
}
