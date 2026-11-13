import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  GitPullRequest,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ForeshadowingItem, PlotTwistBranch } from '../types/novel';

interface PlotInspirationViewProps {
  branches: PlotTwistBranch[];
  foreshadowings: ForeshadowingItem[];
  onAdoptTwist: (branchId: string) => void;
  onToggleForeshadowing: (id: string) => void;
  onAddForeshadowing: (item: Omit<ForeshadowingItem, 'id' | 'code'>) => void;
  onOpenUpload: () => void;
}

export const PlotInspirationView: React.FC<PlotInspirationViewProps> = ({
  branches,
  foreshadowings,
  onAdoptTwist,
  onToggleForeshadowing,
  onAddForeshadowing,
  onOpenUpload,
}) => {
  const [isAddingClue, setIsAddingClue] = useState(false);
  const [clueTitle, setClueTitle] = useState('');
  const [plantedCh, setPlantedCh] = useState('第1章');
  const [payoffCh, setPayoffCh] = useState('第8章');
  const [clueDetail, setClueDetail] = useState('');

  const handleCreateClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueTitle.trim() || !clueDetail.trim()) return;
    onAddForeshadowing({
      title: clueTitle.trim(),
      plantedChapter: plantedCh.trim() || '当前章节',
      expectedPayoffChapter: payoffCh.trim() || '后续章节',
      clueDetail: clueDetail.trim(),
      status: 'planted',
    });
    setClueTitle('');
    setClueDetail('');
    setIsAddingClue(false);
  };

  if (branches.length === 0 && foreshadowings.length === 0) {
    return (
      <div className="border border-stone-200 bg-white rounded-xl p-10 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <h3 className="text-xl font-semibold text-stone-900 font-serif-editorial">
            暂无剧情推演与伏笔台账
          </h3>
          <p className="text-sm text-stone-600">
            请先导入您的小说设定或细纲，系统将结合已有人物动机与未回收伏笔生成后续情节转折提示。
          </p>
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800"
          >
            上传小说设定生成推演
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plot Progression & Twist Catalyst Branches */}
      <div className="border border-stone-200 bg-white rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif-editorial">
              基于已有要素的剧情推演与情节转折提示
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              自动串联设定集中的人物弱点、法则代价与未回收伏笔；点击「推演并加入细纲」可直接生成下一章蓝图
            </p>
          </div>
          <div className="text-xs text-stone-500 font-mono-tabular">
            <span>可选推演分支 {branches.length} 条</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {branches.map((branch, idx) => (
            <div
              key={branch.id}
              className="border border-stone-200 rounded-xl p-5 bg-white hover:border-stone-300 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="space-y-3 flex-1">
                  {/* Unboxed metadata line */}
                  <div className="text-xs text-stone-500 flex flex-wrap items-center gap-2">
                    <span className="font-mono-tabular font-semibold text-amber-900">
                      推演路径 0{idx + 1} · {branch.stageLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>建议节奏：{branch.suggestedRhythm}</span>
                    <span aria-hidden="true">·</span>
                    <span>涉及要素：{branch.involvedEntities.join(' / ')}</span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 font-serif-editorial">
                    {branch.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200/60">
                      <div className="text-xs font-semibold text-stone-700 mb-1">
                        1. 触发情境与引爆前提
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {branch.triggerCondition}
                      </p>
                    </div>

                    <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200/60">
                      <div className="text-xs font-semibold text-amber-900 mb-1">
                        2. 意外转折与反套路机制
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {branch.twistMechanism}
                      </p>
                    </div>

                    <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200/60">
                      <div className="text-xs font-semibold text-stone-700 mb-1">
                        3. 剧情推进后果与新钩子
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {branch.consequencePreview}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-stone-500 pt-1">
                    <span>调用前文伏笔：{branch.foreshadowingUsed}</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>建议开场：{branch.suggestedOpening}</span>
                    <span className="mx-2" aria-hidden="true">·</span>
                    <span>建议收尾：{branch.suggestedEnding}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center lg:flex-col lg:items-end justify-end">
                  {branch.adoptedChapter ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已并入第 {branch.adoptedChapter} 章细纲</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAdoptTwist(branch.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>采纳并生成下一章细纲</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Foreshadowing Ledger Table */}
      <div className="border border-stone-200 bg-white rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">
              全书伏笔埋设与微兑现追踪台账
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              防止长篇连载“挖坑不填”；点击状态按钮可切换伏笔回收进度
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingClue((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>登记新伏笔</span>
          </button>
        </div>

        {isAddingClue && (
          <form
            onSubmit={handleCreateClue}
            className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="fs-title">
                  伏笔名称
                </label>
                <input
                  id="fs-title"
                  type="text"
                  value={clueTitle}
                  onChange={(e) => setClueTitle(e.target.value)}
                  placeholder="如：哑叔留下的半块星盘"
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="fs-plant">
                  埋设章节
                </label>
                <input
                  id="fs-plant"
                  type="text"
                  value={plantedCh}
                  onChange={(e) => setPlantedCh(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="fs-payoff">
                  预计回收章节
                </label>
                <input
                  id="fs-payoff"
                  type="text"
                  value={payoffCh}
                  onChange={(e) => setPayoffCh(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-stone-600 mb-1" htmlFor="fs-detail">
                  伏笔细节与回收设计
                </label>
                <input
                  id="fs-detail"
                  type="text"
                  value={clueDetail}
                  onChange={(e) => setClueDetail(e.target.value)}
                  placeholder="说明该伏笔如何在后续推进剧情转折..."
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-700 whitespace-nowrap"
              >
                保存伏笔
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                <th className="py-2.5 px-4 font-medium">编号</th>
                <th className="py-2.5 px-4 font-medium">伏笔要素名称</th>
                <th className="py-2.5 px-4 font-medium">埋设节点</th>
                <th className="py-2.5 px-4 font-medium">预计兑现/回收</th>
                <th className="py-2.5 px-4 font-medium">细节描述</th>
                <th className="py-2.5 px-4 font-medium text-right">当前状态（点击切换）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {foreshadowings.map((fs) => (
                <tr key={fs.id} className="hover:bg-stone-50/80">
                  <td className="py-3 px-4 font-mono-tabular text-stone-500">
                    {fs.code}
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-900">
                    {fs.title}
                  </td>
                  <td className="py-3 px-4 font-mono-tabular text-stone-600">
                    {fs.plantedChapter}
                  </td>
                  <td className="py-3 px-4 font-mono-tabular text-stone-600">
                    {fs.expectedPayoffChapter}
                  </td>
                  <td className="py-3 px-4 text-stone-600 max-w-sm">
                    {fs.clueDetail}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onToggleForeshadowing(fs.id)}
                      className="text-xs font-medium text-amber-900 hover:underline"
                    >
                      {fs.status === 'planted'
                        ? '已埋设（待触发）'
                        : fs.status === 'rippling'
                        ? '微兑现发酵中'
                        : '已完成闭环回收'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
