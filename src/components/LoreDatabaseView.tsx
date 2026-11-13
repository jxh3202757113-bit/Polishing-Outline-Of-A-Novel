import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Compass,
  Filter,
  GitBranch,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { LoreCategory, LoreEntry, LoreRelation } from '../types/novel';
import { CATEGORY_META } from '../utils/novelEngine';

interface LoreDatabaseViewProps {
  entries: LoreEntry[];
  relations: LoreRelation[];
  onAddEntry: (entry: Omit<LoreEntry, 'id' | 'updatedAt'>) => void;
  onDeleteEntry: (id: string) => void;
  onOpenUpload: () => void;
}

const ALL_CATEGORIES: LoreCategory[] = [
  'character',
  'faction',
  'system',
  'geography',
  'artifact',
  'timeline',
];

export const LoreDatabaseView: React.FC<LoreDatabaseViewProps> = ({
  entries,
  relations,
  onAddEntry,
  onDeleteEntry,
  onOpenUpload,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LoreCategory | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'uploaded' | 'co-created'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    entries[0]?.id ?? null
  );
  const [isAdding, setIsAdding] = useState(false);

  // New entry form state
  const [newCategory, setNewCategory] = useState<LoreCategory>('character');
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newAttrLabel, setNewAttrLabel] = useState('核心特征');
  const [newAttrValue, setNewAttrValue] = useState('');
  const [newTags, setNewTags] = useState('');
  const [formError, setFormError] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = entry.name.toLowerCase().includes(q);
        const matchSub = entry.subtitle.toLowerCase().includes(q);
        const matchSum = entry.summary.toLowerCase().includes(q);
        const matchTags = entry.tags.some((t) => t.toLowerCase().includes(q));
        return matchName || matchSub || matchSum || matchTags;
      }
      return true;
    });
  }, [entries, selectedCategory, sourceFilter, searchQuery]);

  const activeEntry = useMemo(() => {
    return (
      entries.find((e) => e.id === selectedEntryId) ||
      filteredEntries[0] ||
      null
    );
  }, [entries, filteredEntries, selectedEntryId]);

  // Compute graph nodes with fallback coordinates
  const graphNodes = useMemo(() => {
    return entries.slice(0, 8).map((entry, idx) => {
      const angle = (idx / Math.min(8, Math.max(1, entries.length))) * Math.PI * 2;
      const defaultX = Math.round(390 + Math.cos(angle) * 210);
      const defaultY = Math.round(185 + Math.sin(angle) * 115);
      return {
        ...entry,
        x: entry.graphPosition?.x ?? defaultX,
        y: entry.graphPosition?.y ?? defaultY,
      };
    });
  }, [entries]);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSummary.trim()) {
      setFormError('请填写设定名称与详细设定描述');
      return;
    }
    setFormError('');
    onAddEntry({
      category: newCategory,
      name: newName.trim(),
      subtitle: newSubtitle.trim() || `${CATEGORY_META[newCategory].label} · 手动归档`,
      summary: newSummary.trim(),
      attributes: newAttrValue.trim()
        ? [{ label: newAttrLabel.trim() || '关键属性', value: newAttrValue.trim() }]
        : [{ label: '状态', value: '已纳入世界观正典' }],
      tags: newTags
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      source: 'co-created',
      graphPosition: {
        x: 200 + ((entries.length * 115) % 440),
        y: 90 + ((entries.length * 75) % 210),
      },
    });
    setNewName('');
    setNewSubtitle('');
    setNewSummary('');
    setNewAttrValue('');
    setNewTags('');
    setIsAdding(false);
  };

  if (entries.length === 0) {
    return (
      <div className="border border-stone-200 bg-white rounded-xl p-10 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-stone-900 font-serif-editorial">
            设定集数据库当前为空
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            您已清空当前小说内容。可以立即上传新的中长篇小说设定文档，或直接手动录入第一条世界观档案。
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
            >
              上传/粘贴小说设定
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0"
            >
              新增首条设定档案
            </button>
          </div>
        </div>

        {isAdding && (
          <form
            onSubmit={handleCreateEntry}
            className="mt-8 max-w-xl mx-auto text-left border-t border-stone-200 pt-6 space-y-4"
          >
            <h4 className="text-sm font-semibold text-stone-900">录入新设定条目</h4>
            {formError && <p className="text-xs text-rose-600">{formError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="empty-lore-name">
                  设定名称
                </label>
                <input
                  id="empty-lore-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：沈夜 / 烬海法典"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="empty-lore-cat">
                  所属分类
                </label>
                <select
                  id="empty-lore-cat"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as LoreCategory)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_META[c].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="empty-lore-summary">
                核心设定描述
              </label>
              <textarea
                id="empty-lore-summary"
                rows={3}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="输入人物动机、法则代价或势力格局..."
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-700"
              >
                保存至设定集
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Visual Row: Interactive Worldbuilding Topology Graph + Category Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Cols: Interactive SVG Relationship & Worldbuilding Topology */}
        <div className="lg:col-span-8 border border-stone-200 bg-white rounded-xl p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-800" />
                <span>世界观要素与人物势力拓扑星图</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                点击任意节点即可在右侧调阅完整档案；连线展示核心因果、宿敌对抗与统属关系
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500 font-mono-tabular">
              <span>已归档节点 {entries.length}</span>
              <span aria-hidden="true">·</span>
              <span>因果关系链 {relations.length}</span>
            </div>
          </div>

          <div className="relative my-3 bg-stone-50/70 border border-stone-200/70 rounded-lg overflow-hidden">
            <svg
              viewBox="0 0 780 360"
              className="w-full h-[300px] select-none"
              role="img"
              aria-label="世界观人物与势力关系可视化拓扑图"
            >
              <defs>
                <pattern
                  id="editorial-grid"
                  width="36"
                  height="36"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 36 0 L 0 0 0 36"
                    fill="none"
                    stroke="#E7E5E4"
                    strokeWidth="0.75"
                  />
                </pattern>
              </defs>
              <rect width="780" height="360" fill="url(#editorial-grid)" />

              {/* Relationship Edges */}
              {relations.map((rel) => {
                const source = graphNodes.find((n) => n.id === rel.sourceId);
                const target = graphNodes.find((n) => n.id === rel.targetId);
                if (!source || !target) return null;
                const midX = (source.x + target.x) / 2;
                const midY = (source.y + target.y) / 2;
                const strokeColor =
                  rel.tension === 'rival'
                    ? '#BE123C'
                    : rel.tension === 'ally'
                    ? '#047857'
                    : rel.tension === 'mystery'
                    ? '#B45309'
                    : '#4B5563';

                return (
                  <g key={rel.id}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray={rel.tension === 'mystery' ? '5,4' : undefined}
                      opacity="0.65"
                    />
                    <rect
                      x={midX - 68}
                      y={midY - 10}
                      width="136"
                      height="19"
                      rx="4"
                      fill="#FAF8F5"
                      stroke="#E7E5E4"
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#57534E"
                    >
                      {rel.label.slice(0, 14)}
                    </text>
                  </g>
                );
              })}

              {/* Entity Nodes */}
              {graphNodes.map((node) => {
                const isSelected = activeEntry?.id === node.id;
                const meta = CATEGORY_META[node.category];
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedEntryId(node.id)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        r="31"
                        fill="none"
                        stroke={meta.color}
                        strokeWidth="2"
                        strokeDasharray="3,3"
                      />
                    )}
                    <circle
                      r="24"
                      fill={isSelected ? meta.color : '#FFFFFF'}
                      stroke={meta.color}
                      strokeWidth="2"
                    />
                    <text
                      y="-2"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={isSelected ? '#FFFFFF' : '#1C1917'}
                    >
                      {node.name.slice(0, 4)}
                    </text>
                    <text
                      y="11"
                      textAnchor="middle"
                      fontSize="9"
                      fill={isSelected ? '#FEF3C7' : '#78716C'}
                    >
                      {meta.shortLabel}
                    </text>
                    <text
                      y="38"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? '600' : '500'}
                      fill="#1C1917"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Graph Legend as clean inline unboxed text */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 pt-1">
            <div>
              <span>实线红：宿敌对抗</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>虚线金：隐秘因果/代价</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>实线绿：契约同盟</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>实线灰：统属/控制</span>
            </div>
            <span>提示：可在AI Studio输入框发送「新增人物关系」或直接新增条目扩展星图</span>
          </div>
        </div>

        {/* Right 4 Cols: Selected Entity Visual Dossier */}
        <div className="lg:col-span-4 border border-stone-200 bg-white rounded-xl p-5 flex flex-col justify-between">
          {activeEntry ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <div className="text-xs text-stone-500">
                    <span>{CATEGORY_META[activeEntry.category].label}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>
                      {activeEntry.source === 'uploaded' ? '上传原始设定' : '共创最终成果'}
                    </span>
                    {activeEntry.chapterRef && (
                      <>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{activeEntry.chapterRef}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 font-serif-editorial mt-1">
                    {activeEntry.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">{activeEntry.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEntry(activeEntry.id)}
                  aria-label={`删除设定条目 ${activeEntry.name}`}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-stone-700 mb-1.5">
                  核心设定详述
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200/60">
                  {activeEntry.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-stone-700 mb-2">
                  结构化索引属性
                </h4>
                <div className="divide-y divide-stone-100 border-t border-b border-stone-100">
                  {activeEntry.attributes.map((attr, i) => (
                    <div
                      key={i}
                      className="py-2 flex items-baseline justify-between gap-4 text-xs"
                    >
                      <span className="text-stone-500 shrink-0">{attr.label}</span>
                      <span className="text-stone-900 font-medium text-right">
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 text-xs text-stone-500">
                <span>索引标签：</span>
                <span>{activeEntry.tags.join(' / ') || '无'}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>更新：{activeEntry.updatedAt}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-stone-500 py-12 text-center">
              请在左侧点击任意设定节点或下方卡片查看详情
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              分类记忆库支持按来源检索
            </span>
            <button
              type="button"
              onClick={() => setIsAdding((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增设定条目</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Add Lore Entry Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateEntry}
          className="border border-stone-300 bg-white rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-semibold text-stone-900">
              新增世界观设定档案（自动归入共创最终成果库）
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              收起表单
            </button>
          </div>
          {formError && <p className="text-xs text-rose-600">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="lore-name-input">
                条目名称
              </label>
              <input
                id="lore-name-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：闻人鹤 / 锁龙船闸"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="lore-cat-select">
                设定分类
              </label>
              <select
                id="lore-cat-select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as LoreCategory)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1" htmlFor="lore-sub-input">
                定位副标题
              </label>
              <input
                id="lore-sub-input"
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="例如：钦天监大监正 · 幕后执棋人"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-stone-600 mb-1" htmlFor="lore-sum-input">
                详细设定描述
              </label>
              <textarea
                id="lore-sum-input"
                rows={2}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="填写该人物、势力、地理或法则的核心规则、动机与代价..."
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="lore-attr-val">
                  核心属性说明（{newAttrLabel}）
                </label>
                <input
                  id="lore-attr-val"
                  type="text"
                  value={newAttrValue}
                  onChange={(e) => setNewAttrValue(e.target.value)}
                  placeholder="例如：掌控二十八宿星轨大阵"
                  className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1" htmlFor="lore-tags-input">
                  检索索引词（逗号分隔）
                </label>
                <input
                  id="lore-tags-input"
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="如：王都篇, 核心反派"
                  className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-amber-800 rounded-lg hover:bg-amber-700 transition-colors"
            >
              确认录入设定集
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="border border-stone-200 bg-white rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Segmented Controls */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            全部设定 ({entries.length})
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const count = entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {CATEGORY_META[cat].shortLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* Source Filter + Search Input */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sourceFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              全部来源
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('uploaded')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sourceFilter === 'uploaded'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              上传原稿 ({entries.filter((e) => e.source === 'uploaded').length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('co-created')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sourceFilter === 'co-created'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              共创定稿 ({entries.filter((e) => e.source === 'co-created').length})
            </button>
          </div>

          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="检索设定集数据库"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="检索人物、法则、伏笔道具..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-400"
            />
          </div>
        </div>
      </div>

      {/* Categorized Lore Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEntries.map((entry) => {
          const isSelected = activeEntry?.id === entry.id;
          return (
            <article
              key={entry.id}
              onClick={() => setSelectedEntryId(entry.id)}
              className={`border rounded-xl p-5 bg-white transition-colors cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-800 ring-1 ring-amber-800/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Clean unboxed metadata kicker */}
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                  <div>
                    <span className="font-medium text-stone-700">
                      {CATEGORY_META[entry.category].label}
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>
                      {entry.source === 'uploaded' ? '上传设定' : '共创定稿'}
                    </span>
                  </div>
                  {entry.chapterRef && (
                    <span className="font-mono-tabular text-stone-400">
                      {entry.chapterRef}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-stone-900 font-serif-editorial mt-1.5">
                  {entry.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{entry.subtitle}</p>

                <p className="text-sm text-stone-700 leading-relaxed mt-3 line-clamp-3">
                  {entry.summary}
                </p>

                {entry.attributes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
                    {entry.attributes.slice(0, 2).map((attr, idx) => (
                      <div key={idx} className="text-xs flex items-baseline justify-between gap-3">
                        <span className="text-stone-400 shrink-0">{attr.label}</span>
                        <span className="text-stone-700 truncate text-right">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <span>{entry.tags.join(' · ')}</span>
                <span>{entry.updatedAt}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
