import React, { useMemo } from 'react';
import { CheckCircle2, Compass, Layers, Sparkles } from 'lucide-react';
import { DiagnosticDimension, OptimizationProposal } from '../types/novel';
import { CATEGORY_META } from '../utils/novelEngine';

interface DiagnosticsViewProps {
  diagnostics: DiagnosticDimension[];
  optimizations: OptimizationProposal[];
  onAdoptOptimization: (proposalId: string) => void;
  onOpenUpload: () => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  diagnostics,
  optimizations,
  onAdoptOptimization,
  onOpenUpload,
}) => {
  const averageScore = useMemo(() => {
    if (diagnostics.length === 0) return 0;
    const sum = diagnostics.reduce((acc, d) => acc + d.score, 0);
    return Math.round(sum / diagnostics.length);
  }, [diagnostics]);

  // Compute Pentagon Radar Coordinates for up to 5 dimensions
  const radarGeometry = useMemo(() => {
    const center = { x: 200, y: 148 };
    const radius = 96;
    const items = diagnostics.slice(0, 5);
    if (items.length < 3) return null;

    const points = items.map((d, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / items.length;
      const ratio = Math.max(0.2, Math.min(1, d.score / 100));
      return {
        label: d.label,
        score: d.score,
        axisX: center.x + Math.cos(angle) * radius,
        axisY: center.y + Math.sin(angle) * radius,
        labelX: center.x + Math.cos(angle) * (radius + 42),
        labelY: center.y + Math.sin(angle) * (radius + 20),
        valX: center.x + Math.cos(angle) * (radius * ratio),
        valY: center.y + Math.sin(angle) * (radius * ratio),
      };
    });

    const polygonPoints = points.map((p) => `${p.valX},${p.valY}`).join(' ');
    const ringLevels = [0.35, 0.65, 1].map((r) =>
      items
        .map((_, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / items.length;
          return `${center.x + Math.cos(angle) * radius * r},${
            center.y + Math.sin(angle) * radius * r
          }`;
        })
        .join(' ')
    );

    return { center, points, polygonPoints, ringLevels };
  }, [diagnostics]);

  if (diagnostics.length === 0 && optimizations.length === 0) {
    return (
      <div className="border border-stone-200 bg-white rounded-xl p-10 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <h3 className="text-xl font-semibold text-stone-900 font-serif-editorial">
            暂无设定诊断数据
          </h3>
          <p className="text-sm text-stone-600">
            请先上传您的中长篇小说设定或切换至预设项目，系统将自动生成五维结构分析与个性化优化方案。
          </p>
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
          >
            上传小说设定开始分析
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 2-Column Split: Five-Axis Radar Chart + Quantitative Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 Cols: SVG Radar Chart */}
        <div className="lg:col-span-5 border border-stone-200 bg-white rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-baseline justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                世界观与长线叙事五维健康度
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                基于冲突闭环、代价机制与连载延展性综合评估
              </p>
            </div>
            <div className="text-right font-mono-tabular">
              <span className="text-2xl font-bold text-amber-800">{averageScore}</span>
              <span className="text-xs text-stone-500"> / 100</span>
            </div>
          </div>

          {radarGeometry ? (
            <div className="my-2 flex items-center justify-center">
              <svg
                viewBox="0 0 400 295"
                className="w-full max-w-[380px] h-[255px]"
                role="img"
                aria-label="小说设定五维诊断雷达图"
              >
                {radarGeometry.ringLevels.map((pts, idx) => (
                  <polygon
                    key={idx}
                    points={pts}
                    fill={idx === 2 ? '#FAF8F5' : 'none'}
                    stroke="#E7E5E4"
                    strokeWidth="1"
                  />
                ))}
                {radarGeometry.points.map((pt, idx) => (
                  <line
                    key={idx}
                    x1={radarGeometry.center.x}
                    y1={radarGeometry.center.y}
                    x2={pt.axisX}
                    y2={pt.axisY}
                    stroke="#E7E5E4"
                    strokeWidth="1"
                  />
                ))}
                <polygon
                  points={radarGeometry.polygonPoints}
                  fill="rgba(180, 83, 9, 0.16)"
                  stroke="#B45309"
                  strokeWidth="2"
                />
                {radarGeometry.points.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.valX} cy={pt.valY} r="4" fill="#B45309" />
                    <text
                      x={pt.labelX}
                      y={pt.labelY}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="500"
                      fill="#292524"
                    >
                      {pt.label} ({pt.score})
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : null}

          <div className="text-xs text-stone-500 border-t border-stone-100 pt-3 flex items-center justify-between">
            <span>采纳下方优化方案将实时补强薄弱维度并归入设定库</span>
            <span className="font-mono-tabular">
              已采纳 {optimizations.filter((o) => o.adopted).length}/{optimizations.length}
            </span>
          </div>
        </div>

        {/* Right 7 Cols: Dimension Table & Editor's Diagnosis */}
        <div className="lg:col-span-7 border border-stone-200 bg-white rounded-xl p-5 flex flex-col justify-between">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-base font-semibold text-stone-900">
              分项深度剖析与长篇连载基准线对比
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              识别百万字连载中常见的战力崩坏、动机扁平与换地图断层风险
            </p>
          </div>

          <div className="divide-y divide-stone-100 my-2">
            {diagnostics.map((item) => (
              <div key={item.id} className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {item.label}
                    </span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-500 font-mono-tabular">
                      {item.benchmark}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-stone-900 font-mono-tabular">
                    {item.score} 分
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-800 rounded-full transition-all duration-200"
                    style={{ width: `${item.score}%` }}
                  />
                </div>

                <p className="text-xs text-stone-600 leading-relaxed pt-0.5">
                  {item.diagnosis}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-100 pt-3 text-xs text-stone-500">
            诊断结论：核心设定具备鲜明的记忆点与代价张力，重点需补强底层检验规则与反派人性灰度。
          </div>
        </div>
      </div>

      {/* Personalized Optimization Proposals Section */}
      <div className="border border-stone-200 bg-white rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif-editorial">
              个性化设定优化方案与共创成果归档
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              针对您上传的小说设定定制；点击「采纳并归档至设定集」即可将最终成果永久写入世界观数据库
            </p>
          </div>
          <div className="text-xs text-stone-500 font-mono-tabular">
            <span>待处理方案 {optimizations.filter((o) => !o.adopted).length}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>已归档成果 {optimizations.filter((o) => o.adopted).length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {optimizations.map((opt, index) => (
            <div
              key={opt.id}
              className={`border rounded-xl p-5 transition-colors ${
                opt.adopted
                  ? 'border-stone-200 bg-stone-50/70'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  {/* Unboxed metadata line */}
                  <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2">
                    <span className="font-mono-tabular font-semibold text-stone-700">
                      0{index + 1}. {opt.targetArea}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      优先级：
                      {opt.severity === 'high'
                        ? '高优结构补强'
                        : opt.severity === 'medium'
                        ? '中优张力深化'
                        : '长线伏笔扩展'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      状态：{opt.adopted ? '已采纳并写入设定集' : '待审阅采纳'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 font-serif-editorial">
                    {opt.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/60">
                      <div className="text-xs font-semibold text-stone-700 mb-1">
                        设定隐患剖析
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {opt.problemAnalysis}
                      </p>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/60">
                      <div className="text-xs font-semibold text-amber-900 mb-1">
                        可执行优化方案
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {opt.actionablePlan}
                      </p>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/60">
                      <div className="text-xs font-semibold text-stone-700 mb-1">
                        预期剧情收益
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {opt.expectedPayoff}
                      </p>
                    </div>
                  </div>

                  {opt.suggestedLoreEntry && (
                    <div className="pt-2 text-xs text-stone-600 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-stone-800">
                        联动生成设定条目：
                      </span>
                      <span>
                        【{CATEGORY_META[opt.suggestedLoreEntry.category].shortLabel}】
                        {opt.suggestedLoreEntry.name} — {opt.suggestedLoreEntry.subtitle}
                      </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center lg:flex-col lg:items-end justify-between gap-2 pt-2 lg:pt-0">
                  {opt.adopted ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已并入设定集数据库</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAdoptOptimization(opt.id)}
                      className="px-4 py-2 text-xs font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0"
                    >
                      采纳并归档至设定集
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
