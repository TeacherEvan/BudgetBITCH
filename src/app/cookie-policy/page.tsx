import { LegalPage } from "@/components/legal/legal-page";
import { COOKIE_POLICY_VERSION } from "@/lib/legal/versions";

export default function CookiePolicyPage() {
  return <LegalPage doc="cookie" version={COOKIE_POLICY_VERSION} />;
}
