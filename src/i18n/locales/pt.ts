import type { LocaleMessages } from './en';

export const pt: LocaleMessages = {
  appNav: {
    mobileNavigation: "Navegação do app no celular",
    desktopNavigation: "Navegação do app",
    openDashboard: "Ir para o painel",
    routes: {
      dashboard: "Painel",
      startSmart: "Início inteligente",
      calculator: "Calculadora",
      notes: "Notas",
      learn: "Aprender",
      integrations: "Integrações",
      jobs: "Empregos"
    }
  },
  accounts: {
    navLabel: "Contas",
    title: "Contas",
    subtitle: "Gerencie até 5 orçamentos independentes — família, negócio, escola e mais.",
    createTitle: "Criar uma conta",
    umbrellaLabel: "Tipo",
    nameLabel: "Nome da conta",
    namePlaceholder: "ex.: Nosso Lar",
    create: "Criar conta",
    cancel: "Cancelar",
    maxReached: "Você já tem 5 contas. Exclua uma para abrir espaço.",
    umbrella: {
      family: "Família",
      couple: "Casal",
      business: "Negócio",
      school: "Escola",
      friends: "Amigos",
      charity: "Caridade",
      shopping: "Compras"
    },
    defaultName: {
      family: "Nosso Lar",
      couple: "Nosso Casal",
      business: "Livros do negócio",
      school: "Fundo escolar",
      friends: "Círculo de amigos",
      charity: "Campanha de caridade",
      shopping: "Lista de compras"
    },
    invite: "Convidar",
    inviteByCode: "Convidar por código de compartilhamento",
    shareCodePlaceholder: "Cole o código de compartilhamento de um amigo",
    inviteLink: "Link de convite",
    inviteQR: "Código QR",
    copyLink: "Copiar link",
    copyCode: "Copiar código",
    rotateCode: "Girar código de convite",
    members: "Membros",
    leave: "Sair da conta",
    removeMember: "Remover",
    delete: "Excluir conta",
    acceptInvite: "Aceitar",
    declineInvite: "Recusar",
    pendingInvites: "Convites pendentes",
    switchTo: "Abrir",
    role: {
      owner: "Proprietário",
      member: "Membro"
    },
    joinTitle: "Entrar em uma conta",
    joinPrompt: "Escaneie um código QR ou abra o link de convite para entrar.",
    joined: "Você entrou",
    invalidCode: "Esse código de convite não é válido."
  },
  localeSwitcher: {
    label: "Idioma",
    options: {
      en: "English",
      th: "ไทย"
    }
  },
  welcome: {
    brand: "Budget Boss",
    heading: "Abra o seu painel do Budget Boss",
    description: "Faça login para desbloquear seu fluxo raiz. Depois, o Budget Boss pode enviá-lo para o questionário de inicialização única ou direto para o painel de entrada com base no seu progresso de inicialização salvo.",
    openSignIn: "Abrir login",
    openSignUp: "Abrir cadastro",
    privacyPromise: "Privado por padrão. Configure apenas se necessário.",
    quickReasonsAria: "Motivos rápidos de boas-vindas",
    quickReasons: {
      signInFirst: {
        title: "Faça login primeiro",
        description: "Abra sua conta antes que o app decida se você precisa de configuração ou do seu painel de entrada."
      },
      keepItShort: {
        title: "Mantenha o primeiro passo curto",
        description: "O questionário de inicialização aparece somente após o login e apenas quando o progresso da primeira execução ainda está incompleto."
      },
      moveWithoutSprawl: {
        title: "Avance sem espalhar",
        description: "O Budget Boss mantém o caminho de entrada denso, legível e pronto para leitura rápida em telas menores."
      }
    },
    rootFlow: "Fluxo raiz",
    authFirstThenSetup: "Autenticação primeiro, depois configuração",
    rootFlowDescription: "Visitantes desconectados ficam nesta janela de boas-vindas. Visitantes conectados seguem para o questionário de inicialização apenas quando a configuração da primeira execução ainda precisa ser concluída.",
    whatChangesNext: "O que muda a seguir",
    nextSteps: {
      signIn: "Faça login se você já tem uma conta.",
      signUp: "Cadastre-se se precisar de uma conta nova antes de começar a configuração.",
      finishWizard: "Conclua o questionário de inicialização uma vez e retorne ao painel de entrada nas visitas futuras."
    }
  },
  launchWizard: {
    kicker: "Questionário de inicialização",
    title: "Gastos estimados",
    description: "Adicione primeiro custos recorrentes aproximados para que o Budget Boss abra com uma base financeira prática em vez de um painel em branco.",
    topCategoriesTitle: "Títulos comuns de despesas",
    entryLabel: "Título da despesa",
    entryPlaceholder: "Busque ou selecione uma despesa comum",
    customTitleLabel: "Título de despesa personalizado",
    customTitlePlaceholder: "Use isto quando a lista não servir",
    amountLabel: "Valor mensal aproximado",
    addExpense: "Adicionar despesa",
    finish: "Concluir inicialização",
    summaryTitle: "Entradas estimadas",
    emptySummary: "Nenhuma despesa adicionada ainda.",
    helperTitle: "Por que isto vem primeiro",
    helperDescription: "Este primeiro pop-up permanece leve: categorias aproximadas, valores aproximados e então o fluxo normal do app.",
    currentCountLabel: "Categorias salvas",
    errors: {
      titleRequired: "Escolha um título de despesa comum ou digite um personalizado.",
      amountRequired: "Digite um valor mensal aproximado maior que zero.",
      atLeastOne: "Adicione pelo menos uma despesa estimada antes de concluir a inicialização.",
      saveFailed: "Não foi possível salvar as configurações de inicialização neste navegador."
    },
    categories: {
      rentMortgage: "Aluguel ou hipoteca",
      groceries: "Mercado",
      utilities: "Serviços públicos",
      transportFuel: "Transporte ou combustível",
      phoneInternet: "Telefone ou internet",
      insurance: "Seguro",
      debtPayments: "Pagamentos de dívidas",
      healthcare: "Saúde",
      childcareFamilySupport: "Cuidado de filhos ou apoio familiar",
      funEntertainment: "Diversão ou entretenimento"
    }
  },
  authPanel: {
    secureAccess: "Acesso seguro",
    useGoogleToStart: "Crie sua conta",
    useGoogleToContinue: "Use sua conta",
    googleOnly: "O Convex Auth cria e protege as contas do Budget Boss.",
    secureSignIn: "Use seu e-mail e senha para abrir a mesma conta em qualquer dispositivo.",
    gmailPrivacy: "Nenhum cliente OAuth do Google ou arquivo de ambiente gerenciado pelo usuário é necessário para login.",
    minimalData: "O Budget Boss mantém apenas os dados mínimos de conta, espaço de trabalho, preferência e integração de que precisa para funcionar.",
    whyThisStepExists: "Por que este passo existe",
    localProfileFirst: "Perfil local primeiro",
    localProfileDescription: "O Budget Boss verifica a conta do Convex Auth e então cria uma vez seu perfil local, espaço de trabalho pessoal e preferência de espaço de trabalho padrão para que o app possa carregar o formato de dados correto no servidor."
  },
  signIn: {
    eyebrow: "Entrar",
    title: "Abra seu painel de orçamento",
    description: "Use sua conta do Budget Boss e deixe o app concluir a configuração local do seu espaço de trabalho antes de o painel abrir.",
    needAccount: "Precisa de uma conta?",
    openSignUp: "Abrir cadastro",
    continueWithGoogle: "Entrar",
    submit: "Entrar",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    privacy: "Os usuários não adicionam arquivos de ambiente. O dono do app configura o Convex uma vez e os usuários entram aqui.",
    setupRequiredTitle: "O Convex Auth não está configurado",
    setupRequiredDescription: "Conecte a implantação do Convex antes de usar este método de login."
  },
  signUp: {
    eyebrow: "Criar conta",
    title: "Crie sua conta de orçamento",
    description: "Escolha um e-mail e uma senha. O Budget Boss criará sua conta no Convex e concluirá a configuração local do espaço de trabalho em seguida.",
    haveAccount: "Já tem uma conta?",
    openSignIn: "Abrir login",
    submit: "Criar conta",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    privacy: "Use pelo menos 8 caracteres. Esqueceu sua senha? Use o link na tela de login para redefini-la por e-mail."
  },
  authContinue: {
    eyebrow: "Continuar",
    missingEmailTitle: "Adicione um e-mail para concluir a configuração",
    missingEmailDescription: "O Budget Boss exige uma conta do Convex com e-mail antes que a configuração local possa terminar.",
    missingEmailHelp: "Crie ou entre com uma conta de e-mail e senha e retorne aqui para concluir a configuração.",
    title: "Conclua sua configuração local",
    description: "O Budget Boss precisa de um perfil local e de um espaço de trabalho pessoal antes que o painel possa carregar dados do servidor para esta conta.",
    whatHappensNext: "O que acontece a seguir",
    oneSafeBootstrap: "Uma inicialização segura",
    oneSafeBootstrapDescription: "A ação continuar cria os registros ausentes uma vez, reutiliza-os em logins posteriores e então abre seu painel com o espaço de trabalho resultante selecionado.",
    relinkConflict: "Este e-mail já está vinculado a uma conta diferente. Saia aqui, troque para o método de login original ou contate o suporte antes de continuar.",
    bootstrapIssueTitle: "A configuração precisa de atenção",
    bootstrapIssueDescription: "O Budget Boss não conseguiu concluir a etapa segura de configuração do Convex para esta sessão.",
    bootstrapIssueHelp: "Tente novamente depois que o dono do app verificar as configurações do Convex Auth e CONVEX_SYNC_SECRET.",
    continueToDashboard: "Continuar para o painel",
    rerunSafe: "É seguro executar novamente se sua sessão já criou os registros locais."
  },
  securitySettings: {
    eyebrow: "Configurações de segurança",
    title: "Abra os controles de segurança da sua conta.",
    description: "O Budget Boss usa contas do Convex Auth com e-mail e senha. Use o link \"Esqueceu a senha?\" no login para redefini-la por e-mail. A verificação de e-mail é um acompanhamento planejado.",
    googleAccountEyebrow: "Credenciais da conta",
    googleAccountTitle: "Use sua conta do Budget Boss.",
    googleAccountDescription: "Sua conta é criada no Convex Auth com o e-mail e a senha que você escolher ao se cadastrar.",
    openGoogleSecurity: "Use uma senha forte e exclusiva com pelo menos 8 caracteres.",
    openGooglePermissions: "Esqueceu a senha? Use o link na tela de login para redefini-la por e-mail. A verificação de e-mail é um acompanhamento planejado.",
    sessionAccessEyebrow: "Acesso de sessão",
    sessionAccessTitle: "Troque de conta com segurança.",
    sessionAccessDescription: "Saia aqui se precisar voltar à tela de login e usar uma conta diferente.",
    privacyEyebrow: "Privacidade",
    privacyItems: {
      signInOnly: "O Convex Auth verifica o login e retorna a identidade da sua conta.",
      minimalData: "O Budget Boss mantém apenas os dados locais de conta, espaço de trabalho, preferência e integração de que precisa para funcionar.",
      noMarketingData: "Nenhum dado de marketing é registrado ou vendido.",
      personalizationUserOnly: "A personalização fica apenas no usuário e não é compartilhada com corretores ou anunciantes de terceiros.",
      gmailPrivacy: "Nenhum cliente OAuth do Google ou arquivo de ambiente gerenciado pelo usuário é necessário para login."
    }
  },
  notesPage: {
    eyebrow: "Ferramentas",
    title: "Notas",
    description: "Um lugar rápido para lembretes e pensamentos soltos de orçamento."
  },
  notesBoard: {
    regionLabel: "Quadro de notas",
    inputLabel: "Nova nota",
    inputPlaceholder: "Digite uma nota e pressione Enter ou Adicionar nota…",
    addNote: "Adicionar nota",
    emptyState: "Nenhuma nota ainda. Adicione uma acima.",
    deleteNote: "Excluir {text}"
  },
  calculatorPage: {
    eyebrow: "Ferramentas",
    title: "Calculadora",
    description: "Aritmética rápida para verificações de orçamento."
  },
  calculator: {
    regionLabel: "Calculadora",
    clearButton: "Limpar"
  },
  learnPage: {
    eyebrow: "Aprenda!",
    title: "Lições em tirinhas para o próximo movimento de dinheiro que importa.",
    description: "Lições curtas para o próximo movimento de dinheiro que importa.",
    storyCuesEyebrow: "Pistas da história",
    storyCuesTitle: "Pistas rápidas para o próximo movimento",
    storyCuesDescription: "Uma pista clara e uma ação por lição.",
    blueprintPicksEyebrow: "Escolhas do plano",
    blueprintPicksTitle: "Comece aqui",
    blueprintPicksDescription: "Lições de maior sinal alinhadas à sua pressão de plano atual.",
    streakEyebrow: "Mantenha a sequência",
    streakTitle: "A seguir",
    streakDescription: "Atualizações eternas quando você quiser mais um conceito útil sem rolagem longa."
  },
  dashboardPage: {
    eyebrow: "Painel",
    title: "Quadro interativo",
    description: "Mantenha seu espaço de trabalho, ferramentas e sinais ao vivo em um só painel.",
    workspaceLabel: "Espaço de trabalho",
    cityLabel: "Cidade",
    motionLabel: "Movimento",
    currentModeEyebrow: "Modo atual",
    checkInSubmitted: "Registrado",
    checkInNeeded: "Registro pendente",
    demoWorkspace: "Demonstração",
    liveMembership: "Membro ao vivo",
    windowProfileEyebrow: "Perfil da janela",
    layoutLabel: "Layout",
    motionValueLabel: "Movimento",
    noWorkspaceSelected: "Nenhum espaço de trabalho selecionado",
    noWorkspaceRole: "nenhum",
    roles: {
      owner: "Proprietário",
      editor: "Editor",
      approver: "Aprovador",
      read_only: "Somente leitura"
    },
    homeBaseKicker: "Ancoragem do painel",
    homeBaseTitle: "Base compartilhada do lar",
    homeBaseDescription: "Mantenha uma região compartilhada pronta para configuração e empregos.",
    homeBaseEmptyState: "Nenhuma região compartilhada salva ainda.",
    homeBaseActionLabel: "Abrir o assistente de configuração",
    themePresets: {
      midnight: "Meia-noite"
    },
    layoutPresets: {
      launcher_grid: "Grade de lançadores"
    },
    motionPresets: {
      cinematic: "Cinematográfico"
    }
  },
  broadcastBar: {
    kicker: "Área local",
    title: "Área local",
    fallbackTicker: "Atualizações de orçamento"
  },
  launcherGrid: {
    kicker: "Ferramentas",
    title: "Ferramentas de orçamento populares",
    description: "Abra a próxima ferramenta sem a rolagem extra."
  },
  liveBriefing: {
    kicker: "Briefing",
    title: "Briefing ao vivo",
    description: "Tópicos confiáveis, ajustados para leitura rápida.",
    sourceStatus: {
      live: "Ao vivo",
      fallback: "Reserva"
    },
    fieldCount: "{count} campos",
    emptyState: "Nenhum tópico de briefing ainda. Volte após a próxima atualização."
  },
  dailyCheckIn: {
    kicker: "Via de registro",
    title: "Registre o número de hoje",
    description: "Um número mantém {workspaceName} alinhado.",
    liveSubmissionUnavailable: "Envio ao vivo bloqueado",
    submitting: "Enviando",
    submittedToday: "Enviado hoje",
    readyToSubmit: "Pronto agora",
    plannedSpendLabel: "Gasto planejado para hoje",
    lockedDate: "Bloqueado para {dateLabel} de {workspaceName}.",
    disabledHint: "Faça login para enviar registros ao vivo.",
    validationError: "Digite um gasto planejado não negativo antes de enviar o registro de hoje.",
    submitError: "Não foi possível enviar o registro de hoje agora.",
    submitButton: "Enviar o registro de hoje",
    submittingButton: "Enviando registro",
    workspaceFallback: "este espaço de trabalho",
    cashStatus: {
      positive: "Positivo",
      negative: "Negativo"
    },
    severity: {
      warning: "Aviso",
      critical: "Crítico"
    },
    emptyHeadline: "Nenhum registro ainda para este espaço de trabalho.",
    noCheckInYet: "Nenhum registro ainda.",
    submittedAt: "Enviado {submittedAt}.",
    plannedSpendMetric: "Gasto planejado",
    openAlertsMetric: "Alertas abertos",
    netCashAfterPlanMetric: "Caixa líquido após o plano",
    emptyAlertsTitle: "Nenhum alerta ainda.",
    emptyAlertsDescription: "Envie novamente quando precisar de uma atualização."
  },
  liveAlerts: {
    kicker: "Via de alerta",
    title: "Vigie os pontos de pressão",
    description: "Alertas projetados chegam aqui primeiro.",
    selectWorkspace: "Selecione um espaço de trabalho para ver os alertas.",
    standbyNoUrl: "Em espera. Adicione a URL do Convex para ativar os alertas.",
    standbyNoBridge: "Em espera. A autenticação em tempo real ainda não está pronta.",
    loading: "Carregando alertas...",
    viewerSync: "Sincronização do visualizador em andamento. Os alertas aparecem após terminar.",
    workspaceSync: "Aguardando a sincronização do acesso ao espaço de trabalho.",
    empty: "Nenhum alerta ao vivo ainda. Eles aparecem após o primeiro registro projetado.",
    checkInDate: "Registro {date}",
    severity: {
      info: "Informação",
      warning: "Aviso",
      critical: "Crítico"
    }
  },
  integrationActions: {
    openSetupWizard: "Abrir o assistente de configuração",
    openOfficialLogin: "Abrir login oficial",
    openOfficialDocs: "Abrir documentação oficial"
  },
  integrationsHub: {
    eyebrow: "Central de conexão",
    title: "Conecte apenas os provedores que você possa verificar e em que confie rapidamente.",
    description: "Cada seção mantém a rota oficial, o risco e a próxima ação fáceis de verificar.",
    guardrails: {
      officialRoutesFirst: {
        label: "Rotas oficiais",
        title: "Use primeiro o login, a documentação ou a rota de configuração oficial do provedor."
      },
      noSilentSharing: {
        label: "Sem compartilhamento silencioso",
        title: "Apenas os provedores que você conectar explicitamente recebem os dados mínimos necessários."
      },
      revokePathStaysObvious: {
        label: "Caminho de revogação fácil",
        title: "Você sempre deve conseguir encontrar o caminho de desconexão ou revogação rapidamente."
      }
    },
    groupedScan: "Verificação agrupada",
    providerCount: "{count} provedores",
    categories: {
      ai: {
        label: "Copilotos de IA",
        summary: "Assistentes de modelo e ferramentas de fluxo de trabalho com muitos prompts."
      },
      banking: {
        label: "Infraestrutura bancária",
        summary: "Verificação de conta e conexões bancárias oficiais."
      },
      investing: {
        label: "Investimentos",
        summary: "Acesso a corretora e carteira com permissões claras."
      },
      payroll: {
        label: "Folha de pagamento",
        summary: "Configuração de renda e colaboradores com verificações claras."
      },
      tax: {
        label: "Impostos e contabilidade",
        summary: "Acesso a documentos e razão contábil com sinais de confiança visíveis."
      },
      finance_ops: {
        label: "Operações financeiras",
        summary: "Ferramentas de despesas, cartões e operações mantidas simples de propósito."
      }
    }
  },
  providerCard: {
    categoryLabel: {
      ai: "IA",
      banking: "Bancos",
      investing: "Investimentos",
      payroll: "Folha de pagamento",
      tax: "Impostos",
      finance_ops: "Operações financeiras"
    },
    categorySummary: {
      ai: "Ferramentas de assistente e acesso a prompts.",
      banking: "Links oficiais de banco e conta.",
      investing: "Acesso a carteira e corretora.",
      payroll: "Renda e configuração de colaboradores.",
      tax: "Fluxos de trabalho fiscais e contábeis.",
      finance_ops: "Ferramentas de despesas e operações monetárias."
    },
    risk: {
      low: "Risco baixo",
      medium: "Risco médio",
      high: "Risco alto"
    },
    setupState: {
      setupWizard: "Assistente de configuração",
      guidanceOnly: "Apenas orientação"
    },
    quickActions: "Ações rápidas"
  },
  integrationProviderPages: {
    claude: {
      eyebrow: "Configuração do Claude",
      title: "Conectar o Claude",
      description: "Use primeiro a rota oficial da Anthropic. Os detalhes de segurança ficam abaixo."
    },
    openai: {
      eyebrow: "Configuração da OpenAI",
      title: "Conectar a OpenAI",
      description: "Use primeiro a rota oficial da OpenAI. Os detalhes de segurança ficam abaixo."
    },
    copilot: {
      eyebrow: "Configuração do GitHub Copilot",
      title: "Conectar o GitHub Copilot",
      description: "Revise primeiro o acesso ao repositório e aos prompts. Os detalhes de segurança ficam abaixo.",
      systemAccessMessage: "Alcance do sistema: Revise a extensão, o repositório e o acesso aos prompts antes de ativar o GitHub Copilot.",
      riskChecklistTitle: "Lista de verificação de riscos",
      riskChecklistItems: {
        repositoryAccess: "Alcance do repositório: Confirme quais repositórios e arquivos a ferramenta pode inspecionar.",
        officialFlow: "Fluxo oficial: Use apenas o fluxo de autenticação oficial do GitHub Copilot.",
        revokeAccess: "Caminho de revogação: Revogue o acesso imediatamente se o espaço de trabalho não precisar mais dele."
      }
    },
    openclaw: {
      eyebrow: "Configuração do OpenClaw",
      title: "Conectar o OpenClaw",
      description: "Revise primeiro o alcance do sistema e a exposição à injeção de prompts. Os detalhes de segurança ficam abaixo.",
      systemAccessMessage: "Alcance do sistema: Verifique o acesso ao sistema local, os caminhos de dados, o roteamento de modelos e os limites de injeção de prompts antes de ativar o OpenClaw.",
      riskChecklistTitle: "Conexão de alto risco",
      riskChecklistItems: {
        localReach: "Alcance local: Verifique quais arquivos, ferramentas ou shells locais o OpenClaw pode alcançar.",
        promptRouting: "Segurança de prompts: Confirme o roteamento de prompts, os caminhos de armazenamento e os limites de injeção antes de ativar a integração.",
        oneClickRevoke: "Revogação com um clique: Use a revogação com um clique se o seu modelo de confiança mudar."
      }
    },
    perplexity: {
      eyebrow: "Configuração da Perplexity",
      title: "Conectar a Perplexity",
      description: "Use primeiro a rota oficial da Perplexity. Os detalhes de segurança ficam abaixo."
    },
    mistral: {
      eyebrow: "Configuração da Mistral",
      title: "Conectar a Mistral",
      description: "Use primeiro a rota oficial da Mistral. Os detalhes de segurança ficam abaixo."
    },
    wise: {
      eyebrow: "Configuração da Wise",
      title: "Conectar a Wise",
      description: "Use primeiro a rota oficial da Wise. Os detalhes de segurança ficam abaixo."
    },
    revolut: {
      eyebrow: "Configuração da Revolut",
      title: "Conectar a Revolut",
      description: "Use primeiro a rota oficial da Revolut. Os detalhes de segurança ficam abaixo."
    },
    paypal: {
      eyebrow: "Configuração do PayPal",
      title: "Conectar o PayPal",
      description: "Use primeiro a rota oficial do PayPal. Os detalhes de segurança ficam abaixo."
    },
    deel: {
      eyebrow: "Configuração da Deel",
      title: "Conectar a Deel",
      description: "Use primeiro a rota oficial da Deel. Os detalhes de segurança ficam abaixo."
    },
    xero: {
      eyebrow: "Configuração da Xero",
      title: "Conectar a Xero",
      description: "Use primeiro a rota oficial da Xero. Os detalhes de segurança ficam abaixo."
    }
  },
  integrationsShared: {
    backToConnectionHub: "Voltar à central de conexão",
    tools: "Ferramentas",
    privacyShieldTitle: "Escudo de privacidade",
    privacyShieldDescription: "Verifique o que {providerLabel} pode receber antes de conectá-lo.",
    disclosureHeadings: {
      minimumData: "Dados mínimos",
      noSilentSharing: "Sem compartilhamento silencioso",
      revokeAnyTime: "Revogue a qualquer momento"
    },
    disclosures: {
      minimumData: "Apenas os provedores conectados explicitamente recebem os dados mínimos necessários.",
      noSilentSharing: "Sem compartilhamento silencioso nem roteamento automático entre provedores.",
      revokeAnyTime: "Você pode revogar e desconectar este provedor a qualquer momento."
    },
    officialLinksTitle: "Links oficiais",
    officialLogin: "Login oficial",
    officialDocs: "Documentação oficial",
    privacyBadge: "Sem compartilhamento silencioso",
    systemAccessWarning: "Aviso de acesso ao sistema"
  },
  wizard: {
    title: "Configure seu orçamento",
    description: "Responda a 10 perguntas rápidas para construir a base do seu orçamento",
    income: {
      title: "Renda mensal",
      subtitle: "Salário, renda extra, investimentos - tudo combinado",
      placeholder: "ex.: 35000",
      helper: "Insira a renda mensal total (THB)"
    },
    rent: {
      title: "Aluguel / Custo de moradia",
      subtitle: "Condomínio, apartamento, casa ou hipoteca",
      placeholder: "ex.: 12000",
      helper: "Pagamento mensal de aluguel ou hipoteca (THB)"
    },
    transport: {
      title: "Custo de transporte",
      subtitle: "BTS/MRT, ônibus, moto, combustível, Grab/Bolt",
      placeholder: "ex.: 3000",
      helper: "Total mensal de transporte (THB)"
    },
    phoneInternet: {
      title: "Telefone / Internet",
      subtitle: "Plano móvel, internet em casa, pacotes de streaming",
      placeholder: "ex.: 800",
      helper: "Custo mensal de telefone e internet (THB)"
    },
    subscriptions: {
      title: "Assinaturas",
      subtitle: "Netflix, Spotify, academia, assinaturas de apps",
      placeholder: "ex.: 500",
      helper: "Total mensal de assinaturas (THB)"
    },
    entertainment: {
      title: "Entretenimento",
      subtitle: "Filmes, café, jogos, hobbies, comer fora",
      placeholder: "ex.: 3000",
      helper: "Orçamento mensal de entretenimento (THB)"
    },
    healthcare: {
      title: "Saúde",
      subtitle: "Medicamentos, dentista, hospital, copagamento de seguro",
      placeholder: "ex.: 1000",
      helper: "Custo mensal de saúde (THB)"
    },
    savingsRate: {
      title: "Taxa de poupança",
      subtitle: "Qual % da renda você quer poupar?",
      placeholder: "ex.: 20",
      helper: "Porcentagem de poupança alvo (0-50%)"
    },
    riskTolerance: {
      title: "Tolerância a riscos",
      subtitle: "Quanta flutuação do mercado você consegue enfrentar?",
      low: "Baixa - proteger o principal",
      medium: "Média - equilibrada",
      high: "Alta - focada em crescimento"
    },
    locationConsent: {
      title: "Acesso à localização",
      subtitle: "Permita a localização para notícias locais e preços de combustível",
      prompt: "Ative a localização para obter preços de combustível próximos e notícias financeiras locais"
    }
  },
  quickAdd: {
    title: "Adição rápida",
    placeholder: "Digite o valor e depois a nota, ex. 120 almoço",
    camera: "Escanear recibo",
    inbox: "Caixa SMS/E-mail",
    save: "Salvar",
    scanning: "Escaneando e extraindo a foto do recibo...",
    parsing: "Analisando mensagem SMS...",
    successAdded: "Despesa registrada com sucesso!",
    successIncome: "Renda adicionada com sucesso!",
    failed: "Falha ao registrar a entrada!",
    invalidAmount: "Digite um valor válido",
    back: "Voltar",
    expense: "Despesa (-)",
    income: "Renda (+)",
    permTitle: "Permissão de caixa SMS e e-mail",
    permDesc: "Permitir que o Budget Boss analise mensagens de transações financeiras da sua caixa ou área de transferência para preencher os detalhes automaticamente?",
    rememberChoice: "Lembrar minha decisão neste dispositivo",
    allow: "Permitir acesso",
    deny: "Negar acesso",
    pasteSmsTitle: "Colar SMS ou notificação de e-mail",
    pasteSmsPlaceholder: "Cole um alerta bancário ex. \"Pago $45.50 na STARBUCKS cartão 1234 em 08/01/2026\"",
    extractBtn: "Extrair e preencher",
    close: "Fechar",
  }
};
