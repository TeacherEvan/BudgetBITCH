// Legal page copy. Stored as plain string data and rendered via JSX
// interpolation ({string}) so quotes/apostrophes never trigger JSX text
// quote-escaping lint failures. Bump versions in versions.ts when editing.
import { LEGAL_EFFECTIVE_DATE, type LegalLocale } from "./versions";

type Section = { heading: string; body: string[] };

type LegalDoc = {
  title: string;
  intro: string;
  sections: Section[];
};

export const termsContent: Record<LegalLocale, LegalDoc> = {
  en: {
    title: "Terms of Service",
    intro:
      "Budget-BOSS is a personal budgeting tool. By creating an account you agree to use the app for your own household finances. You are responsible for the accuracy of the data you enter.",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: [
          "By signing up or using Budget-BOSS you agree to these Terms and our Privacy Policy. If you do not agree, do not use the app.",
        ],
      },
      {
        heading: "2. The Service",
        body: [
          "Budget-BOSS helps you track income, expenses, savings, and net worth on your own device. We provide estimates and projections for guidance only; they are not financial, legal, or tax advice.",
          "We do not guarantee any specific financial outcome. You make the final decision on every transaction.",
        ],
      },
      {
        heading: "3. Accounts and Data",
        body: [
          "You are responsible for keeping your password safe. Your budget data is stored locally on your device and, if you enable sync, mirrored to our servers under your account.",
          "We may delete inactive accounts after prolonged inactivity. You can export or delete your data at any time from Settings.",
        ],
      },
      {
        heading: "4. Acceptable Use",
        body: [
          "Do not use the app for unlawful activity, to infringe others' rights, or to abuse the service. We may suspend accounts that violate these Terms.",
        ],
      },
      {
        heading: "5. Limitation of Liability",
        body: [
          "The app is provided as-is, without warranty. To the maximum extent permitted by law, Budget-BOSS is not liable for any loss arising from your use of the app or reliance on its calculations.",
        ],
      },
      {
        heading: "6. Changes to Terms",
        body: [
          "We may update these Terms. We will show the new version number at sign-up and on this page. Continued use after a change means you accept the updated Terms.",
        ],
      },
      {
        heading: "7. Governing Law",
        body: [
          "These Terms are governed by the laws of Thailand, without regard to conflict-of-law rules. Disputes are resolved in the courts of Bangkok, Thailand.",
        ],
      },
      {
        heading: "8. AI Features and Accuracy",
        body: [
          "Budget-BOSS includes AI-assisted features. The receipt scanner sends your receipt photo to Google's Gemini AI (a third-party service) to read the merchant, amount, date, and category. AI may misread; you must review and correct the result before saving.",
          "Market Watch shows headlines aggregated from independent third-party news publishers (such as Bangkok Post and Reuters) and may display automated, generic suggestions derived from those headlines. These are not our opinions and are not financial advice.",
          "We are not responsible for errors in AI-generated or aggregated content. You remain responsible for every transaction you record.",
        ],
      },
      {
        heading: "9. Contact",
        body: [
          "Questions about these Terms? Email legal@budgetbitch.app.",
        ],
      },
    ],
  },
};

