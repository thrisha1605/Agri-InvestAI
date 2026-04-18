import { useState } from "react";
import { AdminProjectApproval } from "./AdminProjectApproval";
import { AdminPartnerRequests } from "./AdminPartnerRequests";
import { AdminWithdrawalRequests } from "./AdminWithdrawalRequests";

const TABS = [
  { id: "projects", label: "Farmer Projects" },
  { id: "partners", label: "Partner Requests" },
  { id: "withdrawals", label: "Withdrawal Requests" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"projects" | "partners" | "withdrawals">("projects");

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Admin Console</h1>
              <p className="mt-2 text-sm text-slate-600">
                Review and manage farmer projects and agri-partner requests from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "projects" | "partners" | "withdrawals")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          {activeTab === "projects" ? (
            <AdminProjectApproval />
          ) : activeTab === "partners" ? (
            <AdminPartnerRequests />
          ) : (
            <AdminWithdrawalRequests />
          )}
        </div>
      </div>
    </div>
  );
}
