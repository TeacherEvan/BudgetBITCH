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
  th: {
    title: "ข้อกำหนดการให้บริการ",
    intro:
      "Budget-BOSS คือเครื่องมือจัดการงบประมาณส่วนบุคคล เมื่อคุณสร้างบัญชี ถือว่าคุณตกลงใช้แอปสำหรับการเงินครัวเรือนของตนเอง คุณเป็นผู้รับผิดชอบต่อความถูกต้องของข้อมูลที่คุณกรอก",
    sections: [
      {
        heading: "1. การยอมรับข้อกำหนด",
        body: [
          "การสมัครหรือใช้ Budget-BOSS ถือว่าคุณยอมรับข้อกำหนดนี้และนโยบายความเป็นส่วนตัวของเรา หากไม่ยอมรับ กรุณาอย่าใช้แอป",
        ],
      },
      {
        heading: "2. บริการ",
        body: [
          "Budget-BOSS ช่วยให้คุณติดตามรายได้ รายจ่าย การออม และสินทรัพย์สุทธิบนอุปกรณ์ของคุณเอง เราให้ค่าประมาณและการคาดการณ์เพื่อเป็นแนวทางเท่านั้น ไม่ใช่คำแนะนำทางการเงิน กฎหมาย หรือภาษี",
          "เราไม่รับประกันผลลัพธ์ทางการเงินใด ๆ คุณเป็นผู้ตัดสินใจสุดท้ายในทุกธุรกรรม",
        ],
      },
      {
        heading: "3. บัญชีและข้อมูล",
        body: [
          "คุณมีหน้าที่รักษาความปลอดภัยของรหัสผ่าน ข้อมูลงบประมาณจัดเก็บในอุปกรณ์ของคุณ และหากคุณเปิดการซิงค์ จะถูกสะท้อนไปยังเซิร์ฟเวอร์ของเราภายใต้บัญชีของคุณ",
          "เราอาจลบบัญชีที่ไม่ได้ใช้งานเป็นเวลานานได้ คุณสามารถส่งออกหรือลบข้อมูลของคุณได้ตลอดเวลาผ่านหน้าตั้งค่า",
        ],
      },
      {
        heading: "4. การใช้งานที่เหมาะสม",
        body: [
          "กรุณาอย่าใช้แอปเพื่อกิจกรรมที่ผิดกฎหมาย หรือละเมิดสิทธิผู้อื่น หรือ滥用 บริการ เราอาจระงับบัญชีที่ฝ่าฝืนข้อกำหนดนี้",
        ],
      },
      {
        heading: "5. ข้อจำกัดความรับผิด",
        body: [
          "แอปให้บริการตามสภาพที่เป็นจริง โดยไม่มีการรับประกัน ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต Budget-BOSS ไม่รับผิดชอบต่อความสูญเสียใด ๆ ที่เกิดจากการใช้แอปหรือการพึ่งพาการคำนวณของแอป",
        ],
      },
      {
        heading: "6. การเปลี่ยนแปลงข้อกำหนด",
        body: [
          "เราอาจปรับปรุงข้อกำหนดนี้ เราจะแสดงหมายเลขเวอร์ชันใหม่ที่หน้าสมัครและในหน้านี้ การใช้งานต่อหลังมีการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดที่ปรับปรุงแล้ว",
        ],
      },
      {
        heading: "7. กฎหมายที่ใช้บังคับ",
        body: [
          "ข้อกำหนดนี้อยู่ภายใต้กฎหมายของประเทศไทย โดยไม่คำนึงถึงกฎขัดแย้งทางกฎหมาย ข้อพิพาทจะได้รับการแก้ไขที่ศาลในกรุงเทพมหานคร ประเทศไทย",
        ],
      },
      {
        heading: "8. ฟีเจอร์ AI และความถูกต้อง",
        body: [
          "Budget-BOSS มีฟีเจอร์ที่ใช้ AI ช่วย เครื่องสแกนใบเสร็จจะส่งรูปใบเสร็จของคุณไปยัง Google Gemini AI (บริการของบุคคลที่สาม) เพื่ออ่านชื่อร้าน จำนวนเงิน วันที่ และหมวดหมู่ AI อาจอ่านผิดได้ คุณต้องตรวจสอบและแก้ไขผลลัพธ์ก่อนบันทึก",
          "Market Watch แสดงข่าวจากสำนักข่าวอิสระบุคคลที่สาม (เช่น Bangkok Post และ Reuters) และอาจแสดงคำแนะนำทั่วไปอัตโนมัติที่ได้จากหัวข้อข่าวเหล่านั้น สิ่งเหล่านี้ไม่ใช่ความเห็นของเรา และไม่ใช่คำแนะนำทางการเงิน",
          "เราไม่รับผิดชอบต่อข้อผิดพลาดในเนื้อหาที่สร้างโดย AI หรือที่รวบรวมมา คุณยังคงรับผิดชอบต่อทุกธุรกรรมที่คุณบันทึก",
        ],
      },
      {
        heading: "9. ติดต่อ",
        body: [
          "มีคำถามเกี่ยวกับข้อกำหนดนี้? อีเมลมาที่ legal@budgetbitch.app",
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
        heading: "11. Third-Party Services",
        body: [
          "Receipt scanning: when you use the receipt scanner, your receipt image is transmitted to Google LLC's Gemini AI service for optical character recognition. Google processes the image to extract text; we receive only the parsed merchant, amount, date, and category. This processing is covered by Google's own privacy terms.",
          "Market Watch: headlines are fetched from independent third-party news publishers (Bangkok Post, Reuters, Thai PBS, PPTV, and others) over their public feeds. We do not control their content and link out to their sites.",
          "We do not sell or share your personal data with these providers beyond what each feature requires to function.",
        ],
      },
      {
        heading: "12. Contact",
        body: [
          "Data protection questions: legal@budgetbitch.app.",
        ],
      },
    ],
  },
  th: {
    title: "นโยบายความเป็นส่วนตัว",
    intro:
      "ข้อมูลการเงินของคุณเป็นของคุณ นโยบายนี้อธิบายว่าข้อมูลใดที่เราเก็บ เหตุผล วิธีที่เราปกป้อง และสิทธิของคุณภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ซึ่งมีการบังคับใช้จริงในปี 2026",
    sections: [
      {
        heading: "1. สิ่งที่เราเก็บรวบรวม",
        body: [
          "บัญชี: ที่อยู่อีเมลของคุณ และรหัสผ่านที่ถูกแฮช เราไม่เห็นรหัสผ่านดิบของคุณ",
          "ข้อมูลงบประมาณ: รายได้ รายจ่าย งบประมาณ เป้าหมาย และสินทรัพย์สุทธิที่คุณกรอก จัดเก็บในเครื่อง และหากเปิดซิงค์ จะอยู่บนเซิร์ฟเวอร์ของเราภายใต้บัญชีของคุณ",
          "ข้อมูลอุปกรณ์: ที่อยู่ IP และ user-agent ของเบราว์เซอร์ อาจถูกบันทึกเมื่อคุณยอมรับข้อกำหนด เพื่อวัตถุประสงค์ในการตรวจสอบเท่านั้น",
          "เราไม่เก็บข้อมูลประเภทพิเศษ (สุขภาพ ศาสนา ชีวมิติ ฯลฯ) หากคุณกรอกรายละเอียดดังกล่าวในบันทึกข้อความอิสระ จะถูกจัดเป็นข้อมูลส่วนบุคคลทั่วไปภายใต้การควบคุมของคุณ",
        ],
      },
      {
        heading: "2. สิ่งที่เราไม่ทำ",
        body: [
          "เราไม่ขายข้อมูลของคุณ เราไม่แบ่งปันกับบุคคลที่สามเพื่อการตลาด เราไม่มีตัวติดตามโฆษณาภายในแอป",
          "เราไม่ใช้นายหน้าข้อมูล และไม่สร้างโปรไฟล์โฆษณาจากการเงินของคุณ",
        ],
      },
      {
        heading: "3. ฐานทางกฎหมาย (พ.ร.บ. 2562)",
        body: [
          "เราประมวลผลข้อมูลส่วนบุคคลบนฐานทางกฎหมายของสัญญา (เพื่อให้บริการที่คุณสมัครใช้) ความยินยอม (สำหรับคุกกี้และการวิเคราะห์แบบเลือกได้) และผลประโยชน์โดยชอบธรรม (เพื่อความปลอดภัยและการปรับปรุงบริการ)",
          "คุณสามารถถอนความยินยอมได้ตลอดเวลา โดยไม่กระทบการประมวลผลที่เกิดขึ้นแล้ว",
        ],
      },
      {
        heading: "4. สิทธิของคุณ",
        body: [
          "ภายใต้ พ.ร.บ. คุณมีสิทธิได้รับการแจ้งให้ทราบ เข้าถึง แก้ไข ลบ จำกัดการประมวลผล คัดค้าน นำข้อมูลไปใช้ต่อ และถอนความยินยอม รวมถึงร้องเรียนต่อคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (PDPC)",
          "ใช้สิทธิใดก็ได้ผ่านหน้าตั้งค่า (ส่งออก/ลบ) หรืออีเมลมาที่ legal@budgetbitch.app เราตอบกลับภายในเวลาอันสมเหตุสมผล โดยไม่คิดค่าใช้จ่าย เว้นแต่คำขอจะไร้สาระหรือเกินควร",
          "คุณสามารถลบบัญชีและข้อมูลทั้งหมดได้ตลอดเวลา เราจะดำเนินการตามคำขอภายใต้ข้อผูกพันการเก็บรักษาตามกฎหมาย",
        ],
      },
      {
        heading: "5. ความปลอดภัยและวิธีที่เราปกป้องข้อมูลของคุณ",
        body: [
          "รหัสผ่านถูกแฮช เราไม่เก็บหรือส่งรหัสผ่านดิบของคุณ การเข้าสู่ระบบใช้โทเค็นอายุสั้นผ่านการเชื่อมต่อที่เข้ารหัส",
          "ข้อมูลถูกเข้ารหัสขณะส่งผ่านด้วย HTTPS/TLS และเมื่อเป็นไปได้ทางเทคนิค เราเข้ารหัสข้อมูลขณะจัดเก็บบนเซิร์ฟเวอร์ของเรา",
          "การเข้าถึงข้อมูลส่วนบุคคลเป็นไปตามหลักสิทธิน้อยที่สุด: เฉพาะบริการอัตโนมัติและคุณเท่านั้นที่อ่านบันทึกของคุณได้ เราไม่เปิดการเข้าถึงกว้างให้เจ้าหน้าที่ต่อการเงินของผู้ใช้",
          "เรอัปเดตส่วนประกอบที่ใช้อย่างสม่ำเสมอและตรวจสอบการละเมิด ไม่มีความปลอดภัยใดสมบูรณ์ เราจึงเตรียมกระบวนการตอบสนองเหตุระดับไว้ด้วย (ดูข้อ 7)",
        ],
      },
      {
        heading: "6. การลดข้อมูลให้น้อยที่สุดและข้อจำกัดวัตถุประสงค์",
        body: [
          "เราเก็บรวบรวมเฉพาะสิ่งที่จำเป็นเพื่อให้แอปทำงาน เราไม่นำข้อมูลของคุณไปใช้ซ้ำเพื่อวัตถุประสงค์อื่น",
          "ข้อมูลงบประมาณเน้นในเครื่องก่อน: อยู่ในอุปกรณ์ของคุณจนกว่าคุณจะเปิดซิงค์ คุกกี้และการวิเคราะห์แบบเลือกได้จะปิดจนกว่าคุณจะยอมรับ",
        ],
      },
      {
        heading: "7. การแจ้งเหตุละเมิดข้อมูล",
        body: [
          "หากเกิดเหตุละเมิดข้อมูลส่วนบุคคล เราจะแจ้งคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลโดยไม่ชักช้า และในกรณีที่กฎหมายกำหนด ภายใน 72 ชั่วโมงนับแต่ทราบเหตุ ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 โดยใช้รายงานเหตุละเมิดมาตรฐาน",
          "ผู้ใช้ที่ได้รับผลกระทบจะได้รับแจ้งโดยไม่ชักช้าเมื่อเหตุละเมิดมีแนวโน้มก่อความเสี่ยงต่อสิทธิและเสรีภาพของตน และเราจะแนะนำขั้นตอนที่คุณสามารถทำได้เพื่อปกป้องตนเอง",
        ],
      },
      {
        heading: "8. การโอนข้อมูลข้ามพรมแดน",
        body: [
          "โครงสร้างเซิร์ฟเวอร์อาจตั้งอยู่นอกประเทศไทย เมื่อเราโอนข้อมูลข้ามพรมแดน เราจะพึ่งพามาตรการป้องกันที่เหมาะสมหรือความยินยอมโดยชัดแจ้งของคุณ ตาม พ.ร.บ.",
        ],
      },
      {
        heading: "9. การเก็บรักษา",
        body: [
          "เราเก็บข้อมูลของคุณตราบเท่าที่บัญชียังใช้งานอยู่ หรือเท่าที่จำเป็นเพื่อให้บริการ หลังการลบบัญชี เราจะลบข้อมูลส่วนบุคคลภายในระยะเวลาอันสมเหตุสมผล ภายใต้ข้อผูกพันทางกฎหมาย",
          "เราทบทวนเป็นระยะว่าข้อมูลใดที่เราเก็บรักษา และลบข้อมูลที่เราไม่จำเป็นต้องใช้แล้ว",
        ],
      },
      {
        heading: "11. บริการบุคคลที่สาม",
        body: [
          "การสแกนใบเสร็จ: เมื่อคุณใช้เครื่องสแกนใบเสร็จ รูปใบเสร็จของคุณจะถูกส่งไปยังบริการ Google Gemini AI ของ Google LLC เพื่อการจดจำตัวอักษร (OCR) Google ประมวลผลรูปเพื่อดึงข้อความ เราได้รับเฉพาะร้าน จำนวนเงิน วันที่ และหมวดหมู่ที่แยกได้ การประมวลผลนี้อยู่ภายใต้เงื่อนไขความเป็นส่วนตัวของ Google",
          "Market Watch: หัวข้อข่าวถูกดึงจากสำนักข่าวอิสระบุคคลที่สาม (Bangkok Post, Reuters, Thai PBS, PPTV และอื่น ๆ) ผ่านฟีดสาธารณะ เราไม่ควบคุมเนื้อหาของพวกเขา และมีลิงก์ไปยังเว็บไซต์ของตน",
          "เราไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลของคุณกับผู้ให้บริการเหล่านี้ นอกเหนือจากที่ฟีเจอร์แต่ละตัวต้องการเพื่อทำงาน",
        ],
      },
      {
        heading: "12. ติดต่อ",
        body: [
          "คำถามเรื่องการคุ้มครองข้อมูล: legal@budgetbitch.app",
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
  th: {
    title: "นโยบายคุกกี้",
    intro:
      "Budget-BOSS ใช้คุกกี้และค่าการจัดเก็บในเครื่องจำนวนน้อย เพื่อให้แอปทำงานได้และจดจำความต้องการของคุณ",
    sections: [
      {
        heading: "1. คุกกี้ที่จำเป็น",
        body: [
          "สิ่งเหล่านี้จำเป็นสำหรับการทำงานของแอป: คงสถานะการเข้าสู่ระบบ จดจำภาษาของคุณ และจัดเก็บข้อมูลงบประมาณในอุปกรณ์ของคุณ ไม่สามารถปิดได้",
        ],
      },
      {
        heading: "2. คุกกี้แบบเลือกได้",
        body: [
          "หากคุณยอมรับ เราจะจัดเก็บข้อมูลการใช้งานแบบไม่ระบุตัวตน (เช่น หน้าจอใดที่คุณเปิด) เพื่อช่วยปรับปรุงแอป ไม่มีการขายหรือนำไปใช้ทางโฆษณาเลย คุณสามารถปฏิเสธคุกกี้แบบเลือกได้โดยที่แอปยังทำงานได้เต็มรูปแบบ",
        ],
      },
      {
        heading: "3. การจัดการคุกกี้",
        body: [
          "ตัวเลือกของคุณถูกบันทึกในอุปกรณ์ คุณสามารถเปลี่ยนหรือถอนได้ตลอดเวลาผ่านแบนเนอร์คุกกี้หรือหน้าตั้งค่า การลบการจัดเก็บของเบราว์เซอร์จะรีเซ็ตตัวเลือก",
        ],
      },
      {
        heading: "4. ติดต่อ",
        body: [
          "คำถาม: legal@budgetbitch.app",
        ],
      },
    ],
  },
};

export { LEGAL_EFFECTIVE_DATE };
