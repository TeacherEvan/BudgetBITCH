export type InstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

export type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallPromptChoice>;
};

type InstallPromptListener = () => void;

let installPrompt: DeferredInstallPrompt | null = null;
const listeners = new Set<InstallPromptListener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getInstallPromptSnapshot() {
  return installPrompt;
}

export function subscribeToInstallPrompt(listener: InstallPromptListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function storeInstallPrompt(promptEvent: DeferredInstallPrompt) {
  installPrompt = promptEvent;
  notifyListeners();
}

export function clearInstallPrompt() {
  installPrompt = null;
  notifyListeners();
}

export async function promptToInstall() {
  if (!installPrompt) {
    return false;
  }

  const nextPrompt = installPrompt;
  clearInstallPrompt();
  await nextPrompt.prompt();

  try {
    await nextPrompt.userChoice;
  } catch {
    return true;
  }

  return true;
}

export function resetInstallPromptForTesting() {
  clearInstallPrompt();
}