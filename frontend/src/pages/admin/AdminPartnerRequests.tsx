import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  approvePartnerRequest,
  listPartnerRequests,
  rejectPartnerRequest,
  WorkerProjectRequest,
  WorkerRequestStatus,
} from "../../lib/appData";
import {
  fetchPartnerProfilesForAdmin,
  listPartnerProfilesForAdmin,
  PartnerProfileRecord,
} from "../../lib/partnerProfile";

const statusOptions: Array<WorkerRequestStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED"];

type DetailRowProps = {
  label: string;
  value?: string | number | boolean | null;
};

function DetailRow({ label, value }: DetailRowProps) {
  const renderedValue =
    value === undefined || value === null || value === "" ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-2 sm:grid-cols-[160px_1fr]">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 break-words">{renderedValue}</span>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function badgeClasses(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

export function AdminPartnerRequests() {
  const [requests, setRequests] = useState<WorkerProjectRequest[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<PartnerProfileRecord[]>([]);
  const [filter, setFilter] = useState<WorkerRequestStatus | "ALL">("PENDING");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = async (nextFilter: WorkerRequestStatus | "ALL") => {
    setLoading(true);
    try {
      const response = await listPartnerRequests(nextFilter !== "ALL" ? nextFilter : undefined);
      setRequests(response);
      if (response.length > 0) {
        setSelectedRequestId((current) =>
          current && response.some((item) => item.id === current) ? current : response[0].id || null,
        );
      } else {
        setSelectedRequestId(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load partner requests.";
      toast.error(message);
    } finally {
      const profiles = await fetchPartnerProfilesForAdmin().catch(() => listPartnerProfilesForAdmin());
      setSavedProfiles(profiles);
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
    const promptText = decision === "approve" ? "Add approval remarks (optional)" : "Add rejection remarks (optional)";
    const remarks = window.prompt(promptText, "");
    if (remarks === null) return;

    setActionLoading(requestId);
    try {
      if (decision === "approve") {
        await approvePartnerRequest(requestId, remarks || undefined);
        toast.success("Partner request approved.");
      } else {
        await rejectPartnerRequest(requestId, remarks || undefined);
        toast.success("Partner request rejected.");
      }
      await loadRequests(filter);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update request.";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Partner Request Approvals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review agri-partner requests to join farmer projects, and approve or reject with a reason.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Filter</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as WorkerRequestStatus | "ALL")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <nav className="flex flex-wrap gap-2">
          <Link to="/admin/projects" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
            Farmer Project Approvals
          </Link>
          <Link to="/admin/withdrawal-requests" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
            Withdrawal Requests
          </Link>
          <Link to="/admin/dashboard" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
            Admin Home
          </Link>
          </nav>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Partner Requests</h2>
          </div>
          {loading ? (
            <div className="p-5 text-sm text-slate-500">Loading partner requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No partner requests found.</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {requests.map((request) => {
                const isSelected = request.id === selectedRequest?.id;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequestId(request.id || null)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      isSelected ? "bg-emerald-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{request.partnerName || request.partnerId}</p>
                        <p className="text-sm text-slate-500">{request.projectTitle || request.projectId}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{request.message || "No message provided."}</p>
                    <p className="mt-2 text-xs text-slate-400">Created: {formatDate(request.createdAt)}</p>
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
            <div className="p-5 text-sm text-slate-500">Select a request to review details.</div>
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
                  <DetailRow label="Partner ID" value={selectedRequest.partnerId} />
                  <DetailRow label="Partner Name" value={selectedRequest.partnerName} />
                  <DetailRow label="Status" value={selectedRequest.status} />
                  <DetailRow label="Admin Remarks" value={selectedRequest.adminRemarks} />
                  <DetailRow label="Reviewed At" value={formatDate(selectedRequest.reviewedAt)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Partner Profile</h3>
                <div className="rounded-xl border border-slate-200 p-4">
                  <DetailRow label="Headline" value={selectedRequest.headline} />
                  <DetailRow label="Bio" value={selectedRequest.bio} />
                  <DetailRow label="Experience (Years)" value={selectedRequest.experienceYears} />
                  <DetailRow label="Skills" value={selectedRequest.skills?.join(", ")} />
                  <DetailRow label="Districts" value={Array.isArray(selectedRequest.districts) ? selectedRequest.districts.join(", ") : selectedRequest.districts} />
                  <DetailRow label="Aadhaar Number" value={selectedRequest.aadhaarNumber} />
                  <DetailRow label="UPI ID" value={selectedRequest.upiId} />
                  <DetailRow label="Paytm Number" value={selectedRequest.paytmNumber} />
                  <DetailRow label="Completion %" value={selectedRequest.completionPercent} />
                  <DetailRow label="Ready For Projects" value={selectedRequest.readyForProjects} />
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => selectedRequest.id && handleReview(selectedRequest.id, "approve")}
                  disabled={!selectedRequest.id || actionLoading === selectedRequest.id || selectedRequest.status === "APPROVED"}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === selectedRequest.id ? "Saving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => selectedRequest.id && handleReview(selectedRequest.id, "reject")}
                  disabled={!selectedRequest.id || actionLoading === selectedRequest.id || selectedRequest.status === "REJECTED"}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === selectedRequest.id ? "Saving..." : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Saved Partner Profiles</h2>
          <p className="mt-1 text-sm text-slate-500">
            Partner profile submissions saved on this device appear here even before they are attached to a project request.
          </p>
        </div>

        {savedProfiles.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No partner profiles saved yet.</div>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {savedProfiles.map((profile) => (
              <div key={profile.userId} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{profile.headline || "Profile awaiting headline"}</p>
                    <p className="text-sm text-slate-500">{profile.userId}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClasses(profile.readyForProjects ? "APPROVED" : "PENDING")}`}>
                    {profile.readyForProjects ? "READY" : "INCOMPLETE"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><strong>Completion:</strong> {profile.completionPercent}%</p>
                  <p><strong>Experience:</strong> {profile.experienceYears} year(s)</p>
                  <p><strong>Districts:</strong> {profile.districts || "Not provided"}</p>
                  <p><strong>Skills:</strong> {profile.skills.length ? profile.skills.join(", ") : "Not provided"}</p>
                  <p><strong>Aadhaar file:</strong> {profile.aadhaarFileName || "Not uploaded"}</p>
                  <p><strong>Certificates:</strong> {profile.certificateFileNames.length}</p>
                  <p><strong>Updated:</strong> {formatDate(profile.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
