export const localeCookieName = "bb-locale";
export const defaultLocale = "en-ZA";
export const supportedLocales = ["en-ZA", "en-TH", "th", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export function resolveLocale(candidate: string | null | undefined): AppLocale {
  if (!candidate) {
    return defaultLocale;
  }

  if (supportedLocales.includes(candidate as AppLocale)) {
    return candidate as AppLocale;
  }

  // Any English variant falls back to South African English (primary locale)
  if (candidate.startsWith("en")) {
    return "en-ZA";
  }

  return defaultLocale;
}

export const localeMessages = {
  en: {
    appNav: {
      mobileNavigation: "Mobile app navigation",
      desktopNavigation: "App navigation",
      openDashboard: "Go to dashboard",
      routes: {
        dashboard: "Dashboard",
        startSmart: "Start Smart",
        calculator: "Calculator",
        notes: "Notes",
        learn: "Learn",
        integrations: "Integrations",
        jobs: "Jobs",
      },
    },
    accounts: {
      navLabel: "Accounts",
      title: "Accounts",
      subtitle: "Run up to 5 independent budgets — family, business, school and more.",
      createTitle: "Create an account",
      umbrellaLabel: "Type",
      nameLabel: "Account name",
      namePlaceholder: "e.g. Our Household",
      create: "Create account",
      cancel: "Cancel",
      maxReached: "You already have 5 accounts. Delete one to make room.",
      umbrella: {
        family: "Family",
        couple: "Couple",
        business: "Business",
        school: "School",
        friends: "Friends",
        charity: "Charity",
        shopping: "Shopping",
      },
      defaultName: {
        family: "Our Household",
        couple: "Our Couple",
        business: "Business Books",
        school: "School Fund",
        friends: "Friends Circle",
        charity: "Charity Drive",
        shopping: "Shopping List",
      },
      invite: "Invite",
      inviteByCode: "Invite by share code",
      shareCodePlaceholder: "Paste a friend's share code",
      inviteLink: "Invite link",
      inviteQR: "QR code",
      copyLink: "Copy link",
      copyCode: "Copy code",
      rotateCode: "Rotate invite code",
      members: "Members",
      leave: "Leave account",
      removeMember: "Remove",
      delete: "Delete account",
      acceptInvite: "Accept",
      declineInvite: "Decline",
      pendingInvites: "Pending invites",
      switchTo: "Open",
      role: {
        owner: "Owner",
        member: "Member",
      },
      joinTitle: "Join an account",
      joinPrompt: "Scan a QR code or open the invite link to join.",
      joined: "You joined",
      invalidCode: "That invite code is not valid.",
    },
    localeSwitcher: {
      label: "Language",
      options: {
        en: "English",
        th: "ไทย",
      },
    },
    welcome: {
      brand: "Budget-BOSS",
      heading: "Open your Budget-BOSS board",
      description:
        "Sign in to unlock your root flow. After that, Budget-BOSS can send you into the one-time startup questionnaire or straight to the landing board based on your saved startup progress.",
      openSignIn: "Open sign in",
      openSignUp: "Open sign-up",
      privacyPromise: "Private by default. Setup only if needed.",
      quickReasonsAria: "Welcome quick reasons",
      quickReasons: {
        signInFirst: {
          title: "Sign in first",
          description:
            "Open your account before the app decides whether you need setup or your landing board.",
        },
        keepItShort: {
          title: "Keep the first step short",
          description:
            "The startup questionnaire only appears after sign-in and only when your first-run progress is still incomplete.",
        },
        moveWithoutSprawl: {
          title: "Move without the sprawl",
          description:
            "Budget-BOSS keeps the entry path dense, readable, and ready for quick scanning on smaller screens.",
        },
      },
      rootFlow: "Root flow",
      authFirstThenSetup: "Auth first, then setup",
      rootFlowDescription:
        "Signed-out visitors stay on this welcome window. Signed-in visitors move into the startup questionnaire only when first-run setup still needs to be completed.",
      whatChangesNext: "What changes next",
      nextSteps: {
        signIn: "Sign in when you already have an account.",
        signUp: "Sign up when you need a fresh account before setup begins.",
        finishWizard:
          "Finish the startup questionnaire once, then return to the landing board on future visits.",
      },
    },
    launchWizard: {
      kicker: "Startup questionnaire",
      title: "Ballpark expenses",
      description:
        "Add rough recurring costs first so Budget-BOSS can open with a practical money baseline instead of a blank board.",
      topCategoriesTitle: "Common expense titles",
      entryLabel: "Expense title",
      entryPlaceholder: "Search or select a common expense",
      customTitleLabel: "Custom expense title",
      customTitlePlaceholder: "Use this when the list does not fit",
      amountLabel: "Rough monthly amount",
      addExpense: "Add expense",
      finish: "Finish startup",
      summaryTitle: "Ballpark entries",
      emptySummary: "No expenses added yet.",
      helperTitle: "Why this comes first",
      helperDescription:
        "This first popup stays lightweight: rough categories, rough amounts, then the normal app flow.",
      currentCountLabel: "Saved categories",
      errors: {
        titleRequired: "Choose a common expense title or enter a custom one.",
        amountRequired: "Enter a rough monthly amount greater than zero.",
        atLeastOne: "Add at least one ballpark expense before finishing startup.",
        saveFailed: "Unable to save startup settings in this browser.",
      },
      categories: {
        rentMortgage: "Rent or mortgage",
        groceries: "Groceries",
        utilities: "Utilities",
        transportFuel: "Transport or fuel",
        phoneInternet: "Phone or internet",
        insurance: "Insurance",
        debtPayments: "Debt payments",
        healthcare: "Healthcare",
        childcareFamilySupport: "Childcare or family support",
        funEntertainment: "Fun or entertainment",
      },
    },
    authPanel: {
      secureAccess: "Secure access",
      useGoogleToStart: "Create your account",
      useGoogleToContinue: "Use your account",
      googleOnly: "Convex Auth creates and protects Budget-BOSS accounts.",
      secureSignIn: "Use your email and password to open the same account on any device.",
      gmailPrivacy: "No Google OAuth client or user-managed env file is required for login.",
      minimalData:
        "Budget-BOSS keeps only the minimal account, workspace, preference, and integration data it needs to run.",
      whyThisStepExists: "Why this step exists",
      localProfileFirst: "Local profile first",
      localProfileDescription:
        "Budget-BOSS verifies the Convex Auth account, then creates your local profile, personal workspace, and default workspace preference once so the app can load the right data shape on the server.",
    },
    signIn: {
      eyebrow: "Sign in",
      title: "Open your budget board",
      description:
        "Use your Budget-BOSS account, then let the app finish local setup for your workspace before the dashboard opens.",
      needAccount: "Need an account?",
      openSignUp: "Open sign-up",
      continueWithGoogle: "Sign in",
      submit: "Sign in",
      emailLabel: "Email",
      passwordLabel: "Password",
      privacy:
        "Users do not add env files. The app owner configures Convex once, and users sign in here.",
      setupRequiredTitle: "Convex Auth is not configured",
      setupRequiredDescription:
        "Connect the Convex deployment before using this sign-in method.",
    },
    signUp: {
      eyebrow: "Create account",
      title: "Create your budget account",
      description:
        "Choose an email and password. Budget-BOSS will create your account in Convex and finish local workspace setup next.",
      haveAccount: "Already have an account?",
      openSignIn: "Open sign in",
      submit: "Create account",
      emailLabel: "Email",
      passwordLabel: "Password",
      privacy:
        "Use at least 8 characters. Forgot your password? Use the link on the sign-in screen to reset it by email.",
    },
    authContinue: {
      eyebrow: "Continue",
      missingEmailTitle: "Add an email to finish setup",
      missingEmailDescription:
        "Budget-BOSS requires an email-backed Convex account before local setup can finish.",
      missingEmailHelp:
        "Create or sign in with an email and password account, then return here to finish setup.",
      title: "Finish your local setup",
      description:
        "Budget-BOSS needs one local profile and one personal workspace before the dashboard can load server-side data for this account.",
      whatHappensNext: "What happens next",
      oneSafeBootstrap: "One safe bootstrap",
      oneSafeBootstrapDescription:
        "The continue action creates any missing records once, reuses them on later sign-ins, and then opens your dashboard with the resulting workspace selected.",
      relinkConflict:
        "This email is already linked to a different account. Sign out here, switch to the original sign-in method, or contact support before continuing.",
      bootstrapIssueTitle: "Setup needs attention",
      bootstrapIssueDescription:
        "Budget-BOSS could not finish the secure Convex setup step for this session.",
      bootstrapIssueHelp:
        "Try again after the app owner checks Convex Auth and CONVEX_SYNC_SECRET settings.",
      continueToDashboard: "Continue to dashboard",
      rerunSafe: "This is safe to run again if your session already created the local records.",
    },
    securitySettings: {
      eyebrow: "Security settings",
      title: "Open your account security controls.",
      description:
        "Budget-BOSS uses Convex Auth email and password accounts. Use the \"Forgot password?\" link on sign-in to reset it by email. Email verification is a planned follow-up.",
      googleAccountEyebrow: "Account credentials",
      googleAccountTitle: "Use your Budget-BOSS account.",
      googleAccountDescription:
        "Your account is created in Convex Auth with the email and password you choose on sign-up.",
      openGoogleSecurity: "Use a strong unique password with at least 8 characters.",
      openGooglePermissions: "Forgot your password? Use the link on the sign-in screen to reset it by email. Email verification is a planned follow-up.",
      sessionAccessEyebrow: "Session access",
      sessionAccessTitle: "Switch accounts safely.",
      sessionAccessDescription:
        "Sign out here if you need to return to the sign-in screen and use a different account.",
      privacyEyebrow: "Privacy",
      privacyItems: {
        signInOnly: "Convex Auth verifies sign-in and returns your account identity.",
        minimalData:
          "Budget-BOSS keeps only the local account, workspace, preference, and integration data it needs to run.",
        noMarketingData: "No marketing data is recorded or sold.",
        personalizationUserOnly:
          "Personalization stays user-only and is not shared with brokers or third-party advertisers.",
        gmailPrivacy: "No Google OAuth client or user-managed environment file is required for login.",
      },
    },
    notesPage: {
      eyebrow: "Tools",
      title: "Notes",
      description: "A quick place for reminders and rough budget thoughts.",
    },
    notesBoard: {
      regionLabel: "Notes board",
      inputLabel: "New note",
      inputPlaceholder: "Type a note and press Enter or Add note…",
      addNote: "Add note",
      emptyState: "No notes yet. Add one above.",
      deleteNote: "Delete {text}",
    },
    calculatorPage: {
      eyebrow: "Tools",
      title: "Calculator",
      description: "Quick arithmetic for budget checks.",
    },
    calculator: {
      regionLabel: "Calculator",
      clearButton: "Clear",
    },
    learnPage: {
      eyebrow: "Learn!",
      title: "Comic-strip lessons for the money move that matters next.",
      description: "Short lessons for the money move that matters next.",
      storyCuesEyebrow: "Story cues",
      storyCuesTitle: "Quick cues for the next move",
      storyCuesDescription: "One clear cue and one action per lesson.",
      blueprintPicksEyebrow: "Blueprint picks",
      blueprintPicksTitle: "Start here",
      blueprintPicksDescription:
        "Highest-signal lessons matched to your current blueprint pressure.",
      streakEyebrow: "Keep the streak",
      streakTitle: "Next up",
      streakDescription:
        "Evergreen refreshers when you want one more useful concept without a long scroll.",
    },
    dashboardPage: {
      eyebrow: "Dashboard",
      title: "Interactive billboard",
      description: "Keep your workspace, tools, and live signals in one board.",
      workspaceLabel: "Workspace",
      cityLabel: "City",
      motionLabel: "Motion",
      currentModeEyebrow: "Current mode",
      checkInSubmitted: "Checked in",
      checkInNeeded: "Check-in due",
      demoWorkspace: "Demo",
      liveMembership: "Live member",
      windowProfileEyebrow: "Window profile",
      layoutLabel: "Layout",
      motionValueLabel: "Motion",
      noWorkspaceSelected: "No workspace selected",
      noWorkspaceRole: "none",
      roles: {
        owner: "Owner",
        editor: "Editor",
        approver: "Approver",
        read_only: "Read only",
      },
      homeBaseKicker: "Board anchor",
      homeBaseTitle: "Shared home base",
      homeBaseDescription: "Keep one shared region ready for setup and jobs.",
      homeBaseEmptyState: "No shared region saved yet.",
      homeBaseActionLabel: "Open setup wizard",
      themePresets: {
        midnight: "Midnight",
      },
      layoutPresets: {
        launcher_grid: "Launcher grid",
      },
      motionPresets: {
        cinematic: "Cinematic",
      },
    },
    broadcastBar: {
      kicker: "Local area",
      title: "Local area",
      fallbackTicker: "Budget updates",
    },
    launcherGrid: {
      kicker: "Tools",
      title: "Popular budgeting tools",
      description: "Open the next tool without the extra scroll.",
    },
    liveBriefing: {
      kicker: "Briefing",
      title: "Live briefing",
      description: "Trusted topics, trimmed for quick scanning.",
      sourceStatus: {
        live: "Live",
        fallback: "Fallback",
      },
      fieldCount: "{count} fields",
      emptyState: "No briefing topics yet. Check back after the next refresh.",
    },
    dailyCheckIn: {
      kicker: "Check-in lane",
      title: "Log today's number",
      description: "One number keeps {workspaceName} aligned.",
      liveSubmissionUnavailable: "Live entry locked",
      submitting: "Sending",
      submittedToday: "Sent today",
      readyToSubmit: "Ready now",
      plannedSpendLabel: "Planned spend for today",
      lockedDate: "Locked to {dateLabel} for {workspaceName}.",
      disabledHint: "Sign in to send live check-ins.",
      validationError: "Enter a non-negative planned spend before sending today's check-in.",
      submitError: "Unable to send today's check-in right now.",
      submitButton: "Send today's check-in",
      submittingButton: "Sending check-in",
      workspaceFallback: "this workspace",
      cashStatus: {
        positive: "Positive",
        negative: "Negative",
      },
      severity: {
        warning: "Warning",
        critical: "Critical",
      },
      emptyHeadline: "No check-in yet for this workspace.",
      noCheckInYet: "No check-in yet.",
      submittedAt: "Sent {submittedAt}.",
      plannedSpendMetric: "Planned spend",
      openAlertsMetric: "Open alerts",
      netCashAfterPlanMetric: "Net cash after plan",
      emptyAlertsTitle: "No alerts yet.",
      emptyAlertsDescription: "Send again when you need a refresh.",
    },
    liveAlerts: {
      kicker: "Alert lane",
      title: "Watch the pressure points",
      description: "Projected alerts land here first.",
      selectWorkspace: "Select a workspace to see alerts.",
      standbyNoUrl: "Standby. Add the Convex URL to enable alerts.",
      standbyNoBridge: "Standby. Realtime auth is not ready yet.",
      loading: "Loading alerts...",
      viewerSync: "Viewer sync in progress. Alerts appear after it finishes.",
      workspaceSync: "Waiting on workspace access sync.",
      empty: "No live alerts yet. They appear after the first projected check-in.",
      checkInDate: "Check-in {date}",
      severity: {
        info: "Info",
        warning: "Warning",
        critical: "Critical",
      },
    },
    integrationActions: {
      openSetupWizard: "Open setup wizard",
      openOfficialLogin: "Open official login",
      openOfficialDocs: "Open official docs",
    },
    integrationsHub: {
      eyebrow: "Connection Hub",
      title: "Connect only the providers you can scan and trust fast.",
      description:
        "Each section keeps the official route, risk, and next action easy to scan.",
      guardrails: {
        officialRoutesFirst: {
          label: "Official routes",
          title: "Use the provider's official login, docs, or setup route first.",
        },
        noSilentSharing: {
          label: "No silent sharing",
          title: "Only providers you explicitly connect receive the minimum required data.",
        },
        revokePathStaysObvious: {
          label: "Easy revoke path",
          title: "You should always be able to find the disconnect or revoke path quickly.",
        },
      },
      groupedScan: "Grouped scan",
      providerCount: "{count} providers",
      categories: {
        ai: {
          label: "AI copilots",
          summary: "Model helpers and prompt-heavy workflow tools.",
        },
        banking: {
          label: "Banking rails",
          summary: "Account verification and official banking connections.",
        },
        investing: {
          label: "Investing",
          summary: "Brokerage and portfolio access with clear permissions.",
        },
        payroll: {
          label: "Payroll",
          summary: "Income and worker setup with clear checks.",
        },
        tax: {
          label: "Tax and accounting",
          summary: "Documents and ledger access with visible trust cues.",
        },
        finance_ops: {
          label: "Finance operations",
          summary: "Expense, card, and ops tooling kept simple on purpose.",
        },
      },
    },
    providerCard: {
      categoryLabel: {
        ai: "AI",
        banking: "Banking",
        investing: "Investing",
        payroll: "Payroll",
        tax: "Tax",
        finance_ops: "Finance ops",
      },
      categorySummary: {
        ai: "Assistant tools and prompt access.",
        banking: "Official bank and account links.",
        investing: "Portfolio and brokerage access.",
        payroll: "Income and worker setup.",
        tax: "Tax and ledger workflows.",
        finance_ops: "Expense and money ops tools.",
      },
      risk: {
        low: "Low risk",
        medium: "Medium risk",
        high: "High risk",
      },
      setupState: {
        setupWizard: "Setup wizard",
        guidanceOnly: "Guidance only",
      },
      quickActions: "Quick actions",
    },
    integrationProviderPages: {
      claude: {
        eyebrow: "Claude Setup",
        title: "Connect Claude",
        description: "Use the official Anthropic route first. Safety details stay below.",
      },
      openai: {
        eyebrow: "OpenAI Setup",
        title: "Connect OpenAI",
        description: "Use the official OpenAI route first. Safety details stay below.",
      },
      copilot: {
        eyebrow: "GitHub Copilot Setup",
        title: "Connect GitHub Copilot",
        description: "Review repository and prompt access first. Safety details stay below.",
        systemAccessMessage:
          "System reach: Review extension, repository, and prompt access before enabling GitHub Copilot.",
        riskChecklistTitle: "Risk checklist",
        riskChecklistItems: {
          repositoryAccess: "Repository reach: Confirm which repositories and files the tool can inspect.",
          officialFlow: "Official flow: Use only the official GitHub Copilot authentication flow.",
          revokeAccess: "Revoke path: Revoke access immediately if the workspace no longer requires it.",
        },
      },
      openclaw: {
        eyebrow: "OpenClaw Setup",
        title: "Connect OpenClaw",
        description: "Review system reach and prompt-injection exposure first. Safety details stay below.",
        systemAccessMessage:
          "System reach: Verify local system access, data paths, model routing, and prompt-injection boundaries before enabling OpenClaw.",
        riskChecklistTitle: "High-risk connection",
        riskChecklistItems: {
          localReach: "Local reach: Check which local files, tools, or shells OpenClaw can reach.",
          promptRouting:
            "Prompt safety: Confirm prompt routing, storage paths, and injection boundaries before enabling the integration.",
          oneClickRevoke: "One-click revoke: Use one-click revoke if your trust model changes.",
        },
      },
      gemini: {
        eyebrow: "Gemini Setup",
        title: "Connect Gemini",
        description: "Use the official Google AI Studio route first. Safety details stay below.",
      },
      perplexity: {
        eyebrow: "Perplexity Setup",
        title: "Connect Perplexity",
        description: "Use the official Perplexity route first. Safety details stay below.",
      },
      mistral: {
        eyebrow: "Mistral Setup",
        title: "Connect Mistral",
        description: "Use the official Mistral route first. Safety details stay below.",
      },
      wise: {
        eyebrow: "Wise Setup",
        title: "Connect Wise",
        description: "Use the official Wise route first. Safety details stay below.",
      },
      revolut: {
        eyebrow: "Revolut Setup",
        title: "Connect Revolut",
        description: "Use the official Revolut route first. Safety details stay below.",
      },
      paypal: {
        eyebrow: "PayPal Setup",
        title: "Connect PayPal",
        description: "Use the official PayPal route first. Safety details stay below.",
      },
      deel: {
        eyebrow: "Deel Setup",
        title: "Connect Deel",
        description: "Use the official Deel route first. Safety details stay below.",
      },
      xero: {
        eyebrow: "Xero Setup",
        title: "Connect Xero",
        description: "Use the official Xero route first. Safety details stay below.",
      },
    },
    integrationsShared: {
      backToConnectionHub: "Back to connection hub",
      tools: "Tools",
      privacyShieldTitle: "Privacy Shield",
      privacyShieldDescription: "Check what {providerLabel} can receive before you connect it.",
      disclosureHeadings: {
        minimumData: "Minimum data",
        noSilentSharing: "No silent sharing",
        revokeAnyTime: "Revoke any time",
      },
      disclosures: {
        minimumData: "Only explicitly connected providers receive the minimum required data.",
        noSilentSharing: "No silent sharing or automatic cross-provider routing.",
        revokeAnyTime: "You can revoke and disconnect this provider at any time.",
      },
      officialLinksTitle: "Official links",
      officialLogin: "Official login",
      officialDocs: "Official docs",
      privacyBadge: "No silent sharing",
      systemAccessWarning: "System access warning",
    },
    wizard: {
      title: "Setup Your Budget",
      description: "Answer 10 quick questions to build your budget baseline",
      income: {
        title: "Monthly Income",
        subtitle: "Salary, side income, investments - all combined",
        placeholder: "e.g. 35000",
        helper: "Enter total monthly income (THB)",
      },
      rent: {
        title: "Rent / Housing Cost",
        subtitle: "Condo, apartment, house rent or mortgage",
        placeholder: "e.g. 12000",
        helper: "Monthly rent or mortgage payment (THB)",
      },
      transport: {
        title: "Transport Cost",
        subtitle: "BTS/MRT, bus, motorbike, fuel, Grab/Bolt",
        placeholder: "e.g. 3000",
        helper: "Monthly transport total (THB)",
      },
      phoneInternet: {
        title: "Phone / Internet",
        subtitle: "Mobile plan, home internet, streaming bundles",
        placeholder: "e.g. 800",
        helper: "Monthly phone & internet cost (THB)",
      },
      subscriptions: {
        title: "Subscriptions",
        subtitle: "Netflix, Spotify, gym, app subscriptions",
        placeholder: "e.g. 500",
        helper: "Monthly subscription total (THB)",
      },
      entertainment: {
        title: "Entertainment",
        subtitle: "Movies, coffee, games, hobbies, dining out",
        placeholder: "e.g. 3000",
        helper: "Monthly entertainment budget (THB)",
      },
      healthcare: {
        title: "Healthcare",
        subtitle: "Meds, dentist, hospital, insurance copay",
        placeholder: "e.g. 1000",
        helper: "Monthly healthcare cost (THB)",
      },
      savingsRate: {
        title: "Savings Rate",
        subtitle: "What % of income do you want to save?",
        placeholder: "e.g. 20",
        helper: "Target savings percentage (0-50%)",
      },
      riskTolerance: {
        title: "Risk Tolerance",
        subtitle: "How much market fluctuation can you handle?",
        low: "Low - protect principal",
        medium: "Medium - balanced",
        high: "High - growth focused",
      },
      locationConsent: {
        title: "Location Access",
        subtitle: "Allow location for local news and fuel prices",
        prompt: "Enable location to get nearby fuel prices and local financial news",
      },
    },
  },
  th: {
    appNav: {
      mobileNavigation: "การนำทางแอปบนมือถือ",
      desktopNavigation: "การนำทางแอป",
      openDashboard: "ไปที่แดชบอร์ด",
      routes: {
        dashboard: "แดชบอร์ด",
        startSmart: "เริ่มอย่างชาญฉลาด",
        calculator: "เครื่องคำนวณ",
        notes: "โน้ต",
        learn: "เรียนรู้",
        integrations: "การเชื่อมต่อ",
        jobs: "งาน",
      },
    },
    accounts: {
      navLabel: "บัญชี",
      title: "บัญชี",
      subtitle: "จัดงบประมาณอิสระได้สูงสุด 5 บัญชี — ครอบครัว ธุรกิจ โรงเรียน และอื่นๆ",
      createTitle: "สร้างบัญชี",
      umbrellaLabel: "ประเภท",
      nameLabel: "ชื่อบัญชี",
      namePlaceholder: "เช่น ครอบครัวของเรา",
      create: "สร้างบัญชี",
      cancel: "ยกเลิก",
      maxReached: "คุณมีบัญชีครบ 5 บัญชีแล้ว ลบหนึ่งบัญชีเพื่อสร้างใหม่",
      umbrella: {
        family: "ครอบครัว",
        couple: "คู่รัก",
        business: "ธุรกิจ",
        school: "โรงเรียน",
        friends: "เพื่อนฝูง",
        charity: "การกุศล",
        shopping: "ช้อปปิ้ง",
      },
      defaultName: {
        family: "ครอบครัวของเรา",
        couple: "คู่ของเรา",
        business: "บัญชีธุรกิจ",
        school: "กองทุนโรงเรียน",
        friends: "กลุ่มเพื่อน",
        charity: "โครงการการกุศล",
        shopping: "รายการช้อปปิ้ง",
      },
      invite: "เชิญ",
      inviteByCode: "เชิญด้วยรหัสแชร์",
      shareCodePlaceholder: "วางรหัสแชร์ของเพื่อน",
      inviteLink: "ลิงก์เชิญ",
      inviteQR: "รหัส QR",
      copyLink: "คัดลอกลิงก์",
      copyCode: "คัดลอกรหัส",
      rotateCode: "สร้างรหัสเชิญใหม่",
      members: "สมาชิก",
      leave: "ออกจากบัญชี",
      removeMember: "นำออก",
      delete: "ลบบัญชี",
      acceptInvite: "ยอมรับ",
      declineInvite: "ปฏิเสธ",
      pendingInvites: "คำเชิญที่รอดำเนินการ",
      switchTo: "เปิด",
      role: {
        owner: "เจ้าของ",
        member: "สมาชิก",
      },
      joinTitle: "เข้าร่วมบัญชี",
      joinPrompt: "สแกนรหัส QR หรือเปิดลิงก์เชิญเพื่อเข้าร่วม",
      joined: "คุณได้เข้าร่วมแล้ว",
      invalidCode: "รหัสเชิญไม่ถูกต้อง",
    },
    localeSwitcher: {
      label: "ภาษา",
      options: {
        en: "English",
        th: "ไทย",
      },
    },
    welcome: {
      brand: "Budget-BOSS",
      heading: "เปิดบอร์ด Budget-BOSS ของคุณ",
      description:
        "ลงชื่อเข้าใช้ก่อนเพื่อปลดล็อกเส้นทางเริ่มต้นของคุณ หลังจากนั้น Budget-BOSS จะพาคุณไปยังแบบสอบถามเริ่มต้นครั้งเดียว หรือเข้าสู่บอร์ดหลักตามความคืบหน้าที่บันทึกไว้",
      openSignIn: "เปิดหน้าลงชื่อเข้าใช้",
      openSignUp: "เปิดหน้าสมัครใช้งาน",
      privacyPromise: "เป็นส่วนตัวโดยค่าเริ่มต้น ตั้งค่าเพิ่มเมื่อจำเป็นเท่านั้น",
      quickReasonsAria: "เหตุผลสำคัญบนหน้าต้อนรับ",
      quickReasons: {
        signInFirst: {
          title: "ลงชื่อเข้าใช้ก่อน",
          description: "เปิดบัญชีของคุณก่อน เพื่อให้แอปตัดสินใจได้ว่าคุณต้องตั้งค่าต่อหรือเข้าสู่บอร์ดหลักทันที",
        },
        keepItShort: {
          title: "ให้ขั้นตอนแรกสั้นและชัดเจน",
          description: "แบบสอบถามเริ่มต้นจะปรากฏหลังจากลงชื่อเข้าใช้ และเฉพาะเมื่อความคืบหน้าครั้งแรกของคุณยังไม่เสร็จสมบูรณ์",
        },
        moveWithoutSprawl: {
          title: "ไปต่อได้โดยไม่รก",
          description: "Budget-BOSS ทำให้เส้นทางเริ่มต้นกระชับ อ่านง่าย และสแกนได้เร็วบนหน้าจอขนาดเล็ก",
        },
      },
      rootFlow: "เส้นทางเริ่มต้น",
      authFirstThenSetup: "ยืนยันตัวตนก่อน แล้วค่อยตั้งค่า",
      rootFlowDescription:
        "ผู้ใช้ที่ยังไม่ได้ลงชื่อเข้าใช้จะอยู่ที่หน้าต้อนรับนี้ ส่วนผู้ใช้ที่ลงชื่อเข้าใช้แล้วจะเข้าสู่แบบสอบถามเริ่มต้นเฉพาะเมื่อการตั้งค่าครั้งแรกยังไม่เสร็จ",
      whatChangesNext: "ขั้นตอนถัดไป",
      nextSteps: {
        signIn: "ลงชื่อเข้าใช้หากคุณมีบัญชีอยู่แล้ว",
        signUp: "สมัครใช้งานหากคุณต้องการบัญชีใหม่ก่อนเริ่มตั้งค่า",
        finishWizard: "ทำแบบสอบถามเริ่มต้นให้เสร็จเพียงครั้งเดียว แล้วครั้งถัดไปจะกลับสู่บอร์ดหลักโดยอัตโนมัติ",
      },
    },
    launchWizard: {
      kicker: "แบบสอบถามเริ่มต้น",
      title: "ค่าใช้จ่ายคร่าว ๆ",
      description:
        "เพิ่มค่าใช้จ่ายประจำแบบคร่าว ๆ ก่อน เพื่อให้ Budget-BOSS เปิดมาพร้อมฐานเงินที่ใช้งานได้ แทนที่จะเป็นกระดานว่าง",
      topCategoriesTitle: "หมวดค่าใช้จ่ายยอดนิยม",
      entryLabel: "ชื่อค่าใช้จ่าย",
      entryPlaceholder: "ค้นหาหรือเลือกค่าใช้จ่ายที่พบบ่อย",
      customTitleLabel: "ชื่อค่าใช้จ่ายแบบกำหนดเอง",
      customTitlePlaceholder: "ใช้ช่องนี้เมื่อรายการที่มีอยู่ไม่ตรง",
      amountLabel: "จำนวนเงินต่อเดือนโดยประมาณ",
      addExpense: "เพิ่มค่าใช้จ่าย",
      finish: "เสร็จสิ้นการเริ่มต้น",
      summaryTitle: "รายการประมาณการ",
      emptySummary: "ยังไม่มีการเพิ่มค่าใช้จ่าย",
      helperTitle: "เหตุผลที่เริ่มจากขั้นตอนนี้",
      helperDescription:
        "ป๊อปอัปแรกนี้ตั้งใจให้เบา: หมวดคร่าว ๆ จำนวนเงินคร่าว ๆ แล้วค่อยเข้าสู่การใช้งานปกติของแอป",
      currentCountLabel: "หมวดที่บันทึกแล้ว",
      errors: {
        titleRequired: "เลือกชื่อค่าใช้จ่ายที่พบบ่อยหรือกรอกชื่อแบบกำหนดเอง",
        amountRequired: "กรอกจำนวนเงินต่อเดือนโดยประมาณที่มากกว่าศูนย์",
        atLeastOne: "เพิ่มค่าใช้จ่ายคร่าว ๆ อย่างน้อยหนึ่งรายการก่อนจบขั้นตอนเริ่มต้น",
        saveFailed: "ไม่สามารถบันทึกการตั้งค่าเริ่มต้นในเบราว์เซอร์นี้ได้",
      },
      categories: {
        rentMortgage: "ค่าเช่าหรือผ่อนบ้าน",
        groceries: "ของชำ",
        utilities: "ค่าสาธารณูปโภค",
        transportFuel: "ค่าเดินทางหรือน้ำมัน",
        phoneInternet: "ค่าโทรศัพท์หรืออินเทอร์เน็ต",
        insurance: "ประกัน",
        debtPayments: "ชำระหนี้",
        healthcare: "สุขภาพ",
        childcareFamilySupport: "ดูแลเด็กหรือช่วยเหลือครอบครัว",
        funEntertainment: "ความสนุกหรือความบันเทิง",
      },
    },
    authPanel: {
      secureAccess: "การเข้าถึงอย่างปลอดภัย",
      useGoogleToStart: "สร้างบัญชีของคุณ",
      useGoogleToContinue: "ใช้บัญชีของคุณ",
      googleOnly: "Convex Auth สร้างและปกป้องบัญชี Budget-BOSS",
      secureSignIn: "ใช้อีเมลและรหัสผ่านเพื่อเปิดบัญชีเดียวกันบนทุกอุปกรณ์",
      gmailPrivacy: "การเข้าสู่ระบบไม่ต้องใช้ Google OAuth client หรือไฟล์ env จากผู้ใช้",
      minimalData: "Budget-BOSS จะเก็บเฉพาะข้อมูลบัญชี พื้นที่ทำงาน การตั้งค่า และการเชื่อมต่อที่จำเป็นต่อการทำงานเท่านั้น",
      whyThisStepExists: "ทำไมต้องมีขั้นตอนนี้",
      localProfileFirst: "สร้างโปรไฟล์ภายในก่อน",
      localProfileDescription:
        "Budget-BOSS ตรวจสอบบัญชี Convex Auth จากนั้นจึงสร้างโปรไฟล์ภายใน พื้นที่ทำงานส่วนตัว และค่ากำหนดเริ่มต้น เพื่อให้เซิร์ฟเวอร์โหลดข้อมูลได้ถูกต้อง",
    },
    signIn: {
      eyebrow: "ลงชื่อเข้าใช้",
      title: "เปิดบอร์ดงบประมาณของคุณ",
      description: "ใช้บัญชี Budget-BOSS ของคุณ จากนั้นให้แอปตั้งค่าภายในสำหรับพื้นที่ทำงานก่อนเปิดแดชบอร์ด",
      needAccount: "ยังไม่มีบัญชี?",
      openSignUp: "เปิดหน้าสมัครใช้งาน",
      continueWithGoogle: "ลงชื่อเข้าใช้",
      submit: "ลงชื่อเข้าใช้",
      emailLabel: "อีเมล",
      passwordLabel: "รหัสผ่าน",
      privacy: "ผู้ใช้ไม่ต้องเพิ่มไฟล์ env เจ้าของแอปตั้งค่า Convex หนึ่งครั้ง แล้วผู้ใช้ลงชื่อเข้าใช้ที่นี่",
      setupRequiredTitle: "ยังไม่ได้กำหนดค่า Convex Auth",
      setupRequiredDescription: "เชื่อมต่อ Convex deployment ก่อนใช้วิธีลงชื่อเข้าใช้นี้",
    },
    signUp: {
      eyebrow: "สร้างบัญชี",
      title: "สร้างบัญชีงบประมาณของคุณ",
      description: "เลือกอีเมลและรหัสผ่าน Budget-BOSS จะสร้างบัญชีใน Convex แล้วตั้งค่าพื้นที่ทำงานภายในต่อ",
      haveAccount: "มีบัญชีอยู่แล้ว?",
      openSignIn: "เปิดหน้าลงชื่อเข้าใช้",
      submit: "สร้างบัญชี",
      emailLabel: "อีเมล",
      passwordLabel: "รหัสผ่าน",
      privacy: "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร รุ่นแรกนี้ยังไม่เปิดใช้การรีเซ็ตรหัสผ่านหรือยืนยันอีเมล",
    },
    authContinue: {
      eyebrow: "ดำเนินการต่อ",
      missingEmailTitle: "เพิ่มอีเมลเพื่อให้การตั้งค่าเสร็จสมบูรณ์",
      missingEmailDescription: "Budget-BOSS ต้องใช้บัญชี Convex ที่มีอีเมลเพื่อให้การตั้งค่าภายในเสร็จสมบูรณ์",
      missingEmailHelp: "สร้างบัญชีหรือลงชื่อเข้าใช้ด้วยอีเมลและรหัสผ่าน แล้วกลับมาที่นี่เพื่อจบการตั้งค่า",
      title: "ตั้งค่าภายในของคุณให้เสร็จ",
      description: "Budget-BOSS ต้องมีโปรไฟล์ภายในหนึ่งรายการและพื้นที่ทำงานส่วนตัวหนึ่งรายการก่อนที่แดชบอร์ดจะโหลดข้อมูลฝั่งเซิร์ฟเวอร์สำหรับบัญชีนี้",
      whatHappensNext: "จะเกิดอะไรขึ้นต่อไป",
      oneSafeBootstrap: "เริ่มต้นอย่างปลอดภัยเพียงครั้งเดียว",
      oneSafeBootstrapDescription:
        "การดำเนินการต่อจะสร้างข้อมูลที่ยังขาดอยู่เพียงครั้งเดียว ใช้ข้อมูลเดิมในครั้งถัดไป และเปิดแดชบอร์ดพร้อมเลือกพื้นที่ทำงานที่ได้ผลลัพธ์ไว้แล้ว",
      relinkConflict: "อีเมลนี้เชื่อมกับอีกบัญชีหนึ่งอยู่แล้ว โปรดออกจากระบบ สลับไปใช้วิธีลงชื่อเข้าใช้เดิม หรือติดต่อฝ่ายช่วยเหลือก่อนดำเนินการต่อ",
      bootstrapIssueTitle: "การตั้งค่าต้องตรวจสอบ",
      bootstrapIssueDescription: "Budget-BOSS ยังทำขั้นตอนตั้งค่า Convex แบบปลอดภัยสำหรับเซสชันนี้ไม่สำเร็จ",
      bootstrapIssueHelp: "ลองอีกครั้งหลังจากเจ้าของแอปตรวจสอบ Convex Auth และค่า CONVEX_SYNC_SECRET แล้ว",
      continueToDashboard: "ไปยังแดชบอร์ดต่อ",
      rerunSafe: "สามารถเรียกใช้อีกครั้งได้อย่างปลอดภัย หากเซสชันนี้ได้สร้างข้อมูลภายในไว้แล้ว",
    },
    securitySettings: {
      eyebrow: "การตั้งค่าความปลอดภัย",
      title: "เปิดตัวควบคุมความปลอดภัยของบัญชีคุณ",
      description:
        "Budget-BOSS ใช้บัญชีอีเมลและรหัสผ่านของ Convex Auth รุ่นแรกนี้ยังไม่เปิดใช้การรีเซ็ตรหัสผ่านหรือยืนยันอีเมล",
      googleAccountEyebrow: "ข้อมูลบัญชี",
      googleAccountTitle: "ใช้บัญชี Budget-BOSS ของคุณ",
      googleAccountDescription:
        "บัญชีของคุณจะถูกสร้างใน Convex Auth ด้วยอีเมลและรหัสผ่านที่เลือกตอนสมัครใช้งาน",
      openGoogleSecurity: "ใช้รหัสผ่านที่เดายากและไม่ซ้ำ ความยาวอย่างน้อย 8 ตัวอักษร",
      openGooglePermissions: "การรีเซ็ตรหัสผ่านและยืนยันอีเมลเป็นงานติดตามถัดไป",
      sessionAccessEyebrow: "การเข้าถึงเซสชัน",
      sessionAccessTitle: "สลับบัญชีอย่างปลอดภัย",
      sessionAccessDescription:
        "ออกจากระบบที่นี่หากคุณต้องการกลับไปยังหน้าลงชื่อเข้าใช้และใช้อีกบัญชีหนึ่ง",
      privacyEyebrow: "ความเป็นส่วนตัว",
      privacyItems: {
        signInOnly: "Convex Auth ตรวจสอบการลงชื่อเข้าใช้และส่งคืนตัวตนของบัญชีคุณ",
        minimalData:
          "Budget-BOSS จะเก็บเฉพาะข้อมูลบัญชีภายใน พื้นที่ทำงาน การตั้งค่า และการเชื่อมต่อที่จำเป็นต่อการทำงาน",
        noMarketingData: "ไม่มีการบันทึกหรือขายข้อมูลการตลาด",
        personalizationUserOnly:
          "การปรับแต่งจะใช้สำหรับผู้ใช้คนนั้นเท่านั้น และไม่แชร์กับนายหน้าข้อมูลหรือผู้ลงโฆษณาภายนอก",
        gmailPrivacy: "การเข้าสู่ระบบไม่ต้องใช้ Google OAuth client หรือไฟล์ env จากผู้ใช้",
      },
    },
    notesPage: {
      eyebrow: "เครื่องมือ",
      title: "โน้ต",
      description: "จดเตือนและไอเดียงบประมาณแบบสั้น ๆ",
    },
    notesBoard: {
      regionLabel: "บอร์ดโน้ต",
      inputLabel: "โน้ตใหม่",
      inputPlaceholder: "พิมพ์โน้ต แล้วกด Enter หรือเพิ่มโน้ต…",
      addNote: "เพิ่มโน้ต",
      emptyState: "ยังไม่มีโน้ต เพิ่มด้านบนได้เลย",
      deleteNote: "ลบ {text}",
    },
    calculatorPage: {
      eyebrow: "เครื่องมือ",
      title: "เครื่องคำนวณ",
      description: "คำนวณตัวเลขงบประมาณแบบเร็ว",
    },
    calculator: {
      regionLabel: "เครื่องคำนวณ",
      clearButton: "ล้างค่า",
    },
    learnPage: {
      eyebrow: "เรียนรู้!",
      title: "บทเรียนสไตล์การ์ตูนสำหรับก้าวเรื่องเงินที่สำคัญที่สุดถัดไป",
      description: "เริ่มจากบทเรียนสั้นสำหรับก้าวเรื่องเงินที่สำคัญที่สุดตอนนี้",
      storyCuesEyebrow: "ภาพจำเรื่องราว",
      storyCuesTitle: "คิวสั้นสำหรับก้าวถัดไป",
      storyCuesDescription: "แต่ละบทเรียนเหลือหนึ่งคิวที่ชัดเจนและหนึ่งอย่างให้ลงมือทำ",
      blueprintPicksEyebrow: "บทเรียนจากบลูพรินต์",
      blueprintPicksTitle: "เริ่มตรงนี้",
      blueprintPicksDescription: "บทเรียนสัญญาณสูงที่จับคู่กับแรงกดดันในบลูพรินต์ของคุณตอนนี้",
      streakEyebrow: "รักษาจังหวะต่อ",
      streakTitle: "ถัดไป",
      streakDescription: "บททบทวนแบบใช้ได้เสมอ เมื่อคุณอยากได้อีกหนึ่งแนวคิดที่มีประโยชน์โดยไม่ต้องเลื่อนยาว",
    },
    dashboardPage: {
      eyebrow: "แดชบอร์ด",
      title: "ป้ายภาพรวมแบบโต้ตอบ",
      description: "รวมพื้นที่ทำงาน เครื่องมือ และสัญญาณสดไว้ในบอร์ดเดียว",
      workspaceLabel: "พื้นที่ทำงาน",
      cityLabel: "เมือง",
      motionLabel: "การเคลื่อนไหว",
      currentModeEyebrow: "โหมดปัจจุบัน",
      checkInSubmitted: "ส่งแล้ววันนี้",
      checkInNeeded: "ต้องเช็กอินวันนี้",
      demoWorkspace: "พื้นที่เดโม",
      liveMembership: "สมาชิกจริง",
      windowProfileEyebrow: "โปรไฟล์หน้าต่าง",
      layoutLabel: "เลย์เอาต์",
      motionValueLabel: "การเคลื่อนไหว",
      noWorkspaceSelected: "ยังไม่ได้เลือกพื้นที่ทำงาน",
      noWorkspaceRole: "ไม่มี",
      roles: {
        owner: "เจ้าของ",
        editor: "ผู้แก้ไข",
        approver: "ผู้อนุมัติ",
        read_only: "อ่านอย่างเดียว",
      },
      homeBaseKicker: "จุดยึดบอร์ด",
      homeBaseTitle: "ฐานหลักที่ใช้ร่วมกัน",
      homeBaseDescription: "เก็บภูมิภาคร่วมไว้จุดเดียวสำหรับตั้งค่าและงาน",
      homeBaseEmptyState: "ยังไม่มีภูมิภาคร่วมที่บันทึกไว้",
      homeBaseActionLabel: "เปิดตัวช่วยตั้งค่า",
      themePresets: {
        midnight: "เที่ยงคืน",
      },
      layoutPresets: {
        launcher_grid: "กริดตัวเปิด",
      },
      motionPresets: {
        cinematic: "แบบภาพยนตร์",
      },
    },
    broadcastBar: {
      kicker: "พื้นที่ท้องถิ่น",
      title: "พื้นที่ท้องถิ่น",
      fallbackTicker: "อัปเดตงบประมาณ",
    },
    launcherGrid: {
      kicker: "เครื่องมือ",
      title: "เครื่องมืองบประมาณที่ใช้บ่อย",
      description: "เปิดเครื่องมือถัดไปได้เลยโดยไม่ต้องเลื่อนเพิ่ม",
    },
    liveBriefing: {
      kicker: "สรุปข่าว",
      title: "สรุปสด",
      description: "หัวข้อที่เชื่อถือได้ ตัดให้สแกนได้เร็ว",
      sourceStatus: {
        live: "สด",
        fallback: "สำรอง",
      },
      fieldCount: "{count} ฟิลด์",
      emptyState: "ยังไม่มีหัวข้อสรุปข่าว กลับมาดูอีกครั้งหลังรีเฟรชรอบถัดไป",
    },
    dailyCheckIn: {
      kicker: "เลนเช็กอิน",
      title: "บันทึกตัวเลขของวันนี้",
      description: "ตัวเลขเดียวช่วยให้ {workspaceName} เห็นภาพตรงกัน",
      liveSubmissionUnavailable: "ปิดการส่งสด",
      submitting: "กำลังส่ง",
      submittedToday: "ส่งแล้ววันนี้",
      readyToSubmit: "พร้อมส่งตอนนี้",
      plannedSpendLabel: "รายจ่ายที่วางแผนไว้สำหรับวันนี้",
      lockedDate: "ล็อกไว้ที่ {dateLabel} สำหรับ {workspaceName}",
      disabledHint: "ลงชื่อเข้าใช้เพื่อส่งเช็กอินสด",
      validationError: "กรอกรายจ่ายที่วางแผนไว้แบบไม่ติดลบก่อนส่งเช็กอินวันนี้",
      submitError: "ยังส่งเช็กอินของวันนี้ไม่ได้ในตอนนี้",
      submitButton: "ส่งเช็กอินของวันนี้",
      submittingButton: "กำลังส่งเช็กอิน",
      workspaceFallback: "พื้นที่ทำงานนี้",
      cashStatus: {
        positive: "เป็นบวก",
        negative: "เป็นลบ",
      },
      severity: {
        warning: "เตือน",
        critical: "วิกฤต",
      },
      emptyHeadline: "ยังไม่มีเช็กอินสำหรับพื้นที่ทำงานนี้",
      noCheckInYet: "ยังไม่มีเช็กอิน",
      submittedAt: "ส่งเมื่อ {submittedAt}",
      plannedSpendMetric: "รายจ่ายตามแผน",
      openAlertsMetric: "การแจ้งเตือนที่เปิดอยู่",
      netCashAfterPlanMetric: "เงินสดสุทธิหลังแผน",
      emptyAlertsTitle: "ยังไม่มีการแจ้งเตือน",
      emptyAlertsDescription: "ส่งอีกครั้งเมื่อต้องการรีเฟรช",
    },
    liveAlerts: {
      kicker: "เลนแจ้งเตือน",
      title: "ดูจุดกดดัน",
      description: "การแจ้งเตือนคาดการณ์จะมาถึงที่นี่ก่อน",
      selectWorkspace: "เลือกพื้นที่ทำงานเพื่อดูการแจ้งเตือน",
      standbyNoUrl: "รออยู่ เพิ่ม Convex URL เพื่อเปิดใช้การแจ้งเตือน",
      standbyNoBridge: "รออยู่ สะพานยืนยันตัวตนแบบเรียลไทม์ยังไม่พร้อม",
      loading: "กำลังโหลดการแจ้งเตือน...",
      viewerSync: "กำลังซิงก์ผู้ดู การแจ้งเตือนจะปรากฏหลังจากเสร็จสิ้น",
      workspaceSync: "กำลังรอการซิงก์สิทธิ์เข้าถึงพื้นที่ทำงาน",
      empty: "ยังไม่มีการแจ้งเตือนสด การแจ้งเตือนจะปรากฏหลังเช็กอินคาดการณ์ครั้งแรก",
      checkInDate: "เช็กอิน {date}",
      severity: {
        info: "ข้อมูล",
        warning: "เตือน",
        critical: "วิกฤต",
      },
    },
    integrationActions: {
      openSetupWizard: "เปิดตัวช่วยตั้งค่า",
      openOfficialLogin: "เปิดหน้าเข้าสู่ระบบทางการ",
      openOfficialDocs: "เปิดเอกสารทางการ",
    },
    integrationsHub: {
      eyebrow: "ศูนย์การเชื่อมต่อ",
      title: "เชื่อมต่อเฉพาะผู้ให้บริการที่คุณสแกนแล้วเชื่อถือได้อย่างรวดเร็วเท่านั้น",
      description: "แต่ละกลุ่มเริ่มจากเส้นทางทางการ ความเสี่ยง และขั้นตอนถัดไป",
      guardrails: {
        officialRoutesFirst: {
          label: "เส้นทางทางการ",
          title: "ใช้เส้นทางเข้าสู่ระบบ เอกสาร หรือการตั้งค่าทางการของผู้ให้บริการก่อน",
        },
        noSilentSharing: {
          label: "ไม่แชร์แบบเงียบ",
          title: "มีเพียงผู้ให้บริการที่คุณเชื่อมต่ออย่างชัดเจนเท่านั้นที่จะได้รับข้อมูลขั้นต่ำที่จำเป็น",
        },
        revokePathStaysObvious: {
          label: "ทางยกเลิกชัดเจน",
          title: "คุณควรหาเส้นทางตัดการเชื่อมต่อหรือเพิกถอนได้อย่างรวดเร็วเสมอ",
        },
      },
      groupedScan: "สแกนแบบจัดกลุ่ม",
      providerCount: "{count} ผู้ให้บริการ",
      categories: {
        ai: {
          label: "ผู้ช่วย AI",
          summary: "ผู้ช่วยขับเคลื่อนด้วยโมเดล เครื่องมือวางแผน และเวิร์กโฟลว์ที่พึ่งพาพรอมป์ตอย่างมาก",
        },
        banking: {
          label: "ช่องทางธนาคาร",
          summary: "การยืนยันบัญชีและการเชื่อมต่อธนาคารที่ควรให้ความรู้สึกเป็นทางการ ไม่ลับ ๆ ล่อ ๆ",
        },
        investing: {
          label: "การลงทุน",
          summary: "เครื่องมือพอร์ตและโบรกเกอร์ที่ควรอยู่หลังสิทธิ์ที่ชัดเจนและทางยกเลิกที่ตรวจสอบได้",
        },
        payroll: {
          label: "เงินเดือน",
          summary: "รายได้ รอบจ่าย และข้อมูลงานที่ต้องตั้งค่าอย่างระวังแต่ไม่ฝืดเกินไป",
        },
        tax: {
          label: "ภาษีและบัญชี",
          summary: "เอกสาร การยื่น และการเข้าถึงบัญชีแยกประเภทที่ต้องส่งสัญญาณความน่าเชื่อถือให้ชัดเจน",
        },
        finance_ops: {
          label: "ปฏิบัติการการเงิน",
          summary: "เครื่องมือค่าใช้จ่าย บัตร และงานการเงินเชิงปฏิบัติการที่ควรเรียบง่ายอย่างตั้งใจ",
        },
      },
    },
    providerCard: {
      categoryLabel: {
        ai: "AI",
        banking: "ธนาคาร",
        investing: "การลงทุน",
        payroll: "เงินเดือน",
        tax: "ภาษี",
        finance_ops: "ปฏิบัติการการเงิน",
      },
      categorySummary: {
        ai: "เครื่องมือผู้ช่วยและการเข้าถึงพรอมป์ต",
        banking: "ช่องทางบัญชีและธนาคารทางการ",
        investing: "การเข้าถึงพอร์ตและโบรกเกอร์",
        payroll: "การตั้งค่ารายได้และพนักงาน",
        tax: "เวิร์กโฟลว์ภาษีและบัญชีแยกประเภท",
        finance_ops: "เครื่องมือค่าใช้จ่ายและงานการเงิน",
      },
      risk: {
        low: "ความเสี่ยงต่ำ",
        medium: "ความเสี่ยงปานกลาง",
        high: "ความเสี่ยงสูง",
      },
      setupState: {
        setupWizard: "ตัวช่วยตั้งค่า",
        guidanceOnly: "ให้คำแนะนำเท่านั้น",
      },
      quickActions: "การกระทำด่วน",
    },
    integrationProviderPages: {
      claude: {
        eyebrow: "การตั้งค่า Claude",
        title: "เชื่อมต่อ Claude",
        description: "ใช้เส้นทาง Anthropic ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      openai: {
        eyebrow: "การตั้งค่า OpenAI",
        title: "เชื่อมต่อ OpenAI",
        description: "ใช้เส้นทาง OpenAI ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      copilot: {
        eyebrow: "การตั้งค่า GitHub Copilot",
        title: "เชื่อมต่อ GitHub Copilot",
        description: "ตรวจสอบการเข้าถึงที่เก็บโค้ดและพรอมป์ตก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
        systemAccessMessage:
          "ขอบเขตระบบ: ตรวจสอบการเข้าถึงส่วนขยาย ที่เก็บโค้ด และพรอมป์ตก่อนเปิดใช้ GitHub Copilot",
        riskChecklistTitle: "รายการตรวจสอบความเสี่ยง",
        riskChecklistItems: {
          repositoryAccess: "ขอบเขตที่เก็บโค้ด: ยืนยันว่าเครื่องมือนี้ตรวจสอบที่เก็บโค้ดและไฟล์ใดได้บ้าง",
          officialFlow: "ขั้นตอนทางการ: ใช้เฉพาะกระบวนการยืนยันตัวตนทางการของ GitHub Copilot เท่านั้น",
          revokeAccess: "ทางเพิกถอน: เพิกถอนสิทธิ์ทันทีหากเวิร์กสเปซไม่ต้องการใช้อีกต่อไป",
        },
      },
      openclaw: {
        eyebrow: "การตั้งค่า OpenClaw",
        title: "เชื่อมต่อ OpenClaw",
        description: "ตรวจสอบขอบเขตระบบและความเสี่ยงจากพรอมป์ตแทรกก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
        systemAccessMessage:
          "ขอบเขตระบบ: ตรวจสอบการเข้าถึงระบบภายใน เส้นทางข้อมูล การกำหนดเส้นทางโมเดล และขอบเขตการแทรกพรอมป์ตก่อนเปิดใช้ OpenClaw",
        riskChecklistTitle: "การเชื่อมต่อความเสี่ยงสูง",
        riskChecklistItems: {
          localReach: "ขอบเขตในเครื่อง: ตรวจสอบว่า OpenClaw เข้าถึงไฟล์ เครื่องมือ หรือเชลล์ในเครื่องใดได้บ้าง",
          promptRouting: "ความปลอดภัยของพรอมป์ต: ยืนยันเส้นทางพรอมป์ต ที่เก็บข้อมูล และขอบเขตการแทรกก่อนเปิดใช้การเชื่อมต่อ",
          oneClickRevoke: "เพิกถอนในคลิกเดียว: ใช้การเพิกถอนแบบคลิกเดียวหากโมเดลความเชื่อถือของคุณเปลี่ยนไป",
        },
      },
      gemini: {
        eyebrow: "การตั้งค่า Gemini",
        title: "เชื่อมต่อ Gemini",
        description: "ใช้เส้นทาง Google AI Studio ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      perplexity: {
        eyebrow: "การตั้งค่า Perplexity",
        title: "เชื่อมต่อ Perplexity",
        description: "ใช้เส้นทาง Perplexity ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      mistral: {
        eyebrow: "การตั้งค่า Mistral",
        title: "เชื่อมต่อ Mistral",
        description: "ใช้เส้นทาง Mistral ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      wise: {
        eyebrow: "การตั้งค่า Wise",
        title: "เชื่อมต่อ Wise",
        description: "ใช้เส้นทาง Wise ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      revolut: {
        eyebrow: "การตั้งค่า Revolut",
        title: "เชื่อมต่อ Revolut",
        description: "ใช้เส้นทาง Revolut ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      paypal: {
        eyebrow: "การตั้งค่า PayPal",
        title: "เชื่อมต่อ PayPal",
        description: "ใช้เส้นทาง PayPal ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      deel: {
        eyebrow: "การตั้งค่า Deel",
        title: "เชื่อมต่อ Deel",
        description: "ใช้เส้นทาง Deel ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
      xero: {
        eyebrow: "การตั้งค่า Xero",
        title: "เชื่อมต่อ Xero",
        description: "ใช้เส้นทาง Xero ทางการก่อน รายละเอียดความปลอดภัยอยู่ด้านล่าง",
      },
    },
    integrationsShared: {
      backToConnectionHub: "กลับไปที่ศูนย์การเชื่อมต่อ",
      tools: "เครื่องมือ",
      privacyShieldTitle: "เกราะความเป็นส่วนตัว",
      privacyShieldDescription: "ตรวจสอบก่อนว่า {providerLabel} รับอะไรได้บ้าง",
      disclosureHeadings: {
        minimumData: "ข้อมูลขั้นต่ำ",
        noSilentSharing: "ไม่แชร์เงียบ ๆ",
        revokeAnyTime: "เพิกถอนได้ทุกเมื่อ",
      },
      disclosures: {
        minimumData: "มีเพียงผู้ให้บริการที่คุณเชื่อมต่ออย่างชัดเจนเท่านั้นที่จะได้รับข้อมูลขั้นต่ำที่จำเป็น",
        noSilentSharing: "ไม่มีการแชร์แบบเงียบ ๆ หรือการส่งต่อข้ามผู้ให้บริการโดยอัตโนมัติ",
        revokeAnyTime: "คุณสามารถเพิกถอนและตัดการเชื่อมต่อผู้ให้บริการนี้ได้ทุกเมื่อ",
      },
      officialLinksTitle: "ลิงก์ทางการ",
      officialLogin: "เข้าสู่ระบบทางการ",
      officialDocs: "เอกสารทางการ",
      privacyBadge: "ไม่มีการแชร์แบบเงียบ ๆ",
      systemAccessWarning: "คำเตือนการเข้าถึงระบบ",
    },
    wizard: {
      title: "ตั้งค่างบประมาณของคุณ",
      description: "ตอบ 10 คำถามเร็ว ๆ นี้ เพื่อสร้างฐานงบประมาณ",
      income: {
        title: "รายได้ต่อเดือน",
        subtitle: "เงินเดือน รายได้เสริม เงินทุน รวมทั้งหมด",
        placeholder: "เช่น 35000",
        helper: "กรอกรายได้รวมต่อเดือน (บาท)",
      },
      rent: {
        title: "ค่าเช่า / ค่าที่อยู่อาศัย",
        subtitle: "คอนโด แป้ท์เมนท์ บ้าน หรือผ่อนบ้าน",
        placeholder: "เช่น 12000",
        helper: "ค่าเช่าหรือผ่อนบ้านต่อเดือน (บาท)",
      },
      transport: {
        title: "ค่าเดินทาง",
        subtitle: "BTS/MRT รถเมล์ มอไซค์ น้ำมัน Grab/Bolt",
        placeholder: "เช่น 3000",
        helper: "ค่าเดินทางต่อเดือนรวมทุกอย่าง (บาท)",
      },
      phoneInternet: {
        title: "โทรศัพท์ / อินเตอร์เน็ต",
        subtitle: "แผนมือถือ อินเตอร์เน็ตบ้าน แพ็กเกจสตรีมมิ่ง",
        placeholder: "เช่น 800",
        helper: "ค่าโทรศัพท์และอินเตอร์เน็ตต่อเดือน (บาท)",
      },
      subscriptions: {
        title: "สมัครสมาชิก",
        subtitle: "Netflix, Spotify, ฟิตเนส, สมาชิกแอปต่าง ๆ",
        placeholder: "เช่น 500",
        helper: "ค่าสมัครสมาชิกรวมต่อเดือน (บาท)",
      },
      entertainment: {
        title: "บันเทิง / ความบันเทิง",
        subtitle: "ดูหนัง กาแฟ เล่นเกม งานอดิเรก กินนอกบ้าน",
        placeholder: "เช่น 3000",
        helper: "งบบันเทิงต่อเดือน (บาท)",
      },
      healthcare: {
        title: "สุขภาพ / ค่ายา",
        subtitle: "ยา ทันตกรรม โรงพยาบาล ค่ารพ. ค่าประกัน",
        placeholder: "เช่น 1000",
        helper: "ค่าสุขภาพต่อเดือน (บาท)",
      },
      savingsRate: {
        title: "อัตราการออม",
        subtitle: "อยากออมกี่เปอร์เซ็นต์ของรายได้?",
        placeholder: "เช่น 20",
        helper: "เปอร์เซ็นต์เป้าหมายการออม (0-50%)",
      },
      riskTolerance: {
        title: "จุดรับความเสี่ยง",
        subtitle: "คุณรับความผันผวนของตลาดได้มากแค่ไหน?",
        low: "ต่ำ - ปกป้องเงินต้น",
        medium: "ปานกลาง - สมดุล",
        high: "สูง - เน้นเติบโต",
      },
      locationConsent: {
        title: "อนุญาตตำแหน่งที่ตั้ง",
        subtitle: "อนุญาตตำแหน่งเพื่อรับข่าวท้องถิ่นและราคาน้ำมัน",
        prompt: "เปิดตำแหน่งเพื่อดูราคาน้ำมัน和ข่าวการเงินใกล้บ้าน",
      },
    },

  },
} as const;

export type LocaleMessages = typeof localeMessages.en;

export function getLocaleMessages(locale: AppLocale) {
  if (locale === "th") {
    return localeMessages.th;
  }
  return localeMessages.en;
}
