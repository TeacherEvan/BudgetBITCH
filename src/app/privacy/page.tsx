import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY_VERSION } from "@/lib/legal/versions";

export default function PrivacyPage() {
  return <LegalPage doc="privacy" version={PRIVACY_VERSION} />;
}
