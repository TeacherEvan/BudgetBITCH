import { LegalPage } from "@/components/legal/legal-page";
import { TERMS_VERSION } from "@/lib/legal/versions";

export default function TermsPage() {
  return <LegalPage doc="terms" version={TERMS_VERSION} />;
}
