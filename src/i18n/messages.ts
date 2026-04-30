export const localeCookieName = "bb-locale";
export const defaultLocale = "en";
export const supportedLocales = ["en", "zh", "th"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export function resolveLocale(candidate: string | null | undefined): AppLocale {
  if (!candidate) {
    return defaultLocale;
  }

  return supportedLocales.includes(candidate as AppLocale)
    ? (candidate as AppLocale)
    : defaultLocale;
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
    localeSwitcher: {
      label: "Language",
      options: {
        en: "English",
        zh: "简体中文",
        th: "ไทย",
      },
    },
    welcome: {
      brand: "BudgetBITCH",
      heading: "Open your BudgetBITCH board",
      description:
        "Sign in to unlock your root flow. After that, BudgetBITCH can send you into the setup wizard or straight to the landing board based on your saved launch profile.",
      openSignIn: "Open sign in",
      openSignUp: "Open sign-up",
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
            "The setup wizard only appears after sign-in and only when your launch profile is still incomplete.",
        },
        moveWithoutSprawl: {
          title: "Move without the sprawl",
          description:
            "BudgetBITCH keeps the entry path dense, readable, and ready for quick scanning on smaller screens.",
        },
      },
      rootFlow: "Root flow",
      authFirstThenSetup: "Auth first, then setup",
      rootFlowDescription:
        "Signed-out visitors stay on this welcome window. Signed-in visitors move into the wizard only when the launch profile still needs to be completed.",
      whatChangesNext: "What changes next",
      nextSteps: {
        signIn: "Sign in when you already have an account.",
        signUp: "Sign up when you need a fresh account before setup begins.",
        finishWizard:
          "Finish the launch wizard once, then return to the landing board on future visits.",
      },
    },
    authPanel: {
      secureAccess: "Secure access",
      useGoogleToStart: "Use Google to start",
      useGoogleToContinue: "Use Google to continue",
      googleOnly: "Google is the only sign-in method for this app.",
      secureSignIn: "Google is only used for secure sign-in and account verification.",
      gmailPrivacy: "BudgetBITCH never reads or stores Gmail inbox or message content.",
      minimalData:
        "BudgetBITCH keeps only the minimal account, workspace, preference, and integration data it needs to run.",
      whyThisStepExists: "Why this step exists",
      localProfileFirst: "Local profile first",
      localProfileDescription:
        "BudgetBITCH uses Google to verify who you are, then creates your local profile, personal workspace, and default workspace preference once so the app can load the right data shape on the server.",
    },
    signIn: {
      eyebrow: "Sign in",
      title: "Open your budget board",
      description:
        "Use Google to sign in, then let BudgetBITCH finish local setup for your workspace before the dashboard opens.",
      needAccount: "Need an account?",
      openSignUp: "Open sign-up",
      continueWithGoogle: "Continue with Google",
      privacy:
        "Google is only used for secure sign-in. BudgetBITCH never reads or stores Gmail inbox or message content.",
    },
    authContinue: {
      eyebrow: "Continue",
      missingEmailTitle: "Add an email to finish setup",
      missingEmailDescription:
        "BudgetBITCH requires a verified Google email account before local setup can finish.",
      missingEmailHelp:
        "Use the Google sign-in flow with a verified email account, then return here to finish setup.",
      title: "Finish your local setup",
      description:
        "BudgetBITCH needs one local profile and one personal workspace before the dashboard can load server-side data for this account.",
      whatHappensNext: "What happens next",
      oneSafeBootstrap: "One safe bootstrap",
      oneSafeBootstrapDescription:
        "The continue action creates any missing records once, reuses them on later sign-ins, and then opens your dashboard with the resulting workspace selected.",
      relinkConflict:
        "This email is already linked to a different account. Sign out here, switch to the original sign-in method, or contact support before continuing.",
      continueToDashboard: "Continue to dashboard",
      rerunSafe: "This is safe to run again if your session already created the local records.",
    },
    securitySettings: {
      eyebrow: "Security settings",
      title: "Open your account security controls.",
      description:
        "BudgetBITCH uses Google for secure sign-in only. This app does not use a separate BudgetBITCH password, does not manage passkeys here, and never reads or stores Gmail inbox or message content.",
      googleAccountEyebrow: "Google account",
      googleAccountTitle: "Open Google account security.",
      googleAccountDescription:
        "Use your Google Account security page to review sign-in activity, connected sessions, recovery options, and multi-factor protections for the identity you use with this app.",
      openGoogleSecurity: "Open Google account security",
      openGooglePermissions: "Open Google app permissions",
      sessionAccessEyebrow: "Session access",
      sessionAccessTitle: "Switch accounts safely.",
      sessionAccessDescription:
        "Sign out here if you need to return to the Google sign-in screen and use a different account.",
      privacyEyebrow: "Privacy",
      privacyItems: {
        signInOnly: "Google is used only to verify sign-in and return your account identity.",
        minimalData:
          "BudgetBITCH keeps only the local account, workspace, preference, and integration data it needs to run.",
        gmailPrivacy: "Gmail inbox and message content are never read or stored by this app.",
      },
    },
    notesPage: {
      eyebrow: "Tools",
      title: "Notes",
      description:
        "Quick scratchpad for budget thoughts, reminders, and anything that does not need a category yet.",
    },
    notesBoard: {
      regionLabel: "Notes board",
      inputLabel: "New note",
      inputPlaceholder: "Type a note and press Enter or Add note…",
      addNote: "Add note",
      emptyState: "No notes yet — add your first one above.",
      deleteNote: "Delete {text}",
    },
    calculatorPage: {
      eyebrow: "Tools",
      title: "Calculator",
      description: "Quick arithmetic for budget checks — no number crunching in your head.",
    },
    calculator: {
      regionLabel: "Calculator",
      clearButton: "Clear",
    },
    learnPage: {
      eyebrow: "Learn!",
      title: "Comic-strip lessons for the money move that matters next.",
      description:
        "Skip the explainer wall. Start with fast visual cues, then open the lesson card only when you want the deeper breakdown.",
      storyCuesEyebrow: "Story cues",
      storyCuesTitle: "Three fast scenes to anchor the idea",
      storyCuesDescription: "Absurd setup, plain-English meaning, and one action cue per card.",
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
      description:
        "Keep the city label, the tool deck, and the live briefing in one visible window.",
      workspaceLabel: "Workspace",
      cityLabel: "City",
      motionLabel: "Motion",
      currentModeEyebrow: "Current mode",
      checkInSubmitted: "Submitted today",
      checkInNeeded: "Needs today’s check-in",
      demoWorkspace: "Demo workspace context is showing until a live membership is available.",
      liveMembership: "Live membership is synced.",
      windowProfileEyebrow: "Window profile",
      layoutLabel: "Layout",
      motionValueLabel: "Motion",
      noWorkspaceSelected: "No workspace selected",
      noWorkspaceRole: "none",
    },
    broadcastBar: {
      kicker: "Local area",
      title: "Local area",
      fallbackTicker: "Budget updates",
    },
    launcherGrid: {
      kicker: "Tools",
      title: "Popular budgeting tools",
      description: "Open the lanes you actually use without stacking another scrolling page.",
    },
    liveBriefing: {
      kicker: "Briefing",
      title: "Live briefing",
      description: "Five trusted topics, three short fields each, trimmed for fast scanning.",
      sourceStatus: {
        live: "Live",
        fallback: "Fallback",
      },
      fieldCount: "{count} fields",
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
        "Every group below leads with the official route, the risk level, and the easiest next action so you can move without reading a giant safety essay first.",
      guardrails: {
        officialRoutesFirst: "Official routes first",
        noSilentSharing: "No silent sharing",
        revokePathStaysObvious: "Revoke path stays obvious",
      },
      groupedScan: "Grouped scan",
      providerCount: "{count} providers",
      categories: {
        ai: {
          label: "AI copilots",
          summary: "Model-powered helpers, planning copilots, and prompt-heavy workflow tools.",
        },
        banking: {
          label: "Banking rails",
          summary: "Account verification and banking connections that should feel official, not sneaky.",
        },
        investing: {
          label: "Investing",
          summary: "Brokerage and portfolio tools that belong behind clear permissions and revoke paths.",
        },
        payroll: {
          label: "Payroll",
          summary: "Income, pay runs, and worker details that need low-friction but careful setup.",
        },
        tax: {
          label: "Tax and accounting",
          summary: "Documents, filings, and ledger access where trust cues must be obvious.",
        },
        finance_ops: {
          label: "Finance operations",
          summary: "Expense, card, and ops tooling for the parts of money management that stay boring on purpose.",
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
        ai: "Prompt-heavy tools and assistant access.",
        banking: "Bank connections and verification rails.",
        investing: "Portfolio, account, and brokerage access.",
        payroll: "Income and worker operations.",
        tax: "Tax filings, books, and accounting workflows.",
        finance_ops: "Operational money tooling and expense controls.",
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
    integrationsShared: {
      backToConnectionHub: "Back to connection hub",
      tools: "Tools",
      privacyShieldTitle: "Privacy Shield",
      privacyShieldDescription:
        "Review how {providerLabel} receives data before enabling any connection.",
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
  },
  zh: {
    appNav: {
      mobileNavigation: "移动应用导航",
      desktopNavigation: "应用导航",
      openDashboard: "前往仪表板",
      routes: {
        dashboard: "仪表板",
        startSmart: "启动规划",
        calculator: "计算器",
        notes: "笔记",
        learn: "学习",
        integrations: "集成",
        jobs: "工作机会",
      },
    },
    localeSwitcher: {
      label: "语言",
      options: {
        en: "English",
        zh: "简体中文",
        th: "ไทย",
      },
    },
    welcome: {
      brand: "BudgetBITCH",
      heading: "打开你的 BudgetBITCH 控制板",
      description:
        "先登录，再解锁你的起始流程。之后，BudgetBITCH 会根据你保存的启动配置，把你带到设置向导或直接进入主面板。",
      openSignIn: "打开登录",
      openSignUp: "打开注册",
      quickReasonsAria: "欢迎页重点说明",
      quickReasons: {
        signInFirst: {
          title: "先登录",
          description: "先打开你的账户，应用才会判断你需要继续设置还是直接进入主面板。",
        },
        keepItShort: {
          title: "让第一步保持简短",
          description: "只有在登录后且你的启动配置尚未完成时，设置向导才会出现。",
        },
        moveWithoutSprawl: {
          title: "保持清晰，不要蔓延",
          description: "BudgetBITCH 让入口流程紧凑、易读，并适合在较小屏幕上快速浏览。",
        },
      },
      rootFlow: "起始流程",
      authFirstThenSetup: "先认证，再设置",
      rootFlowDescription:
        "未登录访客会停留在这个欢迎窗口。已登录访客只有在启动配置尚未完成时才会进入向导。",
      whatChangesNext: "接下来会发生什么",
      nextSteps: {
        signIn: "如果你已有账户，请先登录。",
        signUp: "如果你需要新账户，请先注册，然后再开始设置。",
        finishWizard: "启动向导只需完成一次，之后再次访问会直接返回主面板。",
      },
    },
    authPanel: {
      secureAccess: "安全访问",
      useGoogleToStart: "使用 Google 开始",
      useGoogleToContinue: "使用 Google 继续",
      googleOnly: "此应用仅支持 Google 登录。",
      secureSignIn: "Google 仅用于安全登录和账户验证。",
      gmailPrivacy: "BudgetBITCH 从不读取或存储 Gmail 收件箱或邮件内容。",
      minimalData: "BudgetBITCH 仅保留运行所需的最少账户、工作区、偏好设置和集成数据。",
      whyThisStepExists: "为什么需要这一步",
      localProfileFirst: "先建立本地资料",
      localProfileDescription:
        "BudgetBITCH 先用 Google 验证你的身份，然后创建本地资料、个人工作区和默认工作区偏好，这样服务器端才能加载正确的数据结构。",
    },
    signIn: {
      eyebrow: "登录",
      title: "打开你的预算面板",
      description: "使用 Google 登录，然后让 BudgetBITCH 为你的工作区完成本地设置，再进入仪表板。",
      needAccount: "还没有账户？",
      openSignUp: "打开注册",
      continueWithGoogle: "使用 Google 继续",
      privacy: "Google 仅用于安全登录。BudgetBITCH 不会读取或存储 Gmail 收件箱或邮件内容。",
    },
    authContinue: {
      eyebrow: "继续",
      missingEmailTitle: "添加邮箱以完成设置",
      missingEmailDescription: "BudgetBITCH 需要一个已验证的 Google 邮箱账户才能完成本地设置。",
      missingEmailHelp: "请使用带有已验证邮箱的 Google 登录流程，然后回到这里完成设置。",
      title: "完成你的本地设置",
      description: "在仪表板为此账户加载服务器端数据之前，BudgetBITCH 需要先创建一个本地资料和一个个人工作区。",
      whatHappensNext: "接下来会发生什么",
      oneSafeBootstrap: "一次安全初始化",
      oneSafeBootstrapDescription:
        "继续操作会一次性创建缺失记录，后续登录会复用这些记录，然后打开已选定工作区的仪表板。",
      relinkConflict: "这个邮箱已关联到另一个账户。请先退出，切换回原来的登录方式，或联系支持后再继续。",
      continueToDashboard: "继续前往仪表板",
      rerunSafe: "如果当前会话已经创建好本地记录，重复执行也是安全的。",
    },
    securitySettings: {
      eyebrow: "安全设置",
      title: "打开你的账户安全控制。",
      description:
        "BudgetBITCH 仅使用 Google 进行安全登录。此应用不使用单独的 BudgetBITCH 密码，不在这里管理通行密钥，也绝不会读取或存储 Gmail 收件箱或邮件内容。",
      googleAccountEyebrow: "Google 账户",
      googleAccountTitle: "打开 Google 账户安全。",
      googleAccountDescription:
        "使用你的 Google 账户安全页面查看登录活动、已连接会话、恢复选项，以及你用于此应用身份的多重验证保护。",
      openGoogleSecurity: "打开 Google 账户安全",
      openGooglePermissions: "打开 Google 应用权限",
      sessionAccessEyebrow: "会话访问",
      sessionAccessTitle: "安全切换账户。",
      sessionAccessDescription:
        "如果你需要返回 Google 登录页面并使用其他账户，请在这里退出登录。",
      privacyEyebrow: "隐私",
      privacyItems: {
        signInOnly: "Google 仅用于验证登录并返回你的账户身份。",
        minimalData: "BudgetBITCH 仅保留运行所需的本地账户、工作区、偏好设置和集成数据。",
        gmailPrivacy: "此应用绝不会读取或存储 Gmail 收件箱和邮件内容。",
      },
    },
    notesPage: {
      eyebrow: "工具",
      title: "笔记",
      description: "用于记录预算想法、提醒事项，以及任何暂时还不需要分类的内容。",
    },
    notesBoard: {
      regionLabel: "笔记面板",
      inputLabel: "新笔记",
      inputPlaceholder: "输入笔记，然后按 Enter 或点击添加笔记……",
      addNote: "添加笔记",
      emptyState: "还没有笔记，先在上方添加第一条。",
      deleteNote: "删除 {text}",
    },
    calculatorPage: {
      eyebrow: "工具",
      title: "计算器",
      description: "用于快速进行预算核对，不必再靠心算。",
    },
    calculator: {
      regionLabel: "计算器",
      clearButton: "清除",
    },
    learnPage: {
      eyebrow: "学习！",
      title: "用漫画式课程先学最该处理的那一步财务动作。",
      description: "跳过大段说明墙。先看快速视觉提示，只有在你想深入理解时再打开课程卡片。",
      storyCuesEyebrow: "情景提示",
      storyCuesTitle: "三个快速场景，帮你抓住核心概念",
      storyCuesDescription: "每张卡片都包含夸张情景、白话解释，以及一个立即可执行的动作提示。",
      blueprintPicksEyebrow: "蓝图推荐",
      blueprintPicksTitle: "先从这里开始",
      blueprintPicksDescription: "根据你当前蓝图压力匹配出的高信号课程。",
      streakEyebrow: "保持节奏",
      streakTitle: "接着看",
      streakDescription: "当你还想再学一个实用概念时，这里有不冗长的常青复习内容。",
    },
    dashboardPage: {
      eyebrow: "仪表板",
      title: "交互式总览面板",
      description: "将城市标签、工具面板和实时简报保留在同一个可见窗口中。",
      workspaceLabel: "工作区",
      cityLabel: "城市",
      motionLabel: "动态",
      currentModeEyebrow: "当前模式",
      checkInSubmitted: "今天已提交",
      checkInNeeded: "今天需要签到",
      demoWorkspace: "当前显示的是演示工作区上下文，直到可用的真实成员关系同步完成。",
      liveMembership: "真实成员关系已同步。",
      windowProfileEyebrow: "窗口配置",
      layoutLabel: "布局",
      motionValueLabel: "动态",
      noWorkspaceSelected: "未选择工作区",
      noWorkspaceRole: "无",
    },
    broadcastBar: {
      kicker: "本地区域",
      title: "本地区域",
      fallbackTicker: "预算更新",
    },
    launcherGrid: {
      kicker: "工具",
      title: "常用预算工具",
      description: "打开你真正会用到的入口，而不是再叠加一个需要滚动的页面。",
    },
    liveBriefing: {
      kicker: "简报",
      title: "实时简报",
      description: "五个可信主题，每个只保留三个短字段，方便快速扫读。",
      sourceStatus: {
        live: "实时",
        fallback: "备用",
      },
      fieldCount: "{count} 个字段",
    },
    integrationActions: {
      openSetupWizard: "打开设置向导",
      openOfficialLogin: "打开官方登录",
      openOfficialDocs: "打开官方文档",
    },
    integrationsHub: {
      eyebrow: "连接中心",
      title: "只连接那些你能快速看懂并信任的服务提供商。",
      description: "下方每一组都会先展示官方入口、风险级别和最直接的下一步，让你不必先读一大段安全说明。",
      guardrails: {
        officialRoutesFirst: "优先显示官方入口",
        noSilentSharing: "绝不静默共享",
        revokePathStaysObvious: "撤销路径始终清晰可见",
      },
      groupedScan: "分组查看",
      providerCount: "{count} 个提供商",
      categories: {
        ai: {
          label: "AI 助手",
          summary: "以模型为核心的助手、规划副驾驶和重提示工作流工具。",
        },
        banking: {
          label: "银行通道",
          summary: "账户验证和银行连接应当显得官方可信，而不是偷偷摸摸。",
        },
        investing: {
          label: "投资",
          summary: "券商和投资组合工具应放在权限清晰、可随时撤销的流程之后。",
        },
        payroll: {
          label: "薪资",
          summary: "收入、发薪和员工细节需要低摩擦但谨慎的设置流程。",
        },
        tax: {
          label: "税务与会计",
          summary: "文档、申报和账本访问场景里，信任提示必须一眼可见。",
        },
        finance_ops: {
          label: "财务运营",
          summary: "支出、卡片和运营类财务工具，理应保持清楚、稳定、低戏剧性。",
        },
      },
    },
    providerCard: {
      categoryLabel: {
        ai: "AI",
        banking: "银行",
        investing: "投资",
        payroll: "薪资",
        tax: "税务",
        finance_ops: "财务运营",
      },
      categorySummary: {
        ai: "以提示为主的工具和助手访问。",
        banking: "银行连接与验证通道。",
        investing: "投资组合、账户和券商访问。",
        payroll: "收入与员工相关操作。",
        tax: "税务申报、账簿和会计工作流。",
        finance_ops: "运营财务工具与费用控制。",
      },
      risk: {
        low: "低风险",
        medium: "中风险",
        high: "高风险",
      },
      setupState: {
        setupWizard: "设置向导",
        guidanceOnly: "仅指导",
      },
      quickActions: "快捷操作",
    },
    integrationsShared: {
      backToConnectionHub: "返回连接中心",
      tools: "工具",
      privacyShieldTitle: "隐私防护",
      privacyShieldDescription: "在启用任何连接之前，请先查看 {providerLabel} 会如何接收数据。",
      disclosures: {
        minimumData: "只有你明确连接的提供商才会收到完成所需的最少数据。",
        noSilentSharing: "不会发生静默共享，也不会自动跨提供商路由。",
        revokeAnyTime: "你可以随时撤销并断开此提供商。",
      },
      officialLinksTitle: "官方链接",
      officialLogin: "官方登录",
      officialDocs: "官方文档",
      privacyBadge: "绝不静默共享",
      systemAccessWarning: "系统访问警告",
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
    localeSwitcher: {
      label: "ภาษา",
      options: {
        en: "English",
        zh: "简体中文",
        th: "ไทย",
      },
    },
    welcome: {
      brand: "BudgetBITCH",
      heading: "เปิดบอร์ด BudgetBITCH ของคุณ",
      description:
        "ลงชื่อเข้าใช้ก่อนเพื่อปลดล็อกเส้นทางเริ่มต้นของคุณ หลังจากนั้น BudgetBITCH จะพาคุณไปยังตัวช่วยตั้งค่า หรือเข้าสู่บอร์ดหลักตามโปรไฟล์ที่คุณบันทึกไว้",
      openSignIn: "เปิดหน้าลงชื่อเข้าใช้",
      openSignUp: "เปิดหน้าสมัครใช้งาน",
      quickReasonsAria: "เหตุผลสำคัญบนหน้าต้อนรับ",
      quickReasons: {
        signInFirst: {
          title: "ลงชื่อเข้าใช้ก่อน",
          description: "เปิดบัญชีของคุณก่อน เพื่อให้แอปตัดสินใจได้ว่าคุณต้องตั้งค่าต่อหรือเข้าสู่บอร์ดหลักทันที",
        },
        keepItShort: {
          title: "ให้ขั้นตอนแรกสั้นและชัดเจน",
          description: "ตัวช่วยตั้งค่าจะปรากฏหลังจากลงชื่อเข้าใช้ และเฉพาะเมื่อโปรไฟล์เริ่มต้นของคุณยังไม่เสร็จสมบูรณ์",
        },
        moveWithoutSprawl: {
          title: "ไปต่อได้โดยไม่รก",
          description: "BudgetBITCH ทำให้เส้นทางเริ่มต้นกระชับ อ่านง่าย และสแกนได้เร็วบนหน้าจอขนาดเล็ก",
        },
      },
      rootFlow: "เส้นทางเริ่มต้น",
      authFirstThenSetup: "ยืนยันตัวตนก่อน แล้วค่อยตั้งค่า",
      rootFlowDescription:
        "ผู้ใช้ที่ยังไม่ได้ลงชื่อเข้าใช้จะอยู่ที่หน้าต้อนรับนี้ ส่วนผู้ใช้ที่ลงชื่อเข้าใช้แล้วจะเข้าสู่ตัวช่วยตั้งค่าเฉพาะเมื่อโปรไฟล์เริ่มต้นยังไม่เสร็จ",
      whatChangesNext: "ขั้นตอนถัดไป",
      nextSteps: {
        signIn: "ลงชื่อเข้าใช้หากคุณมีบัญชีอยู่แล้ว",
        signUp: "สมัครใช้งานหากคุณต้องการบัญชีใหม่ก่อนเริ่มตั้งค่า",
        finishWizard: "ตั้งค่าผ่านตัวช่วยเพียงครั้งเดียว แล้วครั้งถัดไปจะกลับสู่บอร์ดหลักโดยอัตโนมัติ",
      },
    },
    authPanel: {
      secureAccess: "การเข้าถึงอย่างปลอดภัย",
      useGoogleToStart: "ใช้ Google เพื่อเริ่มต้น",
      useGoogleToContinue: "ใช้ Google เพื่อดำเนินการต่อ",
      googleOnly: "แอปนี้ใช้ Google เป็นวิธีลงชื่อเข้าใช้เพียงอย่างเดียว",
      secureSignIn: "Google ใช้เฉพาะเพื่อการลงชื่อเข้าใช้และยืนยันบัญชีอย่างปลอดภัย",
      gmailPrivacy: "BudgetBITCH จะไม่อ่านหรือเก็บเนื้อหาในกล่องจดหมาย Gmail หรือข้อความอีเมล",
      minimalData: "BudgetBITCH จะเก็บเฉพาะข้อมูลบัญชี พื้นที่ทำงาน การตั้งค่า และการเชื่อมต่อที่จำเป็นต่อการทำงานเท่านั้น",
      whyThisStepExists: "ทำไมต้องมีขั้นตอนนี้",
      localProfileFirst: "สร้างโปรไฟล์ภายในก่อน",
      localProfileDescription:
        "BudgetBITCH ใช้ Google เพื่อยืนยันตัวคุณ จากนั้นจึงสร้างโปรไฟล์ภายใน พื้นที่ทำงานส่วนตัว และค่ากำหนดเริ่มต้น เพื่อให้เซิร์ฟเวอร์โหลดข้อมูลได้ถูกต้อง",
    },
    signIn: {
      eyebrow: "ลงชื่อเข้าใช้",
      title: "เปิดบอร์ดงบประมาณของคุณ",
      description: "ใช้ Google เพื่อลงชื่อเข้าใช้ จากนั้นให้ BudgetBITCH ตั้งค่าภายในสำหรับพื้นที่ทำงานของคุณก่อนเปิดแดชบอร์ด",
      needAccount: "ยังไม่มีบัญชี?",
      openSignUp: "เปิดหน้าสมัครใช้งาน",
      continueWithGoogle: "ดำเนินการต่อด้วย Google",
      privacy: "Google ใช้เฉพาะเพื่อการลงชื่อเข้าใช้ที่ปลอดภัย BudgetBITCH จะไม่อ่านหรือเก็บเนื้อหาในกล่องจดหมาย Gmail หรือข้อความอีเมล",
    },
    authContinue: {
      eyebrow: "ดำเนินการต่อ",
      missingEmailTitle: "เพิ่มอีเมลเพื่อให้การตั้งค่าเสร็จสมบูรณ์",
      missingEmailDescription: "BudgetBITCH ต้องใช้อีเมล Google ที่ยืนยันแล้วเพื่อให้การตั้งค่าภายในเสร็จสมบูรณ์",
      missingEmailHelp: "ใช้ขั้นตอนการลงชื่อเข้าใช้ Google ด้วยบัญชีที่มีอีเมลยืนยันแล้ว จากนั้นกลับมาที่นี่เพื่อจบการตั้งค่า",
      title: "ตั้งค่าภายในของคุณให้เสร็จ",
      description: "BudgetBITCH ต้องมีโปรไฟล์ภายในหนึ่งรายการและพื้นที่ทำงานส่วนตัวหนึ่งรายการก่อนที่แดชบอร์ดจะโหลดข้อมูลฝั่งเซิร์ฟเวอร์สำหรับบัญชีนี้",
      whatHappensNext: "จะเกิดอะไรขึ้นต่อไป",
      oneSafeBootstrap: "เริ่มต้นอย่างปลอดภัยเพียงครั้งเดียว",
      oneSafeBootstrapDescription:
        "การดำเนินการต่อจะสร้างข้อมูลที่ยังขาดอยู่เพียงครั้งเดียว ใช้ข้อมูลเดิมในครั้งถัดไป และเปิดแดชบอร์ดพร้อมเลือกพื้นที่ทำงานที่ได้ผลลัพธ์ไว้แล้ว",
      relinkConflict: "อีเมลนี้เชื่อมกับอีกบัญชีหนึ่งอยู่แล้ว โปรดออกจากระบบ สลับไปใช้วิธีลงชื่อเข้าใช้เดิม หรือติดต่อฝ่ายช่วยเหลือก่อนดำเนินการต่อ",
      continueToDashboard: "ไปยังแดชบอร์ดต่อ",
      rerunSafe: "สามารถเรียกใช้อีกครั้งได้อย่างปลอดภัย หากเซสชันนี้ได้สร้างข้อมูลภายในไว้แล้ว",
    },
    securitySettings: {
      eyebrow: "การตั้งค่าความปลอดภัย",
      title: "เปิดตัวควบคุมความปลอดภัยของบัญชีคุณ",
      description:
        "BudgetBITCH ใช้ Google เพื่อการลงชื่อเข้าใช้อย่างปลอดภัยเท่านั้น แอปนี้ไม่มีรหัสผ่าน BudgetBITCH แยกต่างหาก ไม่จัดการพาสคีย์ที่นี่ และจะไม่อ่านหรือจัดเก็บเนื้อหาในกล่องจดหมาย Gmail หรืออีเมล",
      googleAccountEyebrow: "บัญชี Google",
      googleAccountTitle: "เปิดความปลอดภัยของบัญชี Google",
      googleAccountDescription:
        "ใช้หน้าความปลอดภัยของบัญชี Google เพื่อตรวจสอบกิจกรรมการลงชื่อเข้าใช้ เซสชันที่เชื่อมต่อ ตัวเลือกการกู้คืน และการป้องกันแบบหลายปัจจัยสำหรับตัวตนที่คุณใช้กับแอปนี้",
      openGoogleSecurity: "เปิดความปลอดภัยของบัญชี Google",
      openGooglePermissions: "เปิดสิทธิ์แอป Google",
      sessionAccessEyebrow: "การเข้าถึงเซสชัน",
      sessionAccessTitle: "สลับบัญชีอย่างปลอดภัย",
      sessionAccessDescription:
        "ออกจากระบบที่นี่หากคุณต้องการกลับไปยังหน้าลงชื่อเข้าใช้ Google และใช้อีกบัญชีหนึ่ง",
      privacyEyebrow: "ความเป็นส่วนตัว",
      privacyItems: {
        signInOnly: "Google ใช้เพื่อยืนยันการลงชื่อเข้าใช้และส่งคืนตัวตนของบัญชีคุณเท่านั้น",
        minimalData:
          "BudgetBITCH จะเก็บเฉพาะข้อมูลบัญชีภายใน พื้นที่ทำงาน การตั้งค่า และการเชื่อมต่อที่จำเป็นต่อการทำงาน",
        gmailPrivacy: "แอปนี้จะไม่อ่านหรือจัดเก็บเนื้อหาในกล่องจดหมาย Gmail หรือข้อความอีเมล",
      },
    },
    notesPage: {
      eyebrow: "เครื่องมือ",
      title: "โน้ต",
      description:
        "พื้นที่จดบันทึกอย่างรวดเร็วสำหรับความคิดเรื่องงบประมาณ การเตือนความจำ และทุกอย่างที่ยังไม่ต้องจัดหมวดหมู่",
    },
    notesBoard: {
      regionLabel: "บอร์ดโน้ต",
      inputLabel: "โน้ตใหม่",
      inputPlaceholder: "พิมพ์โน้ต แล้วกด Enter หรือเพิ่มโน้ต…",
      addNote: "เพิ่มโน้ต",
      emptyState: "ยังไม่มีโน้ต เพิ่มรายการแรกของคุณด้านบนได้เลย",
      deleteNote: "ลบ {text}",
    },
    calculatorPage: {
      eyebrow: "เครื่องมือ",
      title: "เครื่องคำนวณ",
      description: "คำนวณอย่างรวดเร็วเพื่อตรวจสอบงบประมาณ โดยไม่ต้องคิดเลขในหัวเอง",
    },
    calculator: {
      regionLabel: "เครื่องคำนวณ",
      clearButton: "ล้างค่า",
    },
    learnPage: {
      eyebrow: "เรียนรู้!",
      title: "บทเรียนสไตล์การ์ตูนสำหรับก้าวเรื่องเงินที่สำคัญที่สุดถัดไป",
      description:
        "ข้ามกำแพงคำอธิบายยาว ๆ ไปก่อน เริ่มจากภาพสรุปเร็ว แล้วค่อยเปิดการ์ดบทเรียนเมื่อคุณอยากดูรายละเอียดเพิ่ม",
      storyCuesEyebrow: "ภาพจำเรื่องราว",
      storyCuesTitle: "สามฉากสั้นเพื่อยึดแนวคิดให้ชัด",
      storyCuesDescription: "แต่ละการ์ดมีฉากเวอร์ ความหมายแบบภาษาคนทั่วไป และคำใบ้สำหรับลงมือทำหนึ่งอย่าง",
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
      description: "เก็บป้ายชื่อเมือง ชุดเครื่องมือ และสรุปสดไว้ในหน้าต่างเดียวที่มองเห็นได้ตลอด",
      workspaceLabel: "พื้นที่ทำงาน",
      cityLabel: "เมือง",
      motionLabel: "การเคลื่อนไหว",
      currentModeEyebrow: "โหมดปัจจุบัน",
      checkInSubmitted: "ส่งแล้ววันนี้",
      checkInNeeded: "ต้องเช็กอินวันนี้",
      demoWorkspace: "กำลังแสดงบริบทพื้นที่ทำงานเดโมจนกว่าจะมีสมาชิกจริงพร้อมใช้งาน",
      liveMembership: "ซิงก์สมาชิกจริงแล้ว",
      windowProfileEyebrow: "โปรไฟล์หน้าต่าง",
      layoutLabel: "เลย์เอาต์",
      motionValueLabel: "การเคลื่อนไหว",
      noWorkspaceSelected: "ยังไม่ได้เลือกพื้นที่ทำงาน",
      noWorkspaceRole: "ไม่มี",
    },
    broadcastBar: {
      kicker: "พื้นที่ท้องถิ่น",
      title: "พื้นที่ท้องถิ่น",
      fallbackTicker: "อัปเดตงบประมาณ",
    },
    launcherGrid: {
      kicker: "เครื่องมือ",
      title: "เครื่องมืองบประมาณที่ใช้บ่อย",
      description: "เปิดเฉพาะเส้นทางที่คุณใช้จริง โดยไม่ต้องซ้อนอีกหน้าที่ต้องเลื่อนยาว",
    },
    liveBriefing: {
      kicker: "สรุปข่าว",
      title: "สรุปสด",
      description: "ห้าหัวข้อที่เชื่อถือได้ หัวข้อละสามฟิลด์สั้น ๆ ตัดมาเพื่อให้สแกนได้เร็ว",
      sourceStatus: {
        live: "สด",
        fallback: "สำรอง",
      },
      fieldCount: "{count} ฟิลด์",
    },
    integrationActions: {
      openSetupWizard: "เปิดตัวช่วยตั้งค่า",
      openOfficialLogin: "เปิดหน้าเข้าสู่ระบบทางการ",
      openOfficialDocs: "เปิดเอกสารทางการ",
    },
    integrationsHub: {
      eyebrow: "ศูนย์การเชื่อมต่อ",
      title: "เชื่อมต่อเฉพาะผู้ให้บริการที่คุณสแกนแล้วเชื่อถือได้อย่างรวดเร็วเท่านั้น",
      description:
        "แต่ละกลุ่มด้านล่างเริ่มจากเส้นทางทางการ ระดับความเสี่ยง และขั้นตอนถัดไปที่ง่ายที่สุด เพื่อให้คุณไปต่อได้โดยไม่ต้องอ่านคำเตือนยาว ๆ ก่อน",
      guardrails: {
        officialRoutesFirst: "เส้นทางทางการมาก่อน",
        noSilentSharing: "ไม่มีการแชร์แบบเงียบ ๆ",
        revokePathStaysObvious: "เส้นทางยกเลิกต้องชัดเจนเสมอ",
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
        ai: "เครื่องมือที่ใช้พรอมป์ตหนักและการเข้าถึงผู้ช่วย",
        banking: "การเชื่อมต่อธนาคารและช่องทางยืนยัน",
        investing: "การเข้าถึงพอร์ต บัญชี และโบรกเกอร์",
        payroll: "การดำเนินงานด้านรายได้และพนักงาน",
        tax: "งานยื่นภาษี สมุดบัญชี และเวิร์กโฟลว์บัญชี",
        finance_ops: "เครื่องมือการเงินเชิงปฏิบัติการและการควบคุมค่าใช้จ่าย",
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
    integrationsShared: {
      backToConnectionHub: "กลับไปที่ศูนย์การเชื่อมต่อ",
      tools: "เครื่องมือ",
      privacyShieldTitle: "เกราะความเป็นส่วนตัว",
      privacyShieldDescription: "ตรวจสอบว่า {providerLabel} รับข้อมูลอย่างไรก่อนเปิดใช้การเชื่อมต่อใด ๆ",
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
  },
} as const;

export type LocaleMessages = (typeof localeMessages)[AppLocale];

export function getLocaleMessages(locale: AppLocale) {
  return localeMessages[locale];
}