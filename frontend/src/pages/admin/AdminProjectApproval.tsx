import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AppProject,
  fetchAllProjects,
  listProjects,
  persistProjectUpdate,
} from "../../lib/appData";

type FilterValue = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusOptions: FilterValue[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeApprovalStage(stage?: string) {
  const value = (stage || "").toUpperCase();
  if (value === "SENT_FOR_APPROVAL" || value === "PENDING" || value === "VERIFIED") {
    return "PENDING";
  }
  if (value === "REJECTED") {
    return "REJECTED";
  }
  if (value === "APPROVED") {
    return "APPROVED";
  }
  return "PENDING";
}

function approvalBadge(stage?: string) {
  const status = normalizeApprovalStage(stage);
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

function DetailRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const renderedValue =
    value === undefined || value === null || value === "" ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : value;

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-2 sm:grid-cols-[180px_1fr]">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 break-words">{renderedValue}</span>
    </div>
  );
}

function DetailList({ label, items }: { label: string; items?: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-2 sm:grid-cols-[180px_1fr]">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {(items || []).length ? (
          items!.map((item) => (
            <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-900">—</span>
        )}
      </div>
    </div>
  );
}

function isImageAsset(url?: string, fileType?: string) {
  if (fileType?.startsWith("image/")) {
    return true;
  }

  const value = String(url || "");
  return value.startsWith("data:image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(value);
}

function isPdfAsset(url?: string, fileType?: string) {
  if (fileType === "application/pdf") {
    return true;
  }

  const value = String(url || "");
  return value.startsWith("data:application/pdf") || /\.pdf($|\?)/i.test(value);
}

function collectProjectImages(project: AppProject) {
  const imageUrls = [
    ...(Array.isArray(project.images) ? project.images : []),
    ...((project.progressPhotos || [])
      .map((item: any) => item?.imageUrl || item?.url || "")
      .filter(Boolean)),
  ].filter(Boolean);

  return Array.from(new Set(imageUrls));
}

function collectProjectDocuments(project: AppProject) {
  const documents: Array<{ label: string; fileName: string; fileUrl: string; fileType: string }> = [];
  const seen = new Set<string>();

  const pushDocument = (item: { label?: string; fileName?: string; fileUrl?: string; fileType?: string }) => {
    const label = String(item.label || "Uploaded document");
    const fileName = String(item.fileName || "").trim();
    const fileUrl = String(item.fileUrl || "").trim();
    const fileType = String(item.fileType || "").trim();

    if (!fileName && !fileUrl) {
      return;
    }

    const key = `${label}|${fileName}|${fileUrl}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    documents.push({ label, fileName, fileUrl, fileType });
  };

  (Array.isArray(project.documents) ? project.documents : []).forEach((document: any) => {
    pushDocument({
      label: document?.label,
      fileName: document?.fileName || document?.name,
      fileUrl: document?.fileUrl || document?.url || document?.imageUrl,
      fileType: document?.fileType || document?.type,
    });
  });

  [
    ["aadhaarDocument", "Aadhaar / Government ID Proof"],
    ["landDocument", "Land Ownership / Lease Document"],
    ["bankDocument", "Bank Passbook / Cancelled Cheque / UPI Proof"],
    ["cultivationPlanDocument", "Cultivation Plan Document"],
    ["soilTestDocument", "Soil Test Report"],
    ["waterSourceDocument", "Water Source / Irrigation Proof"],
    ["organicCertificate", "Organic / Government Certificate"],
    ["otherDocument", "Other Supporting Document"],
  ].forEach(([field, label]) => {
    const raw = project[field];
    if (!raw) {
      return;
    }

    if (typeof raw === "string") {
      pushDocument({ label, fileName: raw });
      return;
    }

    if (typeof raw === "object") {
      pushDocument({
        label,
        fileName: raw.fileName || raw.name,
        fileUrl: raw.fileUrl || raw.url,
        fileType: raw.fileType || raw.type,
      });
    }
  });

  return documents;
}

export default function AdminProjectApproval() {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [filter, setFilter] = useState<FilterValue>("PENDING");
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const syncProjects = (allProjects: AppProject[]) => {
    setProjects(allProjects);
    if (allProjects.length > 0) {
      setSelectedProjectId((current) =>
        current && allProjects.some((project) => project.id === current) ? current : allProjects[0].id,
      );
    } else {
      setSelectedProjectId(null);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await fetchAllProjects();
      syncProjects(allProjects);
    } catch {
      syncProjects(listProjects());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const approvalStage = normalizeApprovalStage(project.approvalStage || project.approvalStatus);
      if (filter === "ALL") return true;
      return approvalStage === filter;
    });
  }, [filter, projects]);

  const selectedProject = useMemo(
    () => filteredProjects.find((project) => project.id === selectedProjectId) || filteredProjects[0] || null,
    [filteredProjects, selectedProjectId],
  );

  useEffect(() => {
    if (!selectedProject && filteredProjects.length > 0) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProject]);

  const handleReview = async (projectId: string, decision: "approve" | "reject") => {
    const promptText = decision === "approve" ? "Enter approval notes (optional)" : "Enter rejection reason";
    const notes = window.prompt(promptText, "");
    if (notes === null) {
      return;
    }

    setActionLoading(projectId);

    try {
      const updates: Partial<AppProject> = {
        approvalStage: decision === "approve" ? "APPROVED" : "REJECTED",
        approvalStatus: decision === "approve" ? "APPROVED" : "REJECTED",
        status: decision === "approve" ? "APPROVED" : "REJECTED",
        projectStatus: decision === "approve" ? "OPEN_FOR_FUNDING" : "NOT_STARTED",
        adminRemarks: notes || undefined,
      };

      if (decision === "reject") {
        updates.rejectionReason = notes || "Rejected by admin";
      } else {
        updates.rejectionReason = "";
      }

      await persistProjectUpdate(projectId, updates);
      await loadProjects();
      toast.success(decision === "approve" ? "Project approved successfully." : "Project rejected successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update project.";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Farmer Project Approvals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review farmer-uploaded projects, approve them for funding, or reject with a specific reason.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>Filter</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as FilterValue)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Projects Pending Review</h2>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-500">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No projects found for this filter.</div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {filteredProjects.map((project) => {
                const isSelected = project.id === selectedProject?.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      isSelected ? "bg-emerald-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{project.title}</p>
                        <p className="text-sm text-slate-500">{project.farmerName}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${approvalBadge(project.approvalStage)}`}
                      >
                        {(project.approvalStage || project.approvalStatus || "").split("_").join(" ")}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description || "No description provided."}</p>
                    <p className="mt-2 text-xs text-slate-400">Created: {formatDate(project.createdAt)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Project Details</h2>
          </div>

          {!selectedProject ? (
            <div className="p-5 text-sm text-slate-500">Select a project to review and approve or reject.</div>
          ) : (
            <div className="space-y-6 p-5">
              {(() => {
                const uploadedImages = collectProjectImages(selectedProject);
                const uploadedDocuments = collectProjectDocuments(selectedProject);

                return (
                  <>
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Project Summary</h3>
                <div className="rounded-xl border border-slate-200 p-4">
                  <DetailRow label="Project ID" value={selectedProject.id} />
                  <DetailRow label="Title" value={selectedProject.title} />
                  <DetailRow label="Farmer" value={selectedProject.farmerName} />
                  <DetailRow label="Location" value={`${selectedProject.location}, ${selectedProject.state}`} />
                  <DetailRow label="Crop Type" value={selectedProject.cropType} />
                  <DetailRow label="Funding Goal" value={`Rs. ${selectedProject.fundingGoal?.toLocaleString()}`} />
                  <DetailRow label="Project Status" value={selectedProject.projectStatus} />
                  <DetailRow label="Approval Stage" value={selectedProject.approvalStage} />
                  <DetailRow label="Rejection Reason" value={selectedProject.rejectionReason} />
                  <DetailRow label="Admin Remarks" value={selectedProject.adminRemarks} />
                  <DetailRow label="Created At" value={formatDate(selectedProject.createdAt)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h3>
                <div className="rounded-xl border border-slate-200 p-4 whitespace-pre-wrap text-sm text-slate-700">
                  {selectedProject.description || "No project description available."}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Project Documents</h3>
                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <DetailRow label="Documents" value={uploadedDocuments.length ? `${uploadedDocuments.length} uploaded` : "No documents"} />
                  <DetailRow label="Image Count" value={uploadedImages.length} />

                  {uploadedDocuments.length === 0 ? (
                    <p className="text-sm text-slate-500">No farmer documents uploaded.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {uploadedDocuments.map((document: any, index: number) => {
                        const fileUrl = document?.fileUrl || "";
                        const fileType = document?.fileType || "";

                        return (
                          <div key={`${document?.fileName || "document"}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                            <p className="font-medium text-slate-900">{document?.label || "Uploaded document"}</p>
                            <p className="mt-1 text-sm text-slate-500">{document?.fileName || "Unnamed file"}</p>
                            {fileUrl && isImageAsset(fileUrl, fileType) && (
                              <img
                                src={fileUrl}
                                alt={document?.label || "Uploaded document"}
                                className="mt-3 h-40 w-full rounded-xl border object-cover"
                              />
                            )}
                            {fileUrl && isPdfAsset(fileUrl, fileType) && (
                              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                                PDF document ready for review
                              </div>
                            )}
                            {fileUrl ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                                >
                                  Open file
                                </a>
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-slate-500">File name is available for review, but this older record does not have a preview URL.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Farmer Uploaded Images</h3>
                <div className="rounded-xl border border-slate-200 p-4">
                  {uploadedImages.length === 0 ? (
                    <p className="text-sm text-slate-500">No image proof uploaded by the farmer.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {uploadedImages.map((imageUrl, index) => (
                        <a
                          key={`${selectedProject.id}-image-${index}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:shadow-sm"
                        >
                          <img
                            src={imageUrl}
                            alt={`${selectedProject.title} proof ${index + 1}`}
                            className="h-48 w-full object-cover"
                          />
                          <div className="border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
                            Farmer proof image {index + 1}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => selectedProject.id && handleReview(selectedProject.id, "approve")}
                  disabled={actionLoading === selectedProject.id || selectedProject.approvalStage === "APPROVED"}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === selectedProject.id ? "Saving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => selectedProject.id && handleReview(selectedProject.id, "reject")}
                  disabled={actionLoading === selectedProject.id || selectedProject.approvalStage === "REJECTED"}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === selectedProject.id ? "Saving..." : "Reject"}
                </button>
              </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { AdminProjectApproval };
