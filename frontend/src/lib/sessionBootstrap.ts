import { authService } from "./auth";
import { fetchAllProjects, fetchMyInvestments } from "./appData";
import { fetchPartnerProfile } from "./partnerProfile";
import { syncRoleSipPlansFromBackend } from "./roleSip";
import { syncWalletFromBackend } from "./wallet";

export async function bootstrapSessionData() {
  const user = authService.getCurrentUser();
  if (!user) {
    return;
  }

  const tasks: Array<Promise<unknown>> = [
    fetchAllProjects().catch(() => undefined),
  ];

  const token = authService.getToken();
  if (token) {
    tasks.push(syncWalletFromBackend(user).catch(() => undefined));
  }

  if (user.role === "INVESTOR") {
    tasks.push(fetchMyInvestments(user.id).catch(() => undefined));
  }

  if (user.role === "AGRI_PARTNER") {
    tasks.push(fetchPartnerProfile(user.id).catch(() => undefined));
  }

  if (user.role === "FARMER" || user.role === "INVESTOR" || user.role === "AGRI_PARTNER") {
    tasks.push(syncRoleSipPlansFromBackend(user.id).catch(() => undefined));
  }

  await Promise.all(tasks);
}
