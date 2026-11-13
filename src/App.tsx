import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Download,
  FolderSync,
  Layers,
  ListOrdered,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { PRESET_PROJECTS } from './data/presetProjects';
import {
  ChapterOutline,
  ForeshadowingItem,
  LoreEntry,
  NovelProject,
  RhythmType,
} from './types/novel';
import {
  adoptOptimizationIntoLore,
  adoptTwistIntoOutline,
  autoRebalanceChapterPacing,
  clearNovelProject,
  parseUploadedNovelText,
  validatePacingRules,
} from './utils/novelEngine';
import { LoreDatabaseView } from './components/LoreDatabaseView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { OutlinePacingView } from './components/OutlinePacingView';
import { PlotInspirationView } from './components/PlotInspirationView';
import { ClearConfirmModal, UploadModal } from './components/UploadAndClearModals';

type ActiveTab = 'lore' | 'diagnostics' | 'outline' | 'inspiration';

export default function App() {
  const [projects, setProjects] = useState<NovelProject[]>(PRESET_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    PRESET_PROJECTS[0].id
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('lore');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeProject = useMemo(() => {
    return (
      projects.find((p) => p.id === activeProjectId) ||
      projects[0] ||
      clearNovelProject()
    );
  }, [projects, activeProjectId]);

  const pacingSummary = useMemo(
    () => validatePacingRules(activeProject.chapters),
    [activeProject.chapters]
  );

  const avgDiagnosticScore = useMemo(() => {
    if (activeProject.diagnostics.length === 0) return 0;
    const total = activeProject.diagnostics.reduce((sum, d) => sum + d.score, 0);
    return Math.round(total / activeProject.diagnostics.length);
  }, [activeProject.diagnostics]);

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
  };

  const updateActiveProject = (updater: (proj: NovelProject) => NovelProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === activeProject.id ? updater(p) : p))
    );
  };

  // One-click clear novel content to switch/reset project workspace cleanly
  const handleConfirmClearWorkspace = () => {
    const emptyProj = clearNovelProject(activeProject);
    setProjects((prev) => {
      const withoutEmpty = prev.filter((p) => !p.id.startsWith('empty-'));
      return [emptyProj, ...withoutEmpty];
    });
    setActiveProjectId(emptyProj.id);
    showBanner('已一键清空当前小说内容，工作空间已重置为空白状态，可随时上传或切换新项目。');
  };

  // Import uploaded or pasted novel settings & outlines (with server-side Gemini enrichment if available)
  const handleImportNovel = async (
    rawText: string,
    customTitle?: string,
    customGenre?: string
  ) => {
    const parsedProject = parseUploadedNovelText(rawText, customTitle, customGenre);

    try {
      const response = await fetch('/api/novel/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          title: parsedProject.title,
          genre: parsedProject.genre,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.mode === 'gemini-ai' && result.data) {
          if (result.data.logline) {
            parsedProject.logline = result.data.logline;
          }
          if (
            Array.isArray(result.data.optimizations) &&
            result.data.optimizations.length > 0
          ) {
            parsedProject.optimizations = result.data.optimizations.map(
              (opt: Record<string, string>, idx: number) => ({
                id: `ai-opt-${Date.now()}-${idx}`,
                targetArea:
                  (opt.targetArea as '世界观架构' | '人物弧光' | '力量体系') ||
                  '世界观架构',
                severity: idx === 0 ? 'high' : 'medium',
                title: opt.title || '设定结构深化建议',
                problemAnalysis: opt.problemAnalysis || '需进一步强化长线逻辑闭环',
                actionablePlan: opt.actionablePlan || '补充核心代价与阵营牵制',
                expectedPayoff: opt.expectedPayoff || '提升后续章节冲突张力',
                adopted: false,
              })
            );
          }
        }
      }
    } catch {
      // Local engine fallback is already complete in parsedProject
    }

    setProjects((prev) => [parsedProject, ...prev]);
    setActiveProjectId(parsedProject.id);
    setActiveTab('lore');
    showBanner(
      `已成功导入并深度解析 ${parsedProject.title}：归档 ${parsedProject.loreEntries.length} 项设定条目与 ${parsedProject.chapters.length} 章细纲。`
    );
  };

  // Lore handlers
  const handleAddLoreEntry = (entry: Omit<LoreEntry, 'id' | 'updatedAt'>) => {
    updateActiveProject((proj) => ({
      ...proj,
      updatedAt: '刚刚新增设定档案',
      loreEntries: [
        {
          ...entry,
          id: `lore-manual-${Date.now()}`,
          updatedAt: '刚刚录入',
        },
        ...proj.loreEntries,
      ],
    }));
    showBanner(`已将「${entry.name}」归档至设定集数据库。`);
  };

  const handleDeleteLoreEntry = (id: string) => {
    updateActiveProject((proj) => ({
      ...proj,
      loreEntries: proj.loreEntries.filter((e) => e.id !== id),
      relations: proj.relations.filter(
        (r) => r.sourceId !== id && r.targetId !== id
      ),
    }));
  };

  // Diagnostics & Optimization handlers
  const handleAdoptOptimization = (proposalId: string) => {
    updateActiveProject((proj) => adoptOptimizationIntoLore(proj, proposalId));
    showBanner('已采纳该优化方案，并将生成的共创设定条目自动归档至设定集数据库。');
  };

  // Chapter & Pacing handlers
  const handleRebalancePacing = () => {
    updateActiveProject((proj) => ({
      ...proj,
      updatedAt: '刚刚完成节奏重排',
      chapters: autoRebalanceChapterPacing(proj.chapters),
    }));
    showBanner('已按「相邻不重复、连续高压≤2章、每3-5章穿插喘息/兑现」规则完成全书节奏校准。');
  };

  const handleAddChapter = (chapterData: Omit<ChapterOutline, 'chapterNumber'>) => {
    updateActiveProject((proj) => {
      const nextNum =
        proj.chapters.length > 0
          ? Math.max(...proj.chapters.map((c) => c.chapterNumber)) + 1
          : 1;
      return {
        ...proj,
        updatedAt: `已新增第${nextNum}章细纲`,
        chapters: [
          ...proj.chapters,
          {
            ...chapterData,
            chapterNumber: nextNum,
          },
        ],
      };
    });
    showBanner('新章节细纲与交接摘要已并入节奏规划表。');
  };

  const handleUpdateChapterRhythm = (
    chapterNumber: number,
    rhythmType: RhythmType
  ) => {
    const tensionMap: Record<RhythmType, number> = {
      高压: 89,
      转折: 78,
      悬疑: 68,
      兑现: 56,
      喘息: 36,
    };
    updateActiveProject((proj) => ({
      ...proj,
      chapters: proj.chapters.map((ch) =>
        ch.chapterNumber === chapterNumber
          ? { ...ch, rhythmType, tensionScore: tensionMap[rhythmType] }
          : ch
      ),
    }));
  };

  // Plot Twist & Foreshadowing handlers
  const handleAdoptTwist = (branchId: string) => {
    updateActiveProject((proj) => adoptTwistIntoOutline(proj, branchId));
    showBanner('已将该剧情转折灵感推演为最新一章细纲，可在「细纲与节奏表」中查看。');
  };

  const handleToggleForeshadowing = (id: string) => {
    const order: ForeshadowingItem['status'][] = ['planted', 'rippling', 'harvested'];
    updateActiveProject((proj) => ({
      ...proj,
      foreshadowings: proj.foreshadowings.map((f) => {
        if (f.id !== id) return f;
        const nextStatus = order[(order.indexOf(f.status) + 1) % order.length];
        return { ...f, status: nextStatus };
      }),
    }));
  };

  const handleAddForeshadowing = (
    item: Omit<ForeshadowingItem, 'id' | 'code'>
  ) => {
    updateActiveProject((proj) => {
      const nextIndex = proj.foreshadowings.length + 1;
      return {
        ...proj,
        foreshadowings: [
          ...proj.foreshadowings,
          {
            ...item,
            id: `fs-${Date.now()}`,
            code: `FS-${String(nextIndex).padStart(2, '0')}`,
          },
        ],
      };
    });
  };

  const handleExportProjectJson = () => {
    const dataStr = JSON.stringify(activeProject, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.title.replace(/[《》\s]/g, '') || 'novel-project'}-设定与细纲.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-xs border-b border-stone-200 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('lore');
          }}
          className="text-lg font-bold tracking-tight text-stone-900 font-serif-editorial whitespace-nowrap shrink-0"
        >
          长篇小说设定和细纲APP
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="主工作区视图切换"
          className="flex items-center gap-6 text-sm font-medium text-stone-600 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('lore')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'lore'
                ? 'border-amber-800 text-stone-950 font-semibold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            设定集数据库
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'diagnostics'
                ? 'border-amber-800 text-stone-950 font-semibold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            设定诊断与优化
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'outline'
                ? 'border-amber-800 text-stone-950 font-semibold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            细纲与节奏表
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inspiration')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'inspiration'
                ? 'border-amber-800 text-stone-950 font-semibold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            剧情推演灵感
          </button>
        </nav>

        {/* Zone 3: 1 primary action button (One-Click Clear Novel Content) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-rose-800 transition-colors whitespace-nowrap shrink-0"
          >
            一键清空小说
          </button>
        </div>
      </header>

      {/* Main Workspace Container (1440px baseline presence) */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Feedback Notification Banner */}
        {statusBanner && (
          <div
            role="status"
            className="border border-amber-300/80 bg-amber-50/90 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 text-xs text-amber-950"
          >
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-amber-800 hover:text-amber-950 font-medium whitespace-nowrap"
            >
              知道了
            </button>
          </div>
        )}

        {/* Project Overview & Multi-Project Switcher Toolbar */}
        <section className="border border-stone-200 bg-white rounded-2xl p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              {/* Unboxed metadata kicker */}
              <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2">
                <span className="font-medium text-amber-900">
                  {activeProject.genre}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{activeProject.targetScale}</span>
                <span aria-hidden="true">·</span>
                <span>同步状态：{activeProject.updatedAt}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif-editorial tracking-tight">
                {activeProject.title}
              </h1>

              <p className="text-sm text-stone-600 leading-relaxed">
                {activeProject.logline}
              </p>
            </div>

            {/* Project Switcher & Upload/Export Workspace Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="project-switcher-select"
                  className="text-xs font-medium text-stone-600 whitespace-nowrap"
                >
                  切换创作项目：
                </label>
                <select
                  id="project-switcher-select"
                  value={activeProject.id}
                  onChange={(e) => {
                    setActiveProjectId(e.target.value);
                    setStatusBanner(null);
                  }}
                  className="px-3 py-2 text-xs font-medium text-stone-900 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-500"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上传/导入小说设定</span>
              </button>

              <button
                type="button"
                onClick={handleExportProjectJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出设定库</span>
              </button>
            </div>
          </div>

          {/* 4-Column Full-Width KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setActiveTab('lore')}
              className="text-left p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 transition-colors"
            >
              <div className="text-xs text-stone-500">设定集数据库索引</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-stone-900 font-mono-tabular">
                  {activeProject.loreEntries.length} 项
                </span>
                <span className="text-xs text-stone-500 font-mono-tabular">
                  共创定稿{' '}
                  {
                    activeProject.loreEntries.filter((e) => e.source === 'co-created')
                      .length
                  }{' '}
                  项
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className="text-left p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 transition-colors"
            >
              <div className="text-xs text-stone-500">五维设定健康度与优化</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-amber-800 font-mono-tabular">
                  {avgDiagnosticScore} 分
                </span>
                <span className="text-xs text-stone-500 font-mono-tabular">
                  优化建议 {activeProject.optimizations.length} 条
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outline')}
              className="text-left p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 transition-colors"
            >
              <div className="text-xs text-stone-500">章节细纲与节奏规划表</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-stone-900 font-mono-tabular">
                  {activeProject.chapters.length} 章
                </span>
                <span className="text-xs text-stone-500 font-mono-tabular">
                  节奏合规率 {pacingSummary.complianceRate}%
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inspiration')}
              className="text-left p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/70 hover:border-stone-300 transition-colors"
            >
              <div className="text-xs text-stone-500">剧情转折与伏笔台账</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-stone-900 font-mono-tabular">
                  {activeProject.plotBranches.length} 条推演
                </span>
                <span className="text-xs text-stone-500 font-mono-tabular">
                  伏笔线索 {activeProject.foreshadowings.length} 处
                </span>
              </div>
            </button>
          </div>

          {/* AI Studio Input Box Collaboration Strip */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <div>
              <span className="font-semibold text-stone-700">
                AI Studio 协同模式说明：
              </span>
              <span>
                本界面专注世界观拓扑、诊断雷达与细纲节奏可视化；您可在左侧 AI Studio 输入框直接发送细纲或指令（如「开始」「继续」或新设定），亦可点击右上角「一键清空小说」快速切换项目。
              </span>
            </div>
            <span className="font-mono-tabular text-stone-400">
              {activeProject.lastSyncedPrompt}
            </span>
          </div>
        </section>

        {/* Active Visualization Tab View */}
        {activeTab === 'lore' && (
          <LoreDatabaseView
            entries={activeProject.loreEntries}
            relations={activeProject.relations}
            onAddEntry={handleAddLoreEntry}
            onDeleteEntry={handleDeleteLoreEntry}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsView
            diagnostics={activeProject.diagnostics}
            optimizations={activeProject.optimizations}
            onAdoptOptimization={handleAdoptOptimization}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === 'outline' && (
          <OutlinePacingView
            chapters={activeProject.chapters}
            onRebalancePacing={handleRebalancePacing}
            onAddChapter={handleAddChapter}
            onUpdateChapterRhythm={handleUpdateChapterRhythm}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === 'inspiration' && (
          <PlotInspirationView
            branches={activeProject.plotBranches}
            foreshadowings={activeProject.foreshadowings}
            onAdoptTwist={handleAdoptTwist}
            onToggleForeshadowing={handleToggleForeshadowing}
            onAddForeshadowing={handleAddForeshadowing}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-4 mt-10">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
          <span>长篇小说设定和细纲APP · 世界观分类记忆与细纲节奏可视化工作台</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="hover:text-stone-900 underline"
            >
              导入设定与细纲
            </button>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="hover:text-rose-700 underline"
            >
              一键清空当前小说内容
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportNovel={handleImportNovel}
      />

      <ClearConfirmModal
        isOpen={isClearModalOpen}
        projectTitle={activeProject.title}
        onClose={() => setIsClearModalOpen(false)}
        onConfirmClear={handleConfirmClearWorkspace}
      />
    </div>
  );
}
