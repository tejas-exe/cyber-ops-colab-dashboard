import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchUserMeta,
  fetchWorkspaces,
  fetchWorkspaceDetails,
  createWorkspace,
  inviteMember,
  removeMember,
  saveAnalysis,
  analyzeLog,
  type CVEItem,
  type Workspace,
} from "../api/workspace.api";

// ── Query Keys ──────────────────────────────────────────────────────────────

export const queryKeys = {
  user: ["user"] as const,
  workspaces: ["workspaces"] as const,
  workspace: (id: string) => ["workspace", id] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch authenticated user's profile */
export function useUserMeta(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: fetchUserMeta,
    enabled,
    retry: false,
  });
}

/** Fetch all workspaces for the current user */
export function useWorkspaces(enabled = true) {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: fetchWorkspaces,
    enabled,
  });
}

/** Fetch detailed workspace data (members + analyses) */
export function useWorkspaceDetails(workspaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspace(workspaceId ?? ""),
    queryFn: () => fetchWorkspaceDetails(workspaceId!),
    enabled: !!workspaceId,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new workspace */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createWorkspace(name),
    onSuccess: (newWs: Workspace) => {
      // Prepend to cached list immediately (optimistic-ish)
      queryClient.setQueryData<Workspace[]>(queryKeys.workspaces, (old = []) => [newWs, ...old]);
    },
  });
}

/** Invite a member to a workspace */
export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => inviteMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    },
  });
}

/** Remove a member from a workspace */
export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMember(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    },
  });
}

/** Run log analysis and persist result to workspace */
export function useAnalyzeLog(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<CVEItem[]> => {
      const text = await file.text();
      const result = await analyzeLog(text);
      if (workspaceId) {
        await saveAnalysis(workspaceId, result);
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
      }
      return result;
    },
  });
}
