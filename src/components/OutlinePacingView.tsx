import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ListOrdered,
  Plus,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { ChapterOutline, RhythmType } from '../types/novel';
import { validatePacingRules } from '../utils/novelEngine';

interface OutlinePacingViewProps {
  chapters: ChapterOutline[];
  onRebalancePacing: () => void;
  onAddChapter: (chapter: Omit<ChapterOutline, 'chapterNumber'>) => void;
  onUpdateChapterRhythm: (chapterNumber: number, rhythmType: RhythmType) => void;
  onOpenUpload: () => void;
}

const RHYTHM_TYPES: RhythmType[] = ['悬疑', '高压', '转折', '喘息', '兑现'];

export const OutlinePacingView: React.FC<OutlinePacingViewProps> = ({
  chapters,
  onRebalancePacing,
  onAddChapter,
  onUpdateChapterRhythm,
  onOpenUpload,
}) => {
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    chapters[0]?.chapterNumber ?? 1
  );
  const [copiedChapter, setCopiedChapter] = useState<number | null>(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // New chapter form state
  const [newTitle, setNewTitle] = useState('');
  const [newRhythm, setNewRhythm] = useState<RhythmType>('悬疑');
  const [newOpening, setNewOpening] = useState('感官特写·器物异变');
  const [newEnding, setNewEnding] = useState('反问定格·身份揭晓');
  const [newPoints, setNewPoints] = useState('');
  const [newPayoff, setNewPayoff] = useState('');
  const [newHook, setNewHook] = useState('');
  const [formError, setFormError] = useState('');

  const pacingReport = useMemo(() => validatePacingRules(chapters), [chapters]);

  const activeChapter = useMemo(() => {
    return (
      chapters.find((c) => c.chapterNumber === selectedChapterNum) ||
      chapters[0] ||
      null
    );
  }, [chapters, selectedChapterNum]);

  // SVG Tension Curve coordinates
  const chartPoints = useMemo(() => {
    if (chapters.length === 0) return [];
    const width = 720;
    const height = 190;
    const padX = 48;
    const padY = 28;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    return chapters.map((ch, i) => {
      const x =
        chapters.length === 1
          ? width / 2
          : padX + (i / (chapters.length - 1)) * usableW;
      const y = padY + ((100 - ch.tensionScore) / 100) * usableH;
      return { ...ch, x, y };
    });
  }, [chapters]);

  const handleCopyPrompt = (ch: ChapterOutline) => {
    const promptText = `【进度】第${ch.chapterNumber}/${chapters.length}章《${ch.title}》｜节奏：${ch.rhythmType}｜开场：${ch.openingMethod}｜结尾：${ch.endingMethod}\n细纲要点：${ch.corePlotPoints.join('；')}\n微兑现：${ch.microPayoff}\n章末钩子：${ch.hookRequirement}\n请按此细纲生成第${ch.chapterNumber}章正文（1800-2800字）。`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText).catch(() => {});
    }
    setCopiedChapter(ch.chapterNumber);
    setTimeout(() => setCopiedChapter(null), 2000);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPoints.trim()) {
      setFormError('请填写章节标题与核心细纲情节点');
      return;
    }
    setFormError('');
    const tensionMap: Record<RhythmType, number> = {
      高压: 89,
      转折: 78,
      悬疑: 68,
      兑现: 56,
      喘息: 36,
    };
    onAddChapter({
      title: newTitle.trim(),
      rhythmType: newRhythm,
      openingMethod: newOpening.trim() || '动作切入·危机余波',
      endingMethod: newEnding.trim() || '悬念定格·身份揭晓',
      corePlotPoints: newPoints
        .split(/\r?\n|[；;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      microPayoff: newPayoff.trim() || '兑现前文埋设的局部线索',
      sensoryAnchor: '环境冷风低鸣与器物触感反馈',
      hookRequirement: newHook.trim() || '章末停在关键抉择与突发异变',
      tensionScore: tensionMap[newRhythm],
      targetWordCount: 2250,
      status: 'planned',
      handoverSummary: {
        protagonistKnowledge: `主角推进了「${newTitle.trim()}」的核心事件，但幕后更深层布局尚未揭晓。`,
        emotionalState: newRhythm === '喘息' ? '回落' : '紧绷',
        nextChapterHook: newHook.trim() || '下一章必须立即应对章末出现的突发危机。',
      },
    });
    setNewTitle('');
    setNewPoints('');
    setNewPayoff('');
    setNewHook('');
    setIsAddingChapter(false);
  };

  if (chapters.length === 0) {
    return (
      <div className="border border-stone-200 bg-white rounded-xl p-10 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-xl font-semibold text-stone-900 font-serif-editorial">
            章节细纲与节奏规划表为空
          </h3>
          <p className="text-sm text-stone-600">
            请上传细纲文档或直接新增第1章细纲，系统将自动生成节奏规划表与张力波形图。
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800"
            >
              导入全书细纲
            </button>
            <button
              type="button"
              onClick={() => setIsAddingChapter(true)}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200"
            >
              手动创建第1章
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Pacing Tension Waveform SVG + Rhythm Compliance Rules Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Cols: Tension Waveform & Rhythm Curve */}
        <div className="lg:col-span-8 border border-stone-200 bg-white rounded-xl p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                章节张力曲线与高低压节奏波形图
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                直观监控「连续高压≤2章」与「每3–5章穿插喘息/兑现章」的呼吸感节奏
              </p>
            </div>
            <div className="text-xs text-stone-500 font-mono-tabular">
              <span>总章数 {chapters.length} 章</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>单章目标区间 1800–2800 字</span>
            </div>
          </div>

          <div className="my-3 bg-stone-50/70 border border-stone-200/70 rounded-lg p-2">
            <svg
              viewBox="0 0 720 190"
              className="w-full h-[185px] select-none"
              role="img"
              aria-label="章节节奏张力曲线图"
            >
              {/* Horizontal Reference Lines */}
              <line
                x1="48"
                y1="45"
                x2="672"
                y2="45"
                stroke="#F59E0B"
                strokeDasharray="4,4"
                strokeWidth="1"
                opacity="0.5"
              />
              <text x="668" y="40" textAnchor="end" fontSize="9" fill="#B45309">
                高压警戒线 (85)
              </text>

              <line
                x1="48"
                y1="135"
                x2="672"
                y2="135"
                stroke="#10B981"
                strokeDasharray="4,4"
                strokeWidth="1"
                opacity="0.5"
              />
              <text x="668" y="130" textAnchor="end" fontSize="9" fill="#047857">
                喘息回落区 (40)
              </text>

              {/* Polyline connecting chapter tension points */}
              {chartPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#B45309"
                  strokeWidth="2.2"
                  points={chartPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                />
              )}

              {/* Chapter Nodes */}
              {chartPoints.map((pt) => {
                const isSelected = activeChapter?.chapterNumber === pt.chapterNumber;
                const nodeColor =
                  pt.rhythmType === '高压'
                    ? '#BE123C'
                    : pt.rhythmType === '喘息'
                    ? '#047857'
                    : pt.rhythmType === '兑现'
                    ? '#1D4ED8'
                    : '#B45309';
                return (
                  <g
                    key={pt.chapterNumber}
                    onClick={() => setSelectedChapterNum(pt.chapterNumber)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="13"
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7"
                      fill={isSelected ? nodeColor : '#FFFFFF'}
                      stroke={nodeColor}
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#1C1917"
                    >
                      {pt.rhythmType}({pt.tensionScore})
                    </text>
                    <text
                      x={pt.x}
                      y="176"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#57534E"
                    >
                      第{pt.chapterNumber}章
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <div>
              <span>最高连续高压：{pacingReport.highPressureMaxStreak} 章（上限2章）</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>喘息/兑现穿插：{pacingReport.reliefChapterCount} 章</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingChapter((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>追加新章节细纲</span>
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Pacing Rules Validator */}
        <div className="lg:col-span-4 border border-stone-200 bg-white rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  节奏规划铁律自检台
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  实时校验网文连载四大防疲劳规则
                </p>
              </div>
              <span className="text-lg font-bold font-mono-tabular text-stone-900">
                {pacingReport.complianceRate}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="py-1.5 flex items-center justify-between border-b border-stone-100">
                <span className="text-stone-600">1. 相邻章节奏类型不得相同</span>
                <span className="font-medium text-stone-900">
                  {pacingReport.violations.some((v) => v.ruleCode === 'ADJACENT_RHYTHM')
                    ? '发现冲突'
                    : '合规通过'}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between border-b border-stone-100">
                <span className="text-stone-600">2. 开场/结尾方式3章内不重复</span>
                <span className="font-medium text-stone-900">
                  {pacingReport.violations.some(
                    (v) => v.ruleCode === 'OPENING_REPEAT' || v.ruleCode === 'ENDING_REPEAT'
                  )
                    ? '发现重复'
                    : '合规通过'}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between border-b border-stone-100">
                <span className="text-stone-600">3. 连续高压不超过2章</span>
                <span className="font-medium text-stone-900">
                  {pacingReport.violations.some((v) => v.ruleCode === 'HIGH_PRESSURE_STREAK')
                    ? '超限预警'
                    : '合规通过'}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between border-b border-stone-100">
                <span className="text-stone-600">4. 每3–5章穿插喘息/兑现章</span>
                <span className="font-medium text-stone-900">
                  {pacingReport.violations.some((v) => v.ruleCode === 'MISSING_RELIEF_WINDOW')
                    ? '缺少喘息'
                    : '合规通过'}
                </span>
              </div>
            </div>

            {pacingReport.violations.length > 0 ? (
              <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3 space-y-1.5">
                <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>检测到 {pacingReport.violations.length} 处节奏排布冲突：</span>
                </div>
                <ul className="text-xs text-amber-800 space-y-1">
                  {pacingReport.violations.slice(0, 3).map((v, i) => (
                    <li key={i}>• {v.message}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3 flex items-center gap-2 text-xs text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>当前全部章节均严格满足节奏规划表四大铁律，可直接逐章推进。</span>
              </div>
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
            <span className="text-xs text-stone-500">遇到冲突可一键重排</span>
            <button
              type="button"
              onClick={onRebalancePacing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>智能校准全书节奏</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Add Chapter Form */}
      {isAddingChapter && (
        <form
          onSubmit={handleCreateChapter}
          className="border border-stone-300 bg-white rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-semibold text-stone-900">
              新增第 {chapters.length + 1} 章细纲与节奏规划
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingChapter(false)}
              className="text-xs text-stone-500 hover:text-stone-900"
            >
              收起
            </button>
          </div>
          {formError && <p className="text-xs text-rose-600">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-title-input">
                章节标题
              </label>
              <input
                id="ch-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="如：夜渡锁龙闸"
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-rhythm-select">
                节奏类型
              </label>
              <select
                id="ch-rhythm-select"
                value={newRhythm}
                onChange={(e) => setNewRhythm(e.target.value as RhythmType)}
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg bg-white"
              >
                {RHYTHM_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-open-input">
                开场方式（3章内不重复）
              </label>
              <input
                id="ch-open-input"
                type="text"
                value={newOpening}
                onChange={(e) => setNewOpening(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-end-input">
                结尾方式（3章内不重复）
              </label>
              <input
                id="ch-end-input"
                type="text"
                value={newEnding}
                onChange={(e) => setNewEnding(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-points-input">
                本章细纲情节点（分号或换行分隔）
              </label>
              <textarea
                id="ch-points-input"
                rows={2}
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                placeholder="只写本章兑现的情节点，不提前透支后续真相..."
                className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-payoff-input">
                  本章微兑现
                </label>
                <input
                  id="ch-payoff-input"
                  type="text"
                  value={newPayoff}
                  onChange={(e) => setNewPayoff(e.target.value)}
                  placeholder="兑现哪一处前文小期待"
                  className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="ch-hook-input">
                  章末钩子要求
                </label>
                <input
                  id="ch-hook-input"
                  type="text"
                  value={newHook}
                  onChange={(e) => setNewHook(e.target.value)}
                  placeholder="自然停在悬念/决定/意外上"
                  className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingChapter(false)}
              className="px-4 py-1.5 text-xs text-stone-600"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-700"
            >
              加入章节细纲表
            </button>
          </div>
        </form>
      )}

      {/* Selected Chapter Inspector & Handover Summary */}
      {activeChapter && (
        <div className="border border-stone-200 bg-white rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="text-xs font-mono-tabular text-amber-900 font-semibold">
                【进度】第{activeChapter.chapterNumber}/{chapters.length}章《{activeChapter.title}》｜节奏：{activeChapter.rhythmType}｜开场：{activeChapter.openingMethod}｜结尾：{activeChapter.endingMethod}
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif-editorial mt-1">
                第 {activeChapter.chapterNumber} 章《{activeChapter.title}》单章蓝图与交接摘要
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="quick-rhythm-switch"
                className="text-xs text-stone-500 whitespace-nowrap"
              >
                调整本章节奏：
              </label>
              <select
                id="quick-rhythm-switch"
                value={activeChapter.rhythmType}
                onChange={(e) =>
                  onUpdateChapterRhythm(
                    activeChapter.chapterNumber,
                    e.target.value as RhythmType
                  )
                }
                className="px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
              >
                {RHYTHM_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleCopyPrompt(activeChapter)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiedChapter === activeChapter.chapterNumber
                    ? '已复制单章指令'
                    : '复制本章生成指令'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-semibold text-stone-700">
                本章细纲情节点清单（严格按章兑现，不跨章透支）
              </h4>
              <ol className="space-y-2 text-sm text-stone-800 list-decimal list-inside bg-stone-50 p-4 rounded-lg border border-stone-200/70">
                {activeChapter.corePlotPoints.map((pt, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-xs text-stone-500">上文期待微兑现</div>
                  <div className="text-xs font-medium text-stone-800 mt-1">
                    {activeChapter.microPayoff}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-xs text-stone-500">非视觉感官支点</div>
                  <div className="text-xs font-medium text-stone-800 mt-1">
                    {activeChapter.sensoryAnchor}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/60">
                  <div className="text-xs text-stone-500">章末钩子落点</div>
                  <div className="text-xs font-medium text-amber-900 mt-1">
                    {activeChapter.hookRequirement}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-stone-50 border border-stone-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
                  <h4 className="text-xs font-semibold text-stone-800">
                    跨章交接摘要（100–150字标准三要素）
                  </h4>
                  <span className="text-xs font-mono-tabular text-stone-500">
                    目标字数：{activeChapter.targetWordCount}字
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-stone-700">
                      ① 主角认知边界（已知/未知）：
                    </span>
                    <p className="text-stone-600 mt-0.5 leading-relaxed">
                      {activeChapter.handoverSummary.protagonistKnowledge}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">
                      ② 情绪停驻位置：
                    </span>
                    <span className="text-stone-900 font-medium ml-1">
                      {activeChapter.handoverSummary.emotionalState}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">
                      ③ 下一章必接钩子：
                    </span>
                    <p className="text-stone-600 mt-0.5 leading-relaxed">
                      {activeChapter.handoverSummary.nextChapterHook}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-stone-500 border-t border-stone-200/70 pt-2">
                配合 AI Studio 对话框：回复「开始」或「继续」即可依据此交接摘要逐章生成正文。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Chapter Directory & Rhythm Planning Table */}
      <div className="border border-stone-200 bg-white rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-stone-900">
              章节目录清单与节奏规划总表
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              点击任意行可切换上方单章交接摘要视图
            </p>
          </div>
          <span className="text-xs font-mono-tabular text-stone-500">
            共 {chapters.length} 章已排期
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                <th className="py-3 px-4 font-medium">章号 / 标题</th>
                <th className="py-3 px-4 font-medium">节奏类型</th>
                <th className="py-3 px-4 font-medium">开场方式</th>
                <th className="py-3 px-4 font-medium">结尾方式</th>
                <th className="py-3 px-4 font-medium">本章核心细纲要点与微兑现</th>
                <th className="py-3 px-4 font-medium text-right">目标字数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {chapters.map((ch) => {
                const isSelected = activeChapter?.chapterNumber === ch.chapterNumber;
                return (
                  <tr
                    key={ch.chapterNumber}
                    onClick={() => setSelectedChapterNum(ch.chapterNumber)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-stone-900 whitespace-nowrap">
                      <span className="font-mono-tabular text-stone-400 mr-1.5">
                        #{String(ch.chapterNumber).padStart(2, '0')}
                      </span>
                      <span>《{ch.title}》</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-stone-800">
                      {ch.rhythmType}{' '}
                      <span className="font-mono-tabular font-normal text-stone-400">
                        ({ch.tensionScore})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                      {ch.openingMethod}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                      {ch.endingMethod}
                    </td>
                    <td className="py-3.5 px-4 text-stone-700 max-w-md">
                      <div className="truncate">{ch.corePlotPoints.join('；')}</div>
                      <div className="text-stone-400 truncate mt-0.5">
                        微兑现：{ch.microPayoff} · 钩子：{ch.hookRequirement}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-stone-600 whitespace-nowrap">
                      {ch.targetWordCount} 字
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
