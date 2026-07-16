# Graph Report - .  (2026-07-17)

## Corpus Check
- 211 files · ~148,248 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 689 nodes · 1388 edges · 50 communities (42 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Post Routeparams
- Tier Achievementbadgecard
- Post Extractjson
- Types Eslint
- React Three
- Infrastructureenvironment Blueprintgrid
- Authlayout Systemstatuspanel
- Next Types
- Achievementnotificationprovider Achievem
- Skillbars Xplevelbar
- Default Designcanvas
- Structuralrules Constraintcandidateconte
- Interviewsession Aimessageschema
- Aifeedbackpanel Canvasheader
- Knowledgecheck Allowed
- Chaostimer Interviewtimer
- Sidebar Sidebarcontext
- Interviewerpanel Useinterviewtimer
- Practicepage Practicedirectory
- Profilesettingsmodal Navbar
- Difficulty Header
- Canvaspage Analyticspage
- Createdesigncard Designcard
- Usesimulationengine Designcanvasprops
- Whiteboardclient Colors
- Cards Expand
- Scoringengine Iruleresult
- Activityheatmap Skillprogress
- Questionpanel Interviewsessiondata
- Types Propertiespanel
- Designdata Pageprops
- Canvaspanelscontext Canvaspanelscontextt
- Curated Curatedtemplates
- Authclient Getauthheaders
- Cybernetic Bento
- Clientarchitecturefield Architecturefiel
- Spike Options
- Features
- Eslint Eslintconfig
- Next Nextconfig
- Postcss

## God Nodes (most connected - your core abstractions)
1. `getAuthenticatedUser()` - 36 edges
2. `dbConnect()` - 35 edges
3. `authFetch()` - 32 edges
4. `useRequireAuth()` - 24 edges
5. `useAuth()` - 21 edges
6. `IConstraintChange` - 20 edges
7. `compilerOptions` - 16 edges
8. `ICanvasNode` - 15 edges
9. `IConnection` - 15 edges
10. `AchievementTier` - 13 edges

## Surprising Connections (you probably didn't know these)
- `DashboardLayout()` --calls--> `useRequireAuth()`  [EXTRACTED]
  app/dashboard/layout.tsx → src/hooks/useRequireAuth.ts
- `AchievementsPage()` --calls--> `useRequireAuth()`  [EXTRACTED]
  app/achievements/page.tsx → src/hooks/useRequireAuth.ts
- `ConstraintTriggerSession` --references--> `IConstraintChange`  [EXTRACTED]
  app/api/interview/[id]/hint/route.ts → src/lib/db/models/InterviewSession.ts
- `POST()` --calls--> `checkRateLimit()`  [EXTRACTED]
  app/api/interview/[id]/hint/route.ts → src/lib/rateLimit.ts
- `GET()` --calls--> `dbConnect()`  [EXTRACTED]
  app/api/user/metrics/route.ts → src/lib/db/mongoose.ts

## Import Cycles
- None detected.

## Communities (50 total, 8 thin omitted)

### Community 0 - "Post Routeparams"
Cohesion: 0.09
Nodes (48): GET(), DELETE(), GET(), PUT(), RouteParams, VALID_STATUSES, GET(), POST() (+40 more)

### Community 1 - "Tier Achievementbadgecard"
Cohesion: 0.07
Nodes (41): buildSkillBreakdown(), GET(), SkillScore, ProfileData, AchievementBadgeCard(), AchievementBadgeCardProps, TIER_CONFIG, TIER_ORDER (+33 more)

### Community 2 - "Post Extractjson"
Cohesion: 0.08
Nodes (30): GET, GET, POST, TIME_LIMITS, POST, POST, register(), extractJSON() (+22 more)

### Community 3 - "Types Eslint"
Cohesion: 0.06
Nodes (34): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @playwright/test, tailwindcss, @tailwindcss/postcss (+26 more)

### Community 4 - "React Three"
Cohesion: 0.06
Nodes (35): firebase, firebase-admin, framer-motion, @google/generative-ai, ioredis, mongoose, next, openai (+27 more)

### Community 5 - "Infrastructureenvironment Blueprintgrid"
Cohesion: 0.07
Nodes (18): InfrastructureEnvironment(), BlueprintGrid(), LightingRenderer(), NoiseRenderer(), clusterEvents, dashboardTone, FaqCategory, faqData (+10 more)

### Community 6 - "Authlayout Systemstatuspanel"
Cohesion: 0.11
Nodes (19): AuthLayout(), AuthLayoutProps, metrics, topoEdges, topoNodes, AuthCard(), AuthCardProps, syncUserWithDB() (+11 more)

### Community 7 - "Next Types"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 8 - "Achievementnotificationprovider Achievem"
Cohesion: 0.13
Nodes (15): inter, jetbrainsMono, metadata, plusJakartaSans, AchievementNotificationProvider(), AchievementToastProps, AchievementToastQueue(), AchievementToastQueueProps (+7 more)

### Community 9 - "Skillbars Xplevelbar"
Cohesion: 0.17
Nodes (15): AchievementsPage(), CATEGORIES, SkillBars(), SkillBarsProps, TIER_COLORS, XPLevelBar(), XPLevelBarProps, AchievementProgress (+7 more)

### Community 10 - "Default Designcanvas"
Cohesion: 0.12
Nodes (16): CanvasState, COLOR_MAP, DEFAULT_CONNECTIONS, DEFAULT_LABELS, DEFAULT_NODES, DesignCanvas(), HistoryAction, historyReducer() (+8 more)

### Community 11 - "Structuralrules Constraintcandidateconte"
Cohesion: 0.18
Nodes (13): ConstraintCandidateContext, CanvasNodeSchema, ConnectionSchema, DesignSchema, ICanvasNode, IConnection, IDesign, IInterviewSession (+5 more)

### Community 12 - "Interviewsession Aimessageschema"
Cohesion: 0.12
Nodes (15): AiMessageSchema, CanvasSnapshotConnectionSchema, CanvasSnapshotNodeSchema, ConstraintChangeSchema, ConstraintChangeSeverity, ConstraintChangeStatus, ConstraintChangeType, EvaluationSchema (+7 more)

### Community 13 - "Aifeedbackpanel Canvasheader"
Cohesion: 0.20
Nodes (10): AIFeedbackPanel(), AIFeedbackPanelProps, CanvasHeader(), CanvasHeaderProps, useCanvasPanels(), ComponentItem, ComponentPalette(), Section (+2 more)

### Community 14 - "Knowledgecheck Allowed"
Cohesion: 0.19
Nodes (12): ALLOWED_TAGS, AnalysisPanel(), DIFFICULTY_COLORS, escapeHtml(), PageProps, PanelView, ReferenceArchitectureDetailPage(), renderMarkdown() (+4 more)

### Community 15 - "Chaostimer Interviewtimer"
Cohesion: 0.20
Nodes (11): ChaosTimer(), ChaosTimerProps, DIFFICULTY_LABELS, InterviewHeaderProps, InterviewTimer(), InterviewTimerProps, URGENCY_STYLES, HintEndpointResponse (+3 more)

### Community 16 - "Sidebar Sidebarcontext"
Cohesion: 0.26
Nodes (9): DashboardLayout(), PracticeDirectoryContent(), TemplateSummary, Sidebar(), SidebarContext, SidebarContextType, SidebarProvider(), useSidebar() (+1 more)

### Community 17 - "Interviewerpanel Useinterviewtimer"
Cohesion: 0.22
Nodes (11): InterviewCanvasPage(), InterviewSessionData, PageProps, InterviewerPanel(), InterviewerPanelProps, InterviewHeader(), AIMessage, useInterviewAI() (+3 more)

### Community 18 - "Practicepage Practicedirectory"
Cohesion: 0.36
Nodes (11): PracticePage(), PracticeDirectory(), CanvasStateRef, clearProgress(), getSavedProgress(), getSolvedIds(), isSolved(), markSolved() (+3 more)

### Community 19 - "Profilesettingsmodal Navbar"
Cohesion: 0.24
Nodes (9): ProfileSettingsModal(), ProfileSettingsModalProps, Navbar(), TrackEvent, useTrackEvent(), updateUserProfile(), AuthContext, AuthContextType (+1 more)

### Community 20 - "Difficulty Header"
Cohesion: 0.21
Nodes (7): DIFFICULTY_COLORS, DIFFICULTY_COLOR, ReportCardData, DIFFICULTY_CONFIG, STATUS_CONFIG, UsageInfo, Header()

### Community 21 - "Canvaspage Analyticspage"
Cohesion: 0.31
Nodes (9): CanvasPage(), AnalyticsPage(), AnalyticsResponse, DashboardPage(), ReportCardPage(), InterviewResultPage(), InterviewPage(), useRequireAuth() (+1 more)

### Community 22 - "Createdesigncard Designcard"
Cohesion: 0.24
Nodes (7): AnalyticsData, CreateDesignCard(), CreateDesignCardProps, DesignCard(), DesignCardProps, Hero(), HeroProps

### Community 23 - "Usesimulationengine Designcanvasprops"
Cohesion: 0.33
Nodes (8): DesignCanvasProps, EMPTY_METRICS, useSimulationEngine(), EdgeMetrics, NODE_CAPACITIES, NodeMetrics, runSimulation(), SimulationResult

### Community 24 - "Whiteboardclient Colors"
Cohesion: 0.20
Nodes (9): COLORS, genId(), Point, STROKE_WIDTHS, ToolType, WhiteboardClient(), WhiteboardData, WhiteboardElement (+1 more)

### Community 25 - "Cards Expand"
Cohesion: 0.18
Nodes (4): ExpandCard, ExpandCardsProps, SYSTEMCRAFT_CARDS, Spline

### Community 26 - "Scoringengine Iruleresult"
Cohesion: 0.29
Nodes (6): IRuleResult, evaluateReasoning(), ReasoningEvaluation, combineEvaluations(), WEIGHTS, StructuralEvaluation

### Community 27 - "Activityheatmap Skillprogress"
Cohesion: 0.27
Nodes (7): ProfilePage(), ActivityHeatmap(), HeatmapProps, CATEGORIES, SkillProgress(), SkillProgressProps, LEVELS

### Community 28 - "Questionpanel Interviewsessiondata"
Cohesion: 0.31
Nodes (7): InterviewSessionData, PageProps, DIFFICULTY_COLORS, QuestionPanel(), QuestionPanelProps, IEvaluation, IInterviewQuestion

### Community 29 - "Types Propertiespanel"
Cohesion: 0.39
Nodes (8): latencyWarning(), PropertiesPanel(), REPLICA_TYPES, SHARDING_TYPES, STORAGE_TYPES, storageLabel(), TYPE_ICON_COLOR, TYPE_SUBTITLE

### Community 30 - "Designdata Pageprops"
Cohesion: 0.50
Nodes (6): DesignData, PageProps, PendingSave, CanvasNode, Connection, ReferenceArchitecture

### Community 31 - "Canvaspanelscontext Canvaspanelscontextt"
Cohesion: 0.29
Nodes (6): CanvasPanelsContext, CanvasPanelsContextType, CanvasPanelsProvider(), DEFAULT_CONFIG, NodeConfig, SelectedNodeInfo

### Community 33 - "Authclient Getauthheaders"
Cohesion: 0.40
Nodes (4): getAuthHeaders(), getIdToken(), firebaseConfig, missingVars

## Knowledge Gaps
- **234 isolated node(s):** `CATEGORIES`, `RouteParams`, `GET`, `RouteParams`, `POST` (+229 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `authFetch()` connect `Canvaspage Analyticspage` to `Authclient Getauthheaders`, `Achievementnotificationprovider Achievem`, `Skillbars Xplevelbar`, `Knowledgecheck Allowed`, `Chaostimer Interviewtimer`, `Interviewerpanel Useinterviewtimer`, `Profilesettingsmodal Navbar`, `Difficulty Header`, `Createdesigncard Designcard`, `Activityheatmap Skillprogress`, `Questionpanel Interviewsessiondata`, `Designdata Pageprops`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `useRequireAuth()` connect `Canvaspage Analyticspage` to `Skillbars Xplevelbar`, `Sidebar Sidebarcontext`, `Interviewerpanel Useinterviewtimer`, `Practicepage Practicedirectory`, `Profilesettingsmodal Navbar`, `Difficulty Header`, `Createdesigncard Designcard`, `Activityheatmap Skillprogress`, `Questionpanel Interviewsessiondata`, `Designdata Pageprops`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Profilesettingsmodal Navbar` to `Authlayout Systemstatuspanel`, `Achievementnotificationprovider Achievem`, `Skillbars Xplevelbar`, `Aifeedbackpanel Canvasheader`, `Sidebar Sidebarcontext`, `Difficulty Header`, `Canvaspage Analyticspage`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `CATEGORIES`, `RouteParams`, `GET` to the rest of the system?**
  _234 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Post Routeparams` be split into smaller, more focused modules?**
  _Cohesion score 0.09424603174603174 - nodes in this community are weakly interconnected._
- **Should `Tier Achievementbadgecard` be split into smaller, more focused modules?**
  _Cohesion score 0.06748911465892599 - nodes in this community are weakly interconnected._
- **Should `Post Extractjson` be split into smaller, more focused modules?**
  _Cohesion score 0.07591836734693877 - nodes in this community are weakly interconnected._