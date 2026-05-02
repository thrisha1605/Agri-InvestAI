import { authService } from "./auth";
import { fetchAllProjects, fetchMyInvestments } from "./appData";
import { isBackendSessionToken } from "./api";
import { fetchPartnerProfile } from "./partnerProfile";
import { getUserSipPlans, syncRoleSipPlansFromBackend } from "./roleSip";
import { syncWalletFromBackend } from "./wallet";

const BOOTSTRAP_TASK_TIMEOUT_MS = 4000;

function settleWithin<T>(task: Promise<T>, timeoutMs = BOOTSTRAP_TASK_TIMEOUT_MS): Promise<T | undefined> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(undefined), timeoutMs);

    task
      .then((value) => resolve(value))
      .catch(() => resolve(undefined))
      .finally(() => window.clearTimeout(timer));
  });
}

export async function bootstrapSessionData() {
  const user = authService.getCurrentUser();
  if (!user) {
    return;
  }

  const hasBackendSession = isBackendSessionToken(authService.getToken());
  const tasks: Array<Promise<unknown>> = [
    settleWithin(fetchAllProjects()),
  ];

  if (hasBackendSession) {
    tasks.push(settleWithin(syncWalletFromBackend(user)));
  }

  if (user.role === "INVESTOR" && hasBackendSession) {
    tasks.push(settleWithin(fetchMyInvestments(user.id)));
  }

  if (user.role === "AGRI_PARTNER") {
    tasks.push(settleWithin(fetchPartnerProfile(user.id)));
  }

  if (hasBackendSession && (user.role === "FARMER" || user.role === "INVESTOR" || user.role === "AGRI_PARTNER")) {
    tasks.push(settleWithin(syncRoleSipPlansFromBackend(user.id)));
  } else if (user.role === "FARMER" || user.role === "INVESTOR" || user.role === "AGRI_PARTNER") {
    getUserSipPlans(user.id);
  }

  await Promise.all(tasks);
}
