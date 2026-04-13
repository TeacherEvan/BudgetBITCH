import { StartSmartShell } from "@/components/start-smart/start-smart-shell";
import { getCurrentWorkspaceAccess } from "@/lib/auth/workspace-access";

export default async function StartSmartPage() {
  const workspaceAccess = await getCurrentWorkspaceAccess();

  return <StartSmartShell workspaceId={workspaceAccess.allowed ? workspaceAccess.workspaceId : null} />;
}