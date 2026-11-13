export type LoreCategory =
  | 'character'
  | 'faction'
  | 'geography'
  | 'system'
  | 'artifact'
  | 'timeline';

export type RhythmType = '高压' | '喘息' | '悬疑' | '兑现' | '转折';

export interface LoreEntry {
  id: string;
  category: LoreCategory;
  name: string;
  subtitle: string;
  summary: string;
  attributes: { label: string; value: string }[];
  tags: string[];
  source: 'uploaded' | 'co-created';
  updatedAt: string;
  chapterRef?: string;
  graphPosition?: { x: number; y: number };
}

export interface LoreRelation {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  tension: 'ally' | 'rival' | 'mystery' | 'hierarchy';
}

export interface DiagnosticDimension {
  id: string;
  label: string;
  score: number; // 0-100
  benchmark: string;
  diagnosis: string;
}

export interface OptimizationProposal {
  id: string;
  targetArea: '世界观架构' | '人物弧光' | '力量体系' | '主线冲突' | '伏笔闭环';
  severity: 'high' | 'medium' | 'enhancement';
  title: string;
  problemAnalysis: string;
  actionablePlan: string;
  expectedPayoff: string;
  suggestedLoreEntry?: {
    category: LoreCategory;
    name: string;
    subtitle: string;
    summary: string;
    attributes: { label: string; value: string }[];
    tags: string[];
  };
  adopted: boolean;
}

export interface ChapterOutline {
  chapterNumber: number;
  title: string;
  rhythmType: RhythmType;
  openingMethod: string;
  endingMethod: string;
  corePlotPoints: string[];
  microPayoff: string;
  sensoryAnchor: string;
  hookRequirement: string;
  tensionScore: number; // 10 - 98
  targetWordCount: number; // 1800 - 2800
  status: 'planned' | 'locked' | 'drafted';
  handoverSummary: {
    protagonistKnowledge: string;
    emotionalState: '紧绷' | '回落' | '悬置';
    nextChapterHook: string;
  };
}

export interface PlotTwistBranch {
  id: string;
  stageLabel: string;
  triggerCondition: string;
  title: string;
  twistMechanism: string;
  involvedEntities: string[];
  foreshadowingUsed: string;
  consequencePreview: string;
  suggestedRhythm: RhythmType;
  suggestedOpening: string;
  suggestedEnding: string;
  adoptedChapter?: number;
}

export interface ForeshadowingItem {
  id: string;
  code: string;
  title: string;
  plantedChapter: string;
  expectedPayoffChapter: string;
  clueDetail: string;
  status: 'planted' | 'rippling' | 'harvested';
}

export interface NovelProject {
  id: string;
  title: string;
  genre: string;
  targetScale: string;
  logline: string;
  corePremise: string;
  lastSyncedPrompt: string;
  updatedAt: string;
  loreEntries: LoreEntry[];
  relations: LoreRelation[];
  diagnostics: DiagnosticDimension[];
  optimizations: OptimizationProposal[];
  chapters: ChapterOutline[];
  plotBranches: PlotTwistBranch[];
  foreshadowings: ForeshadowingItem[];
}

export interface PacingViolation {
  chapterNumber: number;
  ruleCode: 'ADJACENT_RHYTHM' | 'OPENING_REPEAT' | 'ENDING_REPEAT' | 'HIGH_PRESSURE_STREAK' | 'MISSING_RELIEF_WINDOW';
  message: string;
}

export interface PacingValidationReport {
  isValid: boolean;
  complianceRate: number;
  violations: PacingViolation[];
  highPressureMaxStreak: number;
  reliefChapterCount: number;
}
