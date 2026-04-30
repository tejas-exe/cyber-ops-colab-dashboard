import { ApiService } from "./api.service";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceMember {
  id: string;
  userId: string;
  user: { name: string; email: string };
}

export interface WorkspaceAnalysis {
  id: string;
  createdAt: string;
  response: CVEItem[];
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  createdById: string;
  members?: WorkspaceMember[];
  analyses?: WorkspaceAnalysis[];
  _count?: { analyses: number };
}

export interface UserMeta {
  id: string;
  name: string;
  email: string;
}

export interface CVEItem {
  cve: string;
  description: string;
  cvss: number;
  epss: number;
  risk: number;
  riskLevel: "critical" | "high" | "medium" | "low";
}

// ── Shared API client ────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("accessToken");

export const apiClient = new ApiService(
  (import.meta as ImportMeta).env.VITE_API_BASE_URL || "http://localhost:3000",
  10_000,
  {},
  getToken
);

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /auth/me */
export async function fetchUserMeta(): Promise<UserMeta> {
  const res = await apiClient.get<UserMeta>("/auth/me");
  return res.data;
}

/** GET /workspace */
export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await apiClient.get<Workspace[]>("/workspace");
  return res.data;
}

/** GET /workspace/:id */
export async function fetchWorkspaceDetails(workspaceId: string): Promise<Workspace> {
  const res = await apiClient.get<Workspace>(`/workspace/${workspaceId}`);
  return res.data;
}

/** POST /workspace */
export async function createWorkspace(name: string): Promise<Workspace> {
  const res = await apiClient.post<Workspace>("/workspace", { name });
  return res.data;
}

/** POST /workspace/:id/invite */
export async function inviteMember(workspaceId: string, userId: string): Promise<void> {
  await apiClient.post(`/workspace/${workspaceId}/invite`, { userId });
}

/** DELETE /workspace/:id/member/:memberId */
export async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/workspace/${workspaceId}/member/${memberId}`);
}

/** POST /log-analysis */
export async function analyzeLog(logText: string): Promise<CVEItem[]> {
  const res = await apiClient.post<{ data: CVEItem[] }>("/log-analysis", { logs: logText });

  return (res.data.data || []).map((item) => {
    const cvss = Number(item.cvss) || 0;
    const epss = Number(item.epss) || 0;
    const risk = Number(item.risk) || 0;

    let riskLevel: CVEItem["riskLevel"] = "low";
    if (risk > 6.0 || cvss > 8.0) riskLevel = "critical";
    else if (risk > 4.5 || cvss > 6.0) riskLevel = "high";
    else if (risk > 2.5 || cvss > 3.0) riskLevel = "medium";

    return { ...item, cvss, epss, risk, riskLevel };
  });
}

/** POST /workspace/:id/analyses */
export async function saveAnalysis(workspaceId: string, data: CVEItem[]): Promise<void> {
  await apiClient.post(`/workspace/${workspaceId}/analyses`, { response: data });
}
