import type { LocaleMessages } from './en';

export const zh: LocaleMessages = {
  appNav: {
    mobileNavigation: "移动应用导航",
    desktopNavigation: "应用导航",
    openDashboard: "前往仪表盘",
    routes: {
      dashboard: "仪表盘",
      startSmart: "智能启动",
      calculator: "计算器",
      notes: "笔记",
      learn: "学习",
      integrations: "集成",
      jobs: "任务"
    }
  },
  accounts: {
    navLabel: "账户",
    title: "账户",
    subtitle: "管理最多 5 个独立预算——家庭、企业、学校等。",
    createTitle: "创建账户",
    umbrellaLabel: "类型",
    nameLabel: "账户名称",
    namePlaceholder: "例如：我们的家庭",
    create: "创建账户",
    cancel: "取消",
    maxReached: "你已经有了 5 个账户。删除一个以腾出空间。",
    umbrella: {
      family: "家庭",
      couple: "情侣",
      business: "企业",
      school: "学校",
      friends: "朋友",
      charity: "慈善",
      shopping: "购物"
    },
    defaultName: {
      family: "我们的家庭",
      couple: "我们的伴侣",
      business: "企业账目",
      school: "学校基金",
      friends: "朋友圈",
      charity: "慈善活动",
      shopping: "购物清单"
    },
    invite: "邀请",
    inviteByCode: "通过共享码邀请",
    shareCodePlaceholder: "粘贴朋友的共享码",
    inviteLink: "邀请链接",
    inviteQR: "二维码",
    copyLink: "复制链接",
    copyCode: "复制代码",
    rotateCode: "重置邀请码",
    members: "成员",
    leave: "离开账户",
    removeMember: "移除",
    delete: "删除账户",
    acceptInvite: "接受",
    declineInvite: "拒绝",
    pendingInvites: "待处理的邀请",
    switchTo: "打开",
    role: {
      owner: "所有者",
      member: "成员"
    },
    joinTitle: "加入账户",
    joinPrompt: "扫描二维码或打开邀请链接以加入。",
    joined: "你已加入",
    invalidCode: "该邀请码无效。"
  },
  localeSwitcher: {
    label: "语言",
    options: {
      en: "English",
      th: "ไทย"
    }
  },
  welcome: {
    brand: "Budget Boss",
    heading: "打开你的 Budget Boss 面板",
    description: "登录以解锁你的根流程。之后，Budget Boss 可以根据你保存的启动进度，将你引导至一次性启动问卷或直达登录面板。",
    openSignIn: "打开登录",
    openSignUp: "打开注册",
    privacyPromise: "默认私密。仅在需要时设置。",
    quickReasonsAria: "欢迎快速理由",
    quickReasons: {
      signInFirst: {
        title: "先登录",
        description: "在应用决定你是否需要设置或登录面板之前，先打开你的账户。"
      },
      keepItShort: {
        title: "保持第一步简短",
        description: "启动问卷仅在登录后、且你的首次运行进度仍未完成时出现。"
      },
      moveWithoutSprawl: {
        title: "无杂乱地推进",
        description: "Budget Boss 让入口路径紧凑、可读，并适合在小屏幕上快速浏览。"
      }
    },
    rootFlow: "根流程",
    authFirstThenSetup: "先认证，再设置",
    rootFlowDescription: "未登录的访客停留在此欢迎窗口。已登录的访客仅在首次运行设置仍需完成时，才进入启动问卷。",
    whatChangesNext: "接下来有什么变化",
    nextSteps: {
      signIn: "当你已有账户时登录。",
      signUp: "在设置开始前需要新账户时注册。",
      finishWizard: "完成一次启动问卷，之后再次访问时返回登录面板。"
    }
  },
  launchWizard: {
    kicker: "启动问卷",
    title: "粗略支出",
    description: "先添加大致的经常性成本，这样 Budget Boss 启动时就能有一个实用的资金基准，而不是空白面板。",
    topCategoriesTitle: "常见支出名称",
    entryLabel: "支出名称",
    entryPlaceholder: "搜索或选择常见支出",
    customTitleLabel: "自定义支出名称",
    customTitlePlaceholder: "当列表不适用时使用此项",
    amountLabel: "大致每月金额",
    addExpense: "添加支出",
    finish: "完成启动",
    summaryTitle: "粗略条目",
    emptySummary: "尚未添加任何支出。",
    helperTitle: "为什么先做这个",
    helperDescription: "这第一个弹窗保持轻量：粗略分类、粗略金额，然后是正常的应用流程。",
    currentCountLabel: "已保存的分类",
    errors: {
      titleRequired: "请选择一个常见支出名称，或输入自定义名称。",
      amountRequired: "请输入大于零的粗略每月金额。",
      atLeastOne: "完成启动前，请至少添加一个粗略支出。",
      saveFailed: "无法在此浏览器中保存启动设置。"
    },
    categories: {
      rentMortgage: "房租或按揭",
      groceries: "食品杂货",
      utilities: "水电煤气",
      transportFuel: "交通或燃油",
      phoneInternet: "电话或网络",
      insurance: "保险",
      debtPayments: "债务偿还",
      healthcare: "医疗健康",
      childcareFamilySupport: "育儿或家庭支持",
      funEntertainment: "娱乐或休闲"
    }
  },
  authPanel: {
    secureAccess: "安全访问",
    useGoogleToStart: "创建你的账户",
    useGoogleToContinue: "使用你的账户",
    googleOnly: "Convex Auth 创建并保护 Budget Boss 账户。",
    secureSignIn: "使用你的电子邮件和密码，在任何设备上打开同一个账户。",
    gmailPrivacy: "登录无需 Google OAuth 客户端或用户管理的环境文件。",
    minimalData: "Budget Boss 仅保留运行所需的最少账户、工作区、偏好和集成数据。",
    whyThisStepExists: "为何存在此步骤",
    localProfileFirst: "本地档案优先",
    localProfileDescription: "Budget Boss 验证 Convex Auth 账户，然后一次性创建你的本地档案、个人工作区和默认工作区偏好，以便应用能在服务器上加载正确的数据形态。"
  },
  signIn: {
    eyebrow: "登录",
    title: "打开你的预算面板",
    description: "使用你的 Budget Boss 账户，然后让应用在仪表盘打开前，为你的工作区完成本地设置。",
    needAccount: "需要账户？",
    openSignUp: "打开注册",
    continueWithGoogle: "登录",
    submit: "登录",
    emailLabel: "电子邮件",
    passwordLabel: "密码",
    privacy: "用户无需添加环境文件。应用所有者一次性配置 Convex，用户在此登录。",
    setupRequiredTitle: "Convex Auth 未配置",
    setupRequiredDescription: "使用此登录方式前，请先连接 Convex 部署。"
  },
  signUp: {
    eyebrow: "创建账户",
    title: "创建你的预算账户",
    description: "选择一个电子邮件和密码。Budget Boss 将在 Convex 中创建你的账户，并完成本地工作区设置。",
    haveAccount: "已有账户？",
    openSignIn: "打开登录",
    submit: "创建账户",
    emailLabel: "电子邮件",
    passwordLabel: "密码",
    privacy: "请至少使用 8 个字符。忘记密码？使用登录屏幕上的链接通过电子邮件重置。"
  },
  authContinue: {
    eyebrow: "继续",
    missingEmailTitle: "添加电子邮件以完成设置",
    missingEmailDescription: "Budget Boss 在本地设置完成前，需要一个电子邮件支持的 Convex 账户。",
    missingEmailHelp: "创建或使用电子邮件和密码账户登录，然后返回此处完成设置。",
    title: "完成你的本地设置",
    description: "Budget Boss 在仪表盘能为此账户加载服务器端数据前，需要一个本地档案和一个个人工作区。",
    whatHappensNext: "接下来会发生什么",
    oneSafeBootstrap: "一次安全引导",
    oneSafeBootstrapDescription: "继续操作会一次性创建任何缺失的记录，在后续登录时重复使用，然后打开你的仪表盘并选中由此产生的工作区。",
    relinkConflict: "此电子邮件已关联到另一个账户。请在此退出登录，切换到原始登录方式，或在继续前联系支持。",
    bootstrapIssueTitle: "设置需要关注",
    bootstrapIssueDescription: "Budget Boss 无法为此会话完成安全的 Convex 设置步骤。",
    bootstrapIssueHelp: "在应用所有者检查 Convex Auth 和 CONVEX_SYNC_SECRET 设置后重试。",
    continueToDashboard: "继续前往仪表盘",
    rerunSafe: "如果你的会话已经创建了本地记录，可以安全地再次运行。"
  },
  securitySettings: {
    eyebrow: "安全设置",
    title: "打开你的账户安全控制。",
    description: "Budget Boss 使用 Convex Auth 的电子邮件和密码账户。使用登录时的\"忘记密码？\"链接通过电子邮件重置。电子邮件验证是计划中的后续功能。",
    googleAccountEyebrow: "账户凭据",
    googleAccountTitle: "使用你的 Budget Boss 账户。",
    googleAccountDescription: "你的账户在 Convex Auth 中创建，使用注册时选择的电子邮件和密码。",
    openGoogleSecurity: "使用至少 8 个字符的强且唯一的密码。",
    openGooglePermissions: "忘记密码？使用登录屏幕上的链接通过电子邮件重置。电子邮件验证是计划中的后续功能。",
    sessionAccessEyebrow: "会话访问",
    sessionAccessTitle: "安全地切换账户。",
    sessionAccessDescription: "如果你需要返回登录屏幕并使用不同的账户，请在此退出登录。",
    privacyEyebrow: "隐私",
    privacyItems: {
      signInOnly: "Convex Auth 验证登录并返回你的账户身份。",
      minimalData: "Budget Boss 仅保留运行所需的本地账户、工作区、偏好和集成数据。",
      noMarketingData: "不记录或出售任何营销数据。",
      personalizationUserOnly: "个性化仅限用户本人，不与经纪商或第三方广告商共享。",
      gmailPrivacy: "登录无需 Google OAuth 客户端或用户管理的环境文件。"
    }
  },
  notesPage: {
    eyebrow: "工具",
    title: "笔记",
    description: "一个用于提醒和粗略预算想法的快捷位置。"
  },
  notesBoard: {
    regionLabel: "笔记板",
    inputLabel: "新建笔记",
    inputPlaceholder: "输入一条笔记，然后按 Enter 或点击添加笔记…",
    addNote: "添加笔记",
    emptyState: "还没有笔记。在上方添加一条。",
    deleteNote: "删除 {text}"
  },
  calculatorPage: {
    eyebrow: "工具",
    title: "计算器",
    description: "用于预算检查的快速算术。"
  },
  calculator: {
    regionLabel: "计算器",
    clearButton: "清除"
  },
  learnPage: {
    eyebrow: "学习！",
    title: "漫画式课程，针对下一步重要的资金动作。",
    description: "针对下一步重要的资金动作的简短课程。",
    storyCuesEyebrow: "故事提示",
    storyCuesTitle: "下一步的快捷提示",
    storyCuesDescription: "每节课一个清晰的提示和一个动作。",
    blueprintPicksEyebrow: "蓝图精选",
    blueprintPicksTitle: "从这里开始",
    blueprintPicksDescription: "与当前蓝图压力匹配的最高信号课程。",
    streakEyebrow: "保持连续",
    streakTitle: "下一个",
    streakDescription: "当你想要一个更有用的概念而无需长时间滚动时，提供常青的复习内容。"
  },
  dashboardPage: {
    eyebrow: "仪表盘",
    title: "互动广告牌",
    description: "将你的工作区、工具和实时信号集中在一个面板。",
    workspaceLabel: "工作区",
    cityLabel: "城市",
    motionLabel: "动效",
    currentModeEyebrow: "当前模式",
    checkInSubmitted: "已签到",
    checkInNeeded: "待签到",
    demoWorkspace: "演示",
    liveMembership: "实时成员",
    windowProfileEyebrow: "窗口配置",
    layoutLabel: "布局",
    motionValueLabel: "动效",
    noWorkspaceSelected: "未选择工作区",
    noWorkspaceRole: "无",
    roles: {
      owner: "所有者",
      editor: "编辑者",
      approver: "审批者",
      read_only: "只读"
    },
    homeBaseKicker: "面板锚点",
    homeBaseTitle: "共享家庭基地",
    homeBaseDescription: "保留一个共享区域用于设置和任务。",
    homeBaseEmptyState: "尚未保存共享区域。",
    homeBaseActionLabel: "打开设置向导",
    themePresets: {
      midnight: "午夜"
    },
    layoutPresets: {
      launcher_grid: "启动器网格"
    },
    motionPresets: {
      cinematic: "电影感"
    }
  },
  broadcastBar: {
    kicker: "本地区域",
    title: "本地区域",
    fallbackTicker: "预算更新"
  },
  launcherGrid: {
    kicker: "工具",
    title: "热门预算工具",
    description: "无需额外滚动即可打开下一个工具。"
  },
  liveBriefing: {
    kicker: "简报",
    title: "实时简报",
    description: "可信主题，为快速浏览而精简。",
    sourceStatus: {
      live: "实时",
      fallback: "备用"
    },
    fieldCount: "{count} 个字段",
    emptyState: "还没有简报主题。下次刷新后再来看看。"
  },
  dailyCheckIn: {
    kicker: "签到通道",
    title: "记录今天的数字",
    description: "一个数字让 {workspaceName} 保持一致。",
    liveSubmissionUnavailable: "实时输入已锁定",
    submitting: "发送中",
    submittedToday: "今天已发送",
    readyToSubmit: "现在可以提交",
    plannedSpendLabel: "今天的计划支出",
    lockedDate: "已锁定至 {dateLabel}（{workspaceName}）。",
    disabledHint: "登录以发送实时签到。",
    validationError: "在发送今天的签到前，请输入一个非负计划支出。",
    submitError: "暂时无法发送今天的签到。",
    submitButton: "发送今天的签到",
    submittingButton: "正在发送签到",
    workspaceFallback: "此工作区",
    cashStatus: {
      positive: "正数",
      negative: "负数"
    },
    severity: {
      warning: "警告",
      critical: "严重"
    },
    emptyHeadline: "此工作区尚无签到。",
    noCheckInYet: "尚无签到。",
    submittedAt: "已于 {submittedAt} 发送。",
    plannedSpendMetric: "计划支出",
    openAlertsMetric: "未处理提醒",
    netCashAfterPlanMetric: "计划后净现金",
    emptyAlertsTitle: "尚无提醒。",
    emptyAlertsDescription: "需要刷新时请再次发送。"
  },
  liveAlerts: {
    kicker: "提醒通道",
    title: "关注压力点",
    description: "预测的提醒会首先出现在这里。",
    selectWorkspace: "选择工作区以查看提醒。",
    standbyNoUrl: "待机。请添加 Convex URL 以启用提醒。",
    standbyNoBridge: "待机。实时认证尚未就绪。",
    loading: "正在加载提醒…",
    viewerSync: "正在同步查看器。提醒同步完成后显示。",
    workspaceSync: "正在等待工作区访问同步。",
    empty: "还没有实时提醒。首个预计签到后会出现。",
    checkInDate: "签到 {date}",
    severity: {
      info: "信息",
      warning: "警告",
      critical: "严重"
    }
  },
  integrationActions: {
    openSetupWizard: "打开设置向导",
    openOfficialLogin: "打开官方登录",
    openOfficialDocs: "打开官方文档"
  },
  integrationsHub: {
    eyebrow: "连接中心",
    title: "只连接你能快速核实并信任的服务商。",
    description: "每个板块都让官方路由、风险和下一步操作一目了然。",
    guardrails: {
      officialRoutesFirst: {
        label: "官方路由",
        title: "优先使用服务商官方的登录、文档或设置路由。"
      },
      noSilentSharing: {
        label: "不静默共享",
        title: "只有你明确连接的服务商才会收到所需的最小数据。"
      },
      revokePathStaysObvious: {
        label: "易于撤销",
        title: "你应始终能快速找到断开或撤销连接的入口。"
      }
    },
    groupedScan: "分组浏览",
    providerCount: "{count} 个服务商",
    categories: {
      ai: {
        label: "AI 助手",
        summary: "模型辅助工具与提示词密集型工作流工具。"
      },
      banking: {
        label: "银行通道",
        summary: "账户验证与官方银行连接。"
      },
      investing: {
        label: "投资",
        summary: "权限清晰的券商与投资组合访问。"
      },
      payroll: {
        label: "薪资",
        summary: "收入与员工设置，校验清晰。"
      },
      tax: {
        label: "税务与会计",
        summary: "文档与账本访问，信任提示可见。"
      },
      finance_ops: {
        label: "财务运营",
        summary: "有意保持简单的费用、卡片与运营工具。"
      }
    }
  },
  providerCard: {
    categoryLabel: {
      ai: "AI",
      banking: "银行",
      investing: "投资",
      payroll: "薪资",
      tax: "税务",
      finance_ops: "财务运营"
    },
    categorySummary: {
      ai: "助手工具与提示词访问。",
      banking: "官方银行与账户链接。",
      investing: "投资组合与券商访问。",
      payroll: "收入与员工设置。",
      tax: "税务与账本工作流。",
      finance_ops: "费用与资金运营工具。"
    },
    risk: {
      low: "低风险",
      medium: "中风险",
      high: "高风险"
    },
    setupState: {
      setupWizard: "设置向导",
      guidanceOnly: "仅指引"
    },
    quickActions: "快捷操作"
  },
  integrationProviderPages: {
    claude: {
      eyebrow: "Claude 设置",
      title: "连接 Claude",
      description: "优先使用 Anthropic 官方路由。安全详情见下方。"
    },
    openai: {
      eyebrow: "OpenAI 设置",
      title: "连接 OpenAI",
      description: "优先使用 OpenAI 官方路由。安全详情见下方。"
    },
    copilot: {
      eyebrow: "GitHub Copilot 设置",
      title: "连接 GitHub Copilot",
      description: "先检查仓库与提示词访问权限。安全详情见下方。",
      systemAccessMessage: "系统影响范围：启用 GitHub Copilot 前，请检查扩展、仓库与提示词访问权限。",
      riskChecklistTitle: "风险检查清单",
      riskChecklistItems: {
        repositoryAccess: "仓库影响范围：确认该工具可检查的仓库与文件。",
        officialFlow: "官方流程：仅使用 GitHub Copilot 官方身份验证流程。",
        revokeAccess: "撤销路径：如果工作区不再需要，请立即撤销访问。"
      }
    },
    openclaw: {
      eyebrow: "OpenClaw 设置",
      title: "连接 OpenClaw",
      description: "先检查系统影响范围与提示词注入风险。安全详情见下方。",
      systemAccessMessage: "系统影响范围：启用 OpenClaw 前，请核实本地系统访问、数据路径、模型路由与提示词注入边界。",
      riskChecklistTitle: "高风险连接",
      riskChecklistItems: {
        localReach: "本地影响范围：检查 OpenClaw 可触及的本地文件、工具或 shell。",
        promptRouting: "提示词安全：启用集成前，确认提示词路由、存储路径与注入边界。",
        oneClickRevoke: "一键撤销：当你的信任模型变化时，使用一键撤销。"
      }
    },
    perplexity: {
      eyebrow: "Perplexity 设置",
      title: "连接 Perplexity",
      description: "优先使用 Perplexity 官方路由。安全详情见下方。"
    },
    mistral: {
      eyebrow: "Mistral 设置",
      title: "连接 Mistral",
      description: "优先使用 Mistral 官方路由。安全详情见下方。"
    },
    wise: {
      eyebrow: "Wise 设置",
      title: "连接 Wise",
      description: "优先使用 Wise 官方路由。安全详情见下方。"
    },
    revolut: {
      eyebrow: "Revolut 设置",
      title: "连接 Revolut",
      description: "优先使用 Revolut 官方路由。安全详情见下方。"
    },
    paypal: {
      eyebrow: "PayPal 设置",
      title: "连接 PayPal",
      description: "优先使用 PayPal 官方路由。安全详情见下方。"
    },
    deel: {
      eyebrow: "Deel 设置",
      title: "连接 Deel",
      description: "优先使用 Deel 官方路由。安全详情见下方。"
    },
    xero: {
      eyebrow: "Xero 设置",
      title: "连接 Xero",
      description: "优先使用 Xero 官方路由。安全详情见下方。"
    }
  },
  integrationsShared: {
    backToConnectionHub: "返回连接中心",
    tools: "工具",
    privacyShieldTitle: "隐私护盾",
    privacyShieldDescription: "连接前先查看 {providerLabel} 能接收哪些数据。",
    disclosureHeadings: {
      minimumData: "最小数据",
      noSilentSharing: "不静默共享",
      revokeAnyTime: "随时撤销"
    },
    disclosures: {
      minimumData: "仅明确连接的服务商会收到所需的最小数据。",
      noSilentSharing: "不静默共享，也不自动跨服务商路由。",
      revokeAnyTime: "你可以随时撤销并断开该服务商的连接。"
    },
    officialLinksTitle: "官方链接",
    officialLogin: "官方登录",
    officialDocs: "官方文档",
    privacyBadge: "不静默共享",
    systemAccessWarning: "系统访问警告"
  },
  wizard: {
    title: "设置你的预算",
    description: "回答 10 个快速问题，建立你的预算基准",
    income: {
      title: "月收入",
      subtitle: "工资、副业收入、投资——全部合计",
      placeholder: "例如 35000",
      helper: "输入月总收入（THB）"
    },
    rent: {
      title: "房租 / 住房成本",
      subtitle: "公寓、商品房、独立屋租金或房贷",
      placeholder: "例如 12000",
      helper: "月租金或房贷还款（THB）"
    },
    transport: {
      title: "交通费用",
      subtitle: "BTS/MRT、公交、摩托、燃油、Grab/Bolt",
      placeholder: "例如 3000",
      helper: "月交通总费用（THB）"
    },
    phoneInternet: {
      title: "电话 / 网络",
      subtitle: "手机套餐、家庭宽带、流媒体套餐",
      placeholder: "例如 800",
      helper: "月电话与网络费用（THB）"
    },
    subscriptions: {
      title: "订阅服务",
      subtitle: "Netflix、Spotify、健身房、应用订阅",
      placeholder: "例如 500",
      helper: "月订阅总费用（THB）"
    },
    entertainment: {
      title: "娱乐",
      subtitle: "电影、咖啡、游戏、爱好、外出就餐",
      placeholder: "例如 3000",
      helper: "月娱乐预算（THB）"
    },
    healthcare: {
      title: "医疗健康",
      subtitle: "药品、牙医、医院、保险自付额",
      placeholder: "例如 1000",
      helper: "月医疗健康费用（THB）"
    },
    savingsRate: {
      title: "储蓄率",
      subtitle: "你想存下收入的百分之多少？",
      placeholder: "例如 20",
      helper: "目标储蓄百分比（0-50%）"
    },
    riskTolerance: {
      title: "风险承受能力",
      subtitle: "你能承受多少市场波动？",
      low: "低——保本优先",
      medium: "中——均衡",
      high: "高——注重增长"
    },
    locationConsent: {
      title: "位置访问",
      subtitle: "允许获取位置以查看本地新闻与燃油价格",
      prompt: "启用位置以获取附近的燃油价格与本地财经新闻"
    }
  }
};
