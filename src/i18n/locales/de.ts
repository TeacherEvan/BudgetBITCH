import type { LocaleMessages } from './en';

export const de: LocaleMessages = {
  appNav: {
    mobileNavigation: "Mobile App-Navigation",
    desktopNavigation: "App-Navigation",
    openDashboard: "Zum Dashboard gehen",
    routes: {
      dashboard: "Dashboard",
      startSmart: "Smart starten",
      calculator: "Rechner",
      notes: "Notizen",
      learn: "Lernen",
      integrations: "Integrationen",
      jobs: "Jobs"
    }
  },
  accounts: {
    navLabel: "Konten",
    title: "Konten",
    subtitle: "Führe bis zu 5 unabhängige Budgets – Familie, Geschäft, Schule und mehr.",
    createTitle: "Konto erstellen",
    umbrellaLabel: "Typ",
    nameLabel: "Kontoname",
    namePlaceholder: "z. B. Unser Haushalt",
    create: "Konto erstellen",
    cancel: "Abbrechen",
    maxReached: "Du hast bereits 5 Konten. Lösche eines, um Platz zu schaffen.",
    umbrella: {
      family: "Familie",
      couple: "Paar",
      business: "Geschäft",
      school: "Schule",
      friends: "Freunde",
      charity: "Wohltätigkeit",
      shopping: "Einkaufen"
    },
    defaultName: {
      family: "Unser Haushalt",
      couple: "Unser Paar",
      business: "Geschäftsbücher",
      school: "Schulfonds",
      friends: "Freundeskreis",
      charity: "Spendenaktion",
      shopping: "Einkaufsliste"
    },
    invite: "Einladen",
    inviteByCode: "Per Freigabecode einladen",
    shareCodePlaceholder: "Füge den Freigabecode eines Freundes ein",
    inviteLink: "Einladungslink",
    inviteQR: "QR-Code",
    copyLink: "Link kopieren",
    copyCode: "Code kopieren",
    rotateCode: "Einladungscode erneuern",
    members: "Mitglieder",
    leave: "Konto verlassen",
    removeMember: "Entfernen",
    delete: "Konto löschen",
    acceptInvite: "Annehmen",
    declineInvite: "Ablehnen",
    pendingInvites: "Ausstehende Einladungen",
    switchTo: "Öffnen",
    role: {
      owner: "Inhaber",
      member: "Mitglied"
    },
    joinTitle: "Konto beitreten",
    joinPrompt: "Scanne einen QR-Code oder öffne den Einladungslink, um beizutreten.",
    joined: "Beigetreten",
    invalidCode: "Dieser Einladungscode ist nicht gültig."
  },
  localeSwitcher: {
    label: "Sprache",
    options: {
      en: "English",
      th: "ไทย"
    }
  },
  welcome: {
    brand: "Budget Boss",
    heading: "Öffne dein Budget Boss-Board",
    description: "Melde dich an, um deinen Root-Flow freizuschalten. Danach kann Budget Boss dich basierend auf deinem gespeicherten Startfortschritt entweder zum einmaligen Startfragebogen oder direkt zum Startboard schicken.",
    openSignIn: "Anmeldung öffnen",
    openSignUp: "Registrierung öffnen",
    privacyPromise: "Standardmäßig privat. Einrichtung nur bei Bedarf.",
    quickReasonsAria: "Schnelle Willkommensgründe",
    quickReasons: {
      signInFirst: {
        title: "Zuerst anmelden",
        description: "Öffne dein Konto, bevor die App entscheidet, ob du Einrichtung oder dein Startboard brauchst."
      },
      keepItShort: {
        title: "Ersten Schritt kurz halten",
        description: "Der Startfragebogen erscheint erst nach der Anmeldung und nur, wenn dein Erststartfortschritt noch unvollständig ist."
      },
      moveWithoutSprawl: {
        title: "Bewege dich ohne Streuung",
        description: "Budget Boss hält den Eingangspfad dicht, lesbar und für schnelles Scannen auf kleineren Bildschirmen bereit."
      }
    },
    rootFlow: "Root-Flow",
    authFirstThenSetup: "Erst Auth, dann Einrichtung",
    rootFlowDescription: "Abgemeldete Besucher bleiben auf diesem Willkommensfenster. Angemeldete Besucher gelangen nur dann in den Startfragebogen, wenn die Erststart-Einrichtung noch abgeschlossen werden muss.",
    whatChangesNext: "Was als Nächstes ändert",
    nextSteps: {
      signIn: "Melde dich an, wenn du bereits ein Konto hast.",
      signUp: "Registriere dich, wenn du vor Beginn der Einrichtung ein neues Konto brauchst.",
      finishWizard: "Führe den Startfragebogen einmal aus und kehre bei künftigen Besuchen zum Startboard zurück."
    }
  },
  launchWizard: {
    kicker: "Startfragebogen",
    title: "Überschlägige Ausgaben",
    description: "Füge zuerst grobe laufende Kosten hinzu, damit Budget Boss mit einer praktischen Geld-Basis statt mit einem leeren Board startet.",
    topCategoriesTitle: "Häufige Ausgabentitel",
    entryLabel: "Ausgabentitel",
    entryPlaceholder: "Häufige Ausgabe suchen oder auswählen",
    customTitleLabel: "Eigener Ausgabentitel",
    customTitlePlaceholder: "Verwende dies, wenn die Liste nicht passt",
    amountLabel: "Ungefährer Monatsbetrag",
    addExpense: "Ausgabe hinzufügen",
    finish: "Start abschließen",
    summaryTitle: "Überschlägige Einträge",
    emptySummary: "Noch keine Ausgaben hinzugefügt.",
    helperTitle: "Warum das zuerst kommt",
    helperDescription: "Dieses erste Fenster bleibt leichtgewichtig: grobe Kategorien, grobe Beträge, dann der normale App-Flow.",
    currentCountLabel: "Gespeicherte Kategorien",
    errors: {
      titleRequired: "Wähle einen häufigen Ausgabentitel oder gib einen eigenen ein.",
      amountRequired: "Gib einen ungefähren Monatsbetrag größer als null ein.",
      atLeastOne: "Füge vor dem Abschluss des Starts mindestens eine überschlägige Ausgabe hinzu.",
      saveFailed: "Start-Einstellungen konnten in diesem Browser nicht gespeichert werden."
    },
    categories: {
      rentMortgage: "Miete oder Hypothek",
      groceries: "Lebensmittel",
      utilities: "Nebenkosten",
      transportFuel: "Transport oder Kraftstoff",
      phoneInternet: "Telefon oder Internet",
      insurance: "Versicherung",
      debtPayments: "Schuldzahlungen",
      healthcare: "Gesundheitsversorgung",
      childcareFamilySupport: "Kinderbetreuung oder Familienunterstützung",
      funEntertainment: "Spaß oder Unterhaltung"
    }
  },
  authPanel: {
    secureAccess: "Sicherer Zugriff",
    useGoogleToStart: "Konto erstellen",
    useGoogleToContinue: "Konto verwenden",
    googleOnly: "Convex Auth erstellt und schützt Budget Boss-Konten.",
    secureSignIn: "Nutze E-Mail und Passwort, um dasselbe Konto auf jedem Gerät zu öffnen.",
    gmailPrivacy: "Für die Anmeldung ist kein Google-OAuth-Client oder benutzerverwaltete Env-Datei nötig.",
    minimalData: "Budget Boss behält nur die minimalen Konto-, Workspace-, Präferenz- und Integrationsdaten, die es zum Laufen braucht.",
    whyThisStepExists: "Warum es diesen Schritt gibt",
    localProfileFirst: "Erst lokales Profil",
    localProfileDescription: "Budget Boss prüft das Convex-Auth-Konto und erstellt dann einmalig dein lokales Profil, deinen persönlichen Workspace und die Standard-Workspace-Präferenz, damit die App die passende Datenform auf dem Server laden kann."
  },
  signIn: {
    eyebrow: "Anmelden",
    title: "Öffne dein Budget-Board",
    description: "Nutze dein Budget Boss-Konto und lass die App die lokale Einrichtung für deinen Workspace abschließen, bevor das Dashboard öffnet.",
    needAccount: "Brauchst du ein Konto?",
    openSignUp: "Registrierung öffnen",
    continueWithGoogle: "Anmelden",
    submit: "Anmelden",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    privacy: "Nutzer fügen keine Env-Dateien hinzu. Der App-Besitzer konfiguriert Convex einmal, und Nutzer melden sich hier an.",
    setupRequiredTitle: "Convex Auth ist nicht konfiguriert",
    setupRequiredDescription: "Verbinde das Convex-Deployment, bevor du diese Anmeldemethode nutzt."
  },
  signUp: {
    eyebrow: "Konto erstellen",
    title: "Erstelle dein Budget-Konto",
    description: "Wähle eine E-Mail und ein Passwort. Budget Boss erstellt dein Konto in Convex und schließt als Nächstes die lokale Workspace-Einrichtung ab.",
    haveAccount: "Hast du bereits ein Konto?",
    openSignIn: "Anmeldung öffnen",
    submit: "Konto erstellen",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    privacy: "Verwende mindestens 8 Zeichen. Passwort vergessen? Nutze den Link auf dem Anmeldebildschirm, um es per E-Mail zurückzusetzen."
  },
  authContinue: {
    eyebrow: "Fortfahren",
    missingEmailTitle: "Füge eine E-Mail hinzu, um die Einrichtung abzuschließen",
    missingEmailDescription: "Budget Boss benötigt vor Abschluss der lokalen Einrichtung ein E-Mail-basiertes Convex-Konto.",
    missingEmailHelp: "Erstelle ein Konto mit E-Mail und Passwort oder melde dich damit an, und kehre dann hierher zurück, um die Einrichtung abzuschließen.",
    title: "Schließe deine lokale Einrichtung ab",
    description: "Budget Boss benötigt ein lokales Profil und einen persönlichen Workspace, bevor das Dashboard serverseitige Daten für dieses Konto laden kann.",
    whatHappensNext: "Was als Nächstes passiert",
    oneSafeBootstrap: "Ein sicherer Bootstrap",
    oneSafeBootstrapDescription: "Die Fortfahren-Aktion erstellt fehlende Datensätze einmalig, verwendet sie bei späteren Anmeldungen wieder und öffnet dann dein Dashboard mit dem daraus resultierenden Workspace ausgewählt.",
    relinkConflict: "Diese E-Mail ist bereits mit einem anderen Konto verknüpft. Melde dich hier ab, wechsle zur ursprünglichen Anmeldemethode oder kontaktiere den Support, bevor du fortfährst.",
    bootstrapIssueTitle: "Einrichtung benötigt Aufmerksamkeit",
    bootstrapIssueDescription: "Budget Boss konnte den sicheren Convex-Einrichtungsschritt für diese Sitzung nicht abschließen.",
    bootstrapIssueHelp: "Versuche es erneut, nachdem der App-Besitzer die Convex-Auth- und CONVEX_SYNC_SECRET-Einstellungen geprüft hat.",
    continueToDashboard: "Zum Dashboard weiter",
    rerunSafe: "Das erneute Ausführen ist sicher, falls deine Sitzung die lokalen Datensätze bereits erstellt hat."
  },
  securitySettings: {
    eyebrow: "Sicherheitseinstellungen",
    title: "Öffne die Sicherheitssteuerung deines Kontos.",
    description: "Budget Boss verwendet Convex-Auth-Konten mit E-Mail und Passwort. Nutze den Link „Passwort vergessen?“ bei der Anmeldung, um es per E-Mail zurückzusetzen. E-Mail-Bestätigung ist eine geplante Folge.",
    googleAccountEyebrow: "Kontoanmeldedaten",
    googleAccountTitle: "Nutze dein Budget Boss-Konto.",
    googleAccountDescription: "Dein Konto wird in Convex Auth mit der bei der Registrierung gewählten E-Mail und Passwort erstellt.",
    openGoogleSecurity: "Verwende ein starkes, einzigartiges Passwort mit mindestens 8 Zeichen.",
    openGooglePermissions: "Passwort vergessen? Nutze den Link auf dem Anmeldebildschirm, um es per E-Mail zurückzusetzen. E-Mail-Bestätigung ist eine geplante Folge.",
    sessionAccessEyebrow: "Sitzungszugriff",
    sessionAccessTitle: "Konten sicher wechseln.",
    sessionAccessDescription: "Melde dich hier ab, wenn du zum Anmeldebildschirm zurückkehren und ein anderes Konto nutzen musst.",
    privacyEyebrow: "Datenschutz",
    privacyItems: {
      signInOnly: "Convex Auth prüft die Anmeldung und liefert deine Kontoidentität zurück.",
      minimalData: "Budget Boss behält nur die lokalen Konto-, Workspace-, Präferenz- und Integrationsdaten, die es zum Laufen braucht.",
      noMarketingData: "Es werden keine Marketingdaten aufgezeichnet oder verkauft.",
      personalizationUserOnly: "Personalisierung bleibt nutzerbezogen und wird nicht mit Brokern oder Drittanbietern geteilt.",
      gmailPrivacy: "Für die Anmeldung ist kein Google-OAuth-Client oder benutzerverwaltete Env-Datei nötig."
    }
  },
  notesPage: {
    eyebrow: "Werkzeuge",
    title: "Notizen",
    description: "Ein schneller Ort für Erinnerungen und grobe Budget-Gedanken."
  },
  notesBoard: {
    regionLabel: "Notizboard",
    inputLabel: "Neue Notiz",
    inputPlaceholder: "Tippe eine Notiz und drücke Enter oder Notiz hinzufügen…",
    addNote: "Notiz hinzufügen",
    emptyState: "Noch keine Notizen. Füge oben eine hinzu.",
    deleteNote: "Notiz {text} löschen"
  },
  calculatorPage: {
    eyebrow: "Werkzeuge",
    title: "Rechner",
    description: "Schnelle Rechenprüfung für Budget-Kontrollen."
  },
  calculator: {
    regionLabel: "Rechner",
    clearButton: "Löschen"
  },
  learnPage: {
    eyebrow: "Lernen!",
    title: "Comic-Strip-Lektionen für die als Nächstes wichtige Geldbewegung.",
    description: "Kurze Lektionen für die als Nächstes wichtige Geldbewegung.",
    storyCuesEyebrow: "Story-Hinweise",
    storyCuesTitle: "Schnelle Hinweise für den nächsten Schritt",
    storyCuesDescription: "Ein klarer Hinweis und eine Aktion pro Lektion.",
    blueprintPicksEyebrow: "Blueprint-Auswahl",
    blueprintPicksTitle: "Hier beginnen",
    blueprintPicksDescription: "Höchstsignal-Lektionen, abgestimmt auf deinen aktuellen Blueprint-Druck.",
    streakEyebrow: "Serie halten",
    streakTitle: "Als Nächstes",
    streakDescription: "Immergrüne Auffrischungen, wenn du ein nützliches Konzept ohne langes Scrollen willst."
  },
  dashboardPage: {
    eyebrow: "Dashboard",
    title: "Interaktives Billboard",
    description: "Halte Workspace, Werkzeuge und Live-Signale in einem Board.",
    workspaceLabel: "Workspace",
    cityLabel: "Stadt",
    motionLabel: "Bewegung",
    currentModeEyebrow: "Aktueller Modus",
    checkInSubmitted: "Eingecheckt",
    checkInNeeded: "Check-in fällig",
    demoWorkspace: "Demo",
    liveMembership: "Live-Mitglied",
    windowProfileEyebrow: "Fensterprofil",
    layoutLabel: "Layout",
    motionValueLabel: "Bewegung",
    noWorkspaceSelected: "Kein Workspace ausgewählt",
    noWorkspaceRole: "keine",
    roles: {
      owner: "Inhaber",
      editor: "Bearbeiter",
      approver: "Genehmiger",
      read_only: "Nur lesen"
    },
    homeBaseKicker: "Board-Anker",
    homeBaseTitle: "Geteilter Startpunkt",
    homeBaseDescription: "Halte eine geteilte Region für Einrichtung und Jobs bereit.",
    homeBaseEmptyState: "Noch keine geteilte Region gespeichert.",
    homeBaseActionLabel: "Einrichtungsassistent öffnen",
    themePresets: {
      midnight: "Mitternacht"
    },
    layoutPresets: {
      launcher_grid: "Starter-Raster"
    },
    motionPresets: {
      cinematic: "Kino"
    }
  },
  broadcastBar: {
    kicker: "Lokales Umfeld",
    title: "Lokales Umfeld",
    fallbackTicker: "Budget-Updates"
  },
  launcherGrid: {
    kicker: "Werkzeuge",
    title: "Beliebte Budget-Werkzeuge",
    description: "Öffne das nächste Werkzeug ohne extra Scrollen."
  },
  liveBriefing: {
    kicker: "Briefing",
    title: "Live-Briefing",
    description: "Vertrauenswürdige Themen, für schnelles Scannen gekürzt.",
    sourceStatus: {
      live: "Live",
      fallback: "Fallback"
    },
    fieldCount: "{count} Felder",
    emptyState: "Noch keine Briefing-Themen. Schau nach der nächsten Aktualisierung wieder vorbei."
  },
  dailyCheckIn: {
    kicker: "Check-in-Spur",
    title: "Trag heute deine Zahl ein",
    description: "Eine Zahl hält {workspaceName} im Gleichschritt.",
    liveSubmissionUnavailable: "Live-Eingabe gesperrt",
    submitting: "Wird gesendet",
    submittedToday: "Heute gesendet",
    readyToSubmit: "Jetzt bereit",
    plannedSpendLabel: "Geplanter Aufwand für heute",
    lockedDate: "Festgelegt auf {dateLabel} für {workspaceName}.",
    disabledHint: "Melde dich an, um Live-Check-ins zu senden.",
    validationError: "Gib vor dem Senden des heutigen Check-ins einen nicht negativen geplanten Aufwand ein.",
    submitError: "Heutiger Check-in kann momentan nicht gesendet werden.",
    submitButton: "Heutigen Check-in senden",
    submittingButton: "Check-in wird gesendet",
    workspaceFallback: "dieser Workspace",
    cashStatus: {
      positive: "Positiv",
      negative: "Negativ"
    },
    severity: {
      warning: "Warnung",
      critical: "Kritisch"
    },
    emptyHeadline: "Noch kein Check-in für diesen Workspace.",
    noCheckInYet: "Noch kein Check-in.",
    submittedAt: "Gesendet {submittedAt}.",
    plannedSpendMetric: "Geplanter Aufwand",
    openAlertsMetric: "Offene Alerts",
    netCashAfterPlanMetric: "Netto-Bargeld nach Plan",
    emptyAlertsTitle: "Noch keine Alerts.",
    emptyAlertsDescription: "Sende erneut, wenn du eine Aktualisierung brauchst."
  },
  liveAlerts: {
    kicker: "Alert-Spur",
    title: "Beobachte die Druckpunkte",
    description: "Prognostizierte Alerts landen hier zuerst.",
    selectWorkspace: "Wähle einen Workspace, um Alerts zu sehen.",
    standbyNoUrl: "Bereit. Füge die Convex-URL hinzu, um Alerts zu aktivieren.",
    standbyNoBridge: "Bereit. Realtime-Auth ist noch nicht bereit.",
    loading: "Alerts werden geladen...",
    viewerSync: "Viewer-Sync läuft. Alerts erscheinen, sobald er abgeschlossen ist.",
    workspaceSync: "Warte auf Workspace-Zugriffssync.",
    empty: "Noch keine Live-Alerts. Sie erscheinen nach dem ersten prognostizierten Check-in.",
    checkInDate: "Check-in {date}",
    severity: {
      info: "Info",
      warning: "Warnung",
      critical: "Kritisch"
    }
  },
  integrationActions: {
    openSetupWizard: "Einrichtungs-Assistent öffnen",
    openOfficialLogin: "Offizielle Anmeldung öffnen",
    openOfficialDocs: "Offizielle Dokumentation öffnen"
  },
  integrationsHub: {
    eyebrow: "Verbindungs-Hub",
    title: "Verbinde nur die Anbieter, die du schnell prüfen und denen du schnell vertrauen kannst.",
    description: "Jeder Abschnitt hält die offizielle Route, das Risiko und die nächste Aktion leicht durchsuchbar.",
    guardrails: {
      officialRoutesFirst: {
        label: "Offizielle Routen",
        title: "Nutze zuerst die offizielle Anmeldung, Dokumentation oder Einrichtungs-Route des Anbieters."
      },
      noSilentSharing: {
        label: "Kein stilles Teilen",
        title: "Nur Anbieter, die du ausdrücklich verbindest, erhalten die minimal erforderlichen Daten."
      },
      revokePathStaysObvious: {
        label: "Einfache Widerrufs-Route",
        title: "Du solltest die Trennungs- oder Widerrufs-Route immer schnell finden können."
      }
    },
    groupedScan: "Gruppierte Übersicht",
    providerCount: "{count} Anbieter",
    categories: {
      ai: {
        label: "KI-Copiloten",
        summary: "Modell-Helfer und workflow-lastige Werkzeuge mit vielen Prompts."
      },
      banking: {
        label: "Banking-Infrastruktur",
        summary: "Kontoverifizierung und offizielle Bankverbindungen."
      },
      investing: {
        label: "Investieren",
        summary: "Broker- und Portfolio-Zugriff mit klaren Berechtigungen."
      },
      payroll: {
        label: "Lohnabrechnung",
        summary: "Einkommens- und Mitarbeiter-Einrichtung mit klaren Kontrollen."
      },
      tax: {
        label: "Steuern und Buchhaltung",
        summary: "Dokumenten- und Hauptbuch-Zugriff mit sichtbaren Vertrauenssignalen."
      },
      finance_ops: {
        label: "Finanzoperationen",
        summary: "Ausgaben-, Karten- und Betriebswerkzeuge bewusst einfach gehalten."
      }
    }
  },
  providerCard: {
    categoryLabel: {
      ai: "KI",
      banking: "Banking",
      investing: "Investieren",
      payroll: "Lohnabrechnung",
      tax: "Steuern",
      finance_ops: "Finanzoperationen"
    },
    categorySummary: {
      ai: "Assistenten-Werkzeuge und Prompt-Zugriff.",
      banking: "Offizielle Bank- und Kontolinks.",
      investing: "Portfolio- und Broker-Zugriff.",
      payroll: "Einkommens- und Mitarbeiter-Einrichtung.",
      tax: "Steuer- und Hauptbuch-Workflows.",
      finance_ops: "Ausgaben- und Geld-Operations-Werkzeuge."
    },
    risk: {
      low: "Geringes Risiko",
      medium: "Mittleres Risiko",
      high: "Hohes Risiko"
    },
    setupState: {
      setupWizard: "Einrichtungs-Assistent",
      guidanceOnly: "Nur Anleitung"
    },
    quickActions: "Schnellaktionen"
  },
  integrationProviderPages: {
    claude: {
      eyebrow: "Claude-Einrichtung",
      title: "Claude verbinden",
      description: "Nutze zuerst die offizielle Anthropic-Route. Sicherheitsdetails folgen unten."
    },
    openai: {
      eyebrow: "OpenAI-Einrichtung",
      title: "OpenAI verbinden",
      description: "Nutze zuerst die offizielle OpenAI-Route. Sicherheitsdetails folgen unten."
    },
    copilot: {
      eyebrow: "GitHub Copilot-Einrichtung",
      title: "GitHub Copilot verbinden",
      description: "Prüfe zuerst Repository- und Prompt-Zugriff. Sicherheitsdetails folgen unten.",
      systemAccessMessage: "Systemreichweite: Prüfe Erweiterung, Repository und Prompt-Zugriff, bevor du GitHub Copilot aktivierst.",
      riskChecklistTitle: "Risikocheckliste",
      riskChecklistItems: {
        repositoryAccess: "Repository-Reichweite: Bestätige, welche Repositories und Dateien das Werkzeug einsehen kann.",
        officialFlow: "Offizieller Ablauf: Nutze nur den offiziellen GitHub-Copilot-Authentifizierungsablauf.",
        revokeAccess: "Widerrufs-Route: Widerrufe den Zugriff sofort, wenn der Workspace ihn nicht mehr benötigt."
      }
    },
    openclaw: {
      eyebrow: "OpenClaw-Einrichtung",
      title: "OpenClaw verbinden",
      description: "Prüfe zuerst Systemreichweite und Prompt-Injection-Gefährdung. Sicherheitsdetails folgen unten.",
      systemAccessMessage: "Systemreichweite: Verifiziere lokalen Systemzugriff, Datenpfade, Modell-Routing und Prompt-Injection-Grenzen, bevor du OpenClaw aktivierst.",
      riskChecklistTitle: "Hochriskante Verbindung",
      riskChecklistItems: {
        localReach: "Lokale Reichweite: Prüfe, welche lokalen Dateien, Werkzeuge oder Shells OpenClaw erreichen kann.",
        promptRouting: "Prompt-Sicherheit: Bestätige Prompt-Routing, Speicherpfade und Injection-Grenzen, bevor du die Integration aktivierst.",
        oneClickRevoke: "Ein-Klick-Widerruf: Nutze den Ein-Klick-Widerruf, wenn sich dein Vertrauensmodell ändert."
      }
    },
    perplexity: {
      eyebrow: "Perplexity-Einrichtung",
      title: "Perplexity verbinden",
      description: "Nutze zuerst die offizielle Perplexity-Route. Sicherheitsdetails folgen unten."
    },
    mistral: {
      eyebrow: "Mistral-Einrichtung",
      title: "Mistral verbinden",
      description: "Nutze zuerst die offizielle Mistral-Route. Sicherheitsdetails folgen unten."
    },
    wise: {
      eyebrow: "Wise-Einrichtung",
      title: "Wise verbinden",
      description: "Nutze zuerst die offizielle Wise-Route. Sicherheitsdetails folgen unten."
    },
    revolut: {
      eyebrow: "Revolut-Einrichtung",
      title: "Revolut verbinden",
      description: "Nutze zuerst die offizielle Revolut-Route. Sicherheitsdetails folgen unten."
    },
    paypal: {
      eyebrow: "PayPal-Einrichtung",
      title: "PayPal verbinden",
      description: "Nutze zuerst die offizielle PayPal-Route. Sicherheitsdetails folgen unten."
    },
    deel: {
      eyebrow: "Deel-Einrichtung",
      title: "Deel verbinden",
      description: "Nutze zuerst die offizielle Deel-Route. Sicherheitsdetails folgen unten."
    },
    xero: {
      eyebrow: "Xero-Einrichtung",
      title: "Xero verbinden",
      description: "Nutze zuerst die offizielle Xero-Route. Sicherheitsdetails folgen unten."
    }
  },
  integrationsShared: {
    backToConnectionHub: "Zurück zum Verbindungs-Hub",
    tools: "Werkzeuge",
    privacyShieldTitle: "Datenschutzschild",
    privacyShieldDescription: "Prüfe, was {providerLabel} empfangen kann, bevor du es verbindest.",
    disclosureHeadings: {
      minimumData: "Minimale Daten",
      noSilentSharing: "Kein stilles Teilen",
      revokeAnyTime: "Jederzeit widerrufen"
    },
    disclosures: {
      minimumData: "Nur ausdrücklich verbundene Anbieter erhalten die minimal erforderlichen Daten.",
      noSilentSharing: "Kein stilles Teilen oder automatisches Routing zwischen Anbietern.",
      revokeAnyTime: "Du kannst diesen Anbieter jederzeit widerrufen und trennen."
    },
    officialLinksTitle: "Offizielle Links",
    officialLogin: "Offizielle Anmeldung",
    officialDocs: "Offizielle Dokumentation",
    privacyBadge: "Kein stilles Teilen",
    systemAccessWarning: "Systemzugriff-Warnung"
  },
  wizard: {
    title: "Richte dein Budget ein",
    description: "Beantworte 10 schnelle Fragen, um deine Budget-Baseline zu erstellen",
    income: {
      title: "Monatliches Einkommen",
      subtitle: "Gehalt, Nebeneinkommen, Investitionen – alles kombiniert",
      placeholder: "z. B. 35000",
      helper: "Gesamtes monatliches Einkommen eingeben (THB)"
    },
    rent: {
      title: "Miete / Wohnkosten",
      subtitle: "Condo, Wohnung, Haus mieten oder Hypothek",
      placeholder: "z. B. 12000",
      helper: "Monatliche Miete oder Hypothekenzahlung (THB)"
    },
    transport: {
      title: "Transportkosten",
      subtitle: "BTS/MRT, Bus, Motorrad, Kraftstoff, Grab/Bolt",
      placeholder: "z. B. 3000",
      helper: "Monatliche Transportgesamtkosten (THB)"
    },
    phoneInternet: {
      title: "Telefon / Internet",
      subtitle: "Mobilfunktarif, Heim-Internet, Streaming-Bundles",
      placeholder: "z. B. 800",
      helper: "Monatliche Telefon- & Internetkosten (THB)"
    },
    subscriptions: {
      title: "Abos",
      subtitle: "Netflix, Spotify, Fitnessstudio, App-Abos",
      placeholder: "z. B. 500",
      helper: "Monatliche Abo-Gesamtkosten (THB)"
    },
    entertainment: {
      title: "Unterhaltung",
      subtitle: "Filme, Kaffee, Spiele, Hobbys, Ausgehen",
      placeholder: "z. B. 3000",
      helper: "Monatliches Unterhaltungsbudget (THB)"
    },
    healthcare: {
      title: "Gesundheit",
      subtitle: "Medikamente, Zahnarzt, Krankenhaus, Versicherungs-Eigenanteil",
      placeholder: "z. B. 1000",
      helper: "Monatliche Gesundheitskosten (THB)"
    },
    savingsRate: {
      title: "Sparrate",
      subtitle: "Welchen %-Anteil des Einkommens möchtest du sparen?",
      placeholder: "z. B. 20",
      helper: "Ziel-Sparprozentsatz (0–50%)"
    },
    riskTolerance: {
      title: "Risikotoleranz",
      subtitle: "Wie viel Marktschwankung kannst du verkraften?",
      low: "Niedrig – Kapital schützen",
      medium: "Mittel – ausgewogen",
      high: "Hoch – wachstumsorientiert"
    },
    locationConsent: {
      title: "Standortzugriff",
      subtitle: "Standort für lokale Nachrichten und Kraftstoffpreise erlauben",
      prompt: "Aktiviere den Standort, um nahegelegene Kraftstoffpreise und lokale Finanznachrichten zu erhalten"
    }
  },
  quickAdd: {
    title: "Schnell hinzufügen",
    placeholder: "Betrag eingeben, dann Notiz, z. B. 120 Mittagessen",
    camera: "Beleg scannen",
    inbox: "Postfach SMS/E-Mail",
    save: "Speichern",
    scanning: "Belegfoto wird gescannt & extrahiert...",
    parsing: "SMS-Nachricht wird analysiert...",
    successAdded: "Ausgabe erfolgreich erfasst!",
    successIncome: "Einnahme erfolgreich hinzugefügt!",
    failed: "Eintrag konnte nicht gespeichert werden!",
    invalidAmount: "Bitte gültigen Betrag eingeben",
    back: "Zurück",
    expense: "Ausgabe (-)",
    income: "Einnahme (+)",
    permTitle: "SMS- & E-Mail-Postfach-Berechtigung",
    permDesc: "Soll Budget Boss Finanztransaktionsnachrichten aus deinem Postfach oder der Zwischenablage analysieren, um Details automatisch auszufüllen?",
    rememberChoice: "Entscheidung auf diesem Gerät merken",
    allow: "Zugriff erlauben",
    deny: "Zugriff verweigern",
    pasteSmsTitle: "SMS oder E-Mail-Benachrichtigung einfügen",
    pasteSmsPlaceholder: "Bankwarnung einfügen z. B. \"Bezahlt $45.50 bei STARBUCKS Karte 1234 am 08.01.2026\"",
    extractBtn: "Extrahieren & Ausfüllen",
    close: "Schließen",
  }
};
