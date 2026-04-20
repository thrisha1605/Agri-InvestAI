import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  approveFarmerWithdrawal,
  type FarmerWithdrawal,
  type FarmerWithdrawalStatus,
  listAdminWithdrawals,
  rejectFarmerWithdrawal,
} from "@/lib/appData";

const statusOptions: Array<FarmerWithdrawalStatus | "ALL"> = ["ALL", "REQUESTED", "DISBURSED", "REJECTED"];

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN");
}

function badgeClasses(status: string) {
  switch ((status || "").toUpperCase()) {
    case "DISBURSED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  const renderedValue = value === undefined || value === null || value === "" ? "-" : value;

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-2 sm:grid-cols-[160px_1fr]">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="break-words text-sm text-slate-900">{renderedValue}</span>
    </div>
  );
}

export function AdminWithdrawalRequests() {
  const [requests, setRequests] = useState<FarmerWithdrawal[]>([]);
  const [filter, setFilter] = useState<FarmerWithdrawalStatus | "ALL">("REQUESTED");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = async (nextFilter: FarmerWithdrawalStatus | "ALL") => {
    setLoading(true);
    try {
      const response = await listAdminWithdrawals(nextFilter);
      setRequests(response);
      if (response.length > 0) {
        setSelectedRequestId((current) =>
          current && response.some((item) => item.id === current) ? current : response[0].id,
        );
      } else {
        setSelectedRequestId(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load withdrawal requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(filter);
  }, [filter]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) || requests[0] || null,
    [requests, selectedRequestId],
  );

  const handleReview = async (requestId: string, decision: "approve" | "reject") => {
    const promptText = decision === "approve" ? "Add approval remark (optional)" : "Add rejection reason";
    const adminRemark = window.prompt(promptText, "");
    if (adminRemark === null) return;

    setActionLoading(requestId);
    try {
      if (decision === "approve") {
        await approveFarmerWithdrawal(requestId, adminRemark || undefined);
        toast.success("Withdrawal request accepted.");
      } else {
        await rejectFarmerWithdrawal(requestId, adminRemark || undefined);
        toast.success("Withdrawal request rejected.");
      }
      await loadRequests(filter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update withdrawal request.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Farmer Withdrawal Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review farmer fund requests, verify reason and request time, then accept or reject with admin remarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Filter</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as FarmerWithdrawalStatus | "ALL")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <Link
            to="/admin/partner-requests"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Partner Requests
          </Link>
          <Link
            to="/admin/dashboard"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Admin Home
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Withdrawal Queue</h2>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-500">Loading withdrawal requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No withdrawal requests found.</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {requests.map((request) => {
                const isSelected = request.id === selectedRequest?.id;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      isSelected ? "bg-emerald-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{request.farmerName || request.farmerId}</p>
                        <p className="text-sm text-slate-500">{request.projectTitle || request.projectId}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700">{formatCurrency(request.amount)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{request.reason}</p>
                    <p className="mt-2 text-xs text-slate-400">Sent: {formatDate(request.createdAt)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Request Details</h2>
          </div>

          {!selectedRequest ? (
            <div className="p-5 text-sm text-slate-500">Select a withdrawal request to review.</div>
          ) : (
            <div className="space-y-6 p-5">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Request Summary</h3>
                <div className="rounded-xl border border-slate-200 p-4">
                  <DetailRow label="Request ID" value={selectedRequest.id} />
                  <DetailRow label="Project ID" value={selectedRequest.projectId} />
                  <DetailRow label="Project Title" value={selectedRequest.projectTitle} />
                  <DetailRow label="Farmer ID" value={selectedRequest.farmerId} />
                  <DetailRow label="Farmer Name" value={selectedRequest.farmerName} />
                  <DetailRow label="Milestone" value={selectedRequest.milestoneKey} />
                  <DetailRow label="Amount" value={formatCurrency(selectedRequest.amount)} />
                  <DetailRow label="Status" value={selectedRequest.status} />
                  <DetailRow label="Requested At" value={formatDate(selectedRequest.createdAt)} />
                  <DetailRow label="Reviewed At" value={formatDate(selectedRequest.reviewedAt)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Reason</h3>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                  {selectedRequest.reason || "No reason provided."}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Admin Remark</h3>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
                  {selectedRequest.adminRemark || "No admin remark added yet."}
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleReview(selectedRequest.id, "approve")}
                  disabled={actionLoading === selectedRequest.id || selectedRequest.status === "DISBURSED"}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === selectedRequest.id ? "Saving..." : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReview(selectedRequest.id, "reject")}
                  disabled={actionLoading === selectedRequest.id || selectedRequest.status === "REJECTED"}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === selectedRequest.id ? "Saving..." : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