export const privacyContent: Record<LegalLocale, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    intro:
      "Your financial data is yours. This policy explains what we collect, why, how we protect it, and the rights you have under the PDPA (Thailand) B.E. 2562, which is actively enforced in 2026.",
    sections: [
      {
        heading: "1. What We Collect",
        body: [
          "Account: your email address and a hashed password. We never see your plain password.",
          "Budget data: income, expenses, budgets, goals, and net worth you enter. Stored locally and, if sync is enabled, on our servers under your account.",
          "Device metadata: IP address and browser user-agent may be recorded when you accept our Terms, for audit purposes only.",
          "We do not collect special-category data (health, religion, biometrics, etc.). If you enter such detail in free-text notes, it is treated as ordinary personal data under your control.",
        ],
      },
      {
        heading: "2. What We Do NOT Do",
        body: [
          "We do not sell your data. We do not share it with third parties for marketing. We do not run advertising trackers inside the app.",
          "We are not a data broker and we do not build advertising profiles from your finances.",
        ],
      },
      {
        heading: "3. Legal Basis (PDPA B.E. 2562)",
        body: [
          "We process your personal data on the legal bases of contract (to provide the service you signed up for), consent (for optional cookies and analytics), and legitimate interests (to secure and improve the service).",
          "You may withdraw consent at any time without affecting processing that already occurred.",
        ],
      },
      {
        heading: "4. Your Rights",
        body: [
          "Under the PDPA you have the right to be informed, to access, to rectify, to erase, to restrict processing, to object, to data portability, and to withdraw consent. You may also lodge a complaint with the Personal Data Protection Committee (PDPC).",
          "Exercise any of these from Settings (export/delete) or by emailing legal@budgetbitch.app. We respond within a reasonable time and at no charge, except where a request is manifestly unfounded or excessive.",
          "You may delete your account and all associated data at any time; we honor the request subject to any legal retention obligation.",
        ],
      },
      {
        heading: "5. Security & How We Protect Your Data",
        body: [
          "Passwords are hashed; we never store or transmit your plain password. Sign-in uses short-lived tokens over encrypted connections.",
          "Data is encrypted in transit using HTTPS/TLS. Where technically feasible we encrypt data at rest on our servers.",
          "Access to personal data is on a least-privilege basis: only the automated service and you can read your records. We do not grant broad staff access to user finances.",
          "We keep our dependencies patched and monitor for abuse. No security is absolute, so we also keep an incident-response process ready (see section 7).",
        ],
      },
      {
        heading: "6. Data Minimization & Purpose Limitation",
        body: [
          "We collect only what we need to run the app. We do not repurpose your data for unrelated uses.",
          "Budget data is local-first: it stays on your device unless you enable sync. Optional cookies and analytics are off until you accept them.",
        ],
      },
      {
        heading: "7. Data Breach Notification",
        body: [
          "If a personal data breach occurs, we will notify the PDPC without undue delay and, where required, within 72 hours of becoming aware, as mandated by the PDPA B.E. 2562, using a standardized breach report.",
          "Affected users will be informed without undue delay where the breach is likely to result in a risk to their rights and freedoms, and we will advise steps you can take to protect yourself.",
        ],
      },
      {
        heading: "8. Cross-Border Transfer",
        body: [
          "Server infrastructure may be located outside Thailand. Where we transfer personal data across borders, we rely on appropriate safeguards or your explicit consent, in line with the PDPA.",
        ],
      },
      {
        heading: "9. Retention",
        body: [
          "We keep your data for as long as your account is active or as needed to provide the service. After account deletion we remove personal data within a reasonable period, subject to legal holds.",
          "We periodically review what we retain and delete data we no longer need.",
        ],
      },
      {
        heading: "10. Third-Party Services",
        body: [
          "Receipt scanning: when you use the receipt scanner, your receipt image is transmitted to Google LLC's Gemini AI service for optical character recognition. Google processes the image to extract text; we receive only the parsed merchant, amount, date, and category. This processing is covered by Google's own privacy terms.",
          "Market Watch: headlines are fetched from independent third-party news publishers (Bangkok Post, Reuters, Thai PBS, PPTV, and others) over their public feeds. We do not control their content and link out to their sites.",
          "We do not sell or share your personal data with these providers beyond what each feature requires to function.",
        ],
      },
      {
        heading: "11. Contact",
        body: [
          "Data protection questions: legal@budgetbitch.app.",
        ],
      },
    ],
  },
};

export const cookieContent: Record<LegalLocale, LegalDoc> = {
  en: {
    title: "Cookie Policy",
    intro:
      "Budget-BOSS uses a small number of cookies and local storage values to keep the app working and to remember your preferences.",
    sections: [
      {
        heading: "1. Essential Cookies",
        body: [
          "These are required for the app to function: keeping you signed in, remembering your language, and storing your budget data on your device. They cannot be turned off.",
        ],
      },
      {
        heading: "2. Optional Cookies",
        body: [
          "If you accept, we store anonymous usage information (such as which screens you open) to help us improve the app. This is never sold or used for advertising. You can decline optional cookies and the app still works fully.",
        ],
      },
      {
        heading: "3. Managing Cookies",
        body: [
          "Your choice is saved on your device. You can change or withdraw it any time from the cookie banner or Settings. Clearing your browser storage resets the choice.",
        ],
      },
      {
        heading: "4. Contact",
        body: [
          "Questions: legal@budgetbitch.app.",
        ],
      },
    ],
  },
};

export { LEGAL_EFFECTIVE_DATE };
