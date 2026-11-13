import React, { useState } from 'react';
import { AlertTriangle, FileText, RotateCcw, Upload, X } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNovel: (rawText: string, title?: string, genre?: string) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onImportNovel,
}) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('东方奇幻 / 权谋悬疑');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawText(reader.result);
        setError('');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError('请上传设定文件或粘贴您的小说设定/细纲内容');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onImportNovel(rawText, title, genre);
      setRawText('');
      setTitle('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '解析失败，请检查文本内容');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleTemplate = () => {
    setTitle('《北境铸剑录》');
    setGenre('古典仙侠 · 悬疑群像');
    setRawText(
      `《北境铸剑录》\n主角：陆沉，北境寒铁坞唯一幸存的铸剑学徒，天生无灵根却能听见古兵器的器魂悲鸣。\n势力：神兵阁，垄断九州灵铁配额的庞大商会，暗中搜集上古凶兵。\n体系：铸魂九锻，每锻造一柄通灵古剑，铸剑师需献祭自身一载阳寿或一段执念。\n地理：寒铁坞，位于极北冰原裂谷底部的千年地火锻造城。\n第1章：残剑夜鸣｜寒铁坞封山之夜，陆沉在废铁堆中摸到一柄尚有余温的断剑｜门外神兵阁执法队破门而入\n第2章：地火突围｜利用锻炉地火机关阻截追兵，首次唤醒断剑器魂脱困｜发现师父留下的血书指向王都千兵宴\n第3章：雪夜炉温｜在废弃猎人木屋包扎灼伤，清点师父遗物并解读器魂来历｜定下混入神兵阁采买船队的计划`
    );
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2
              id="upload-modal-title"
              className="text-lg font-bold text-stone-900 font-serif-editorial"
            >
              上传或粘贴中长篇小说设定与细纲
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              支持导入 .txt / .md / .json 文件，或直接粘贴您在 AI Studio 输入框中整理的设定与全书细纲
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭导入窗口"
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1" htmlFor="import-title">
                小说项目名称（选填，可自动识别）
              </label>
              <input
                id="import-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：《苍穹烬》《深空法则》"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1" htmlFor="import-genre">
                题材与风格标签
              </label>
              <input
                id="import-genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="例如：仙侠权谋 / 赛博悬疑"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200/80">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <FileText className="w-4 h-4 text-amber-800 shrink-0" />
              <span>可选择本地设定文档上传，或点击右侧填入标准示范文本体验解析</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 whitespace-nowrap">
                <span>选择本地文件 (.txt/.md/.json)</span>
                <input
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={fillSampleTemplate}
                className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 whitespace-nowrap"
              >
                填入示例设定文本
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1" htmlFor="import-raw-textarea">
              小说世界观设定集与章节细纲内容
            </label>
            <textarea
              id="import-raw-textarea"
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`在此粘贴您的小说设定与细纲，例如：\n主角：姓名、动机与核心代价...\n势力：核心阵营与矛盾...\n体系：力量序列与限制规则...\n第1章：章节标题｜核心情节点｜章末钩子...`}
              className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-500">
              导入后将自动构建设定集索引、五维诊断、细纲节奏表与剧情推演分支
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '正在深度拆解...' : '解析并构建可视化工作台'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ClearConfirmModalProps {
  isOpen: boolean;
  projectTitle: string;
  onClose: () => void;
  onConfirmClear: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  projectTitle,
  onClose,
  onConfirmClear,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
    >
      <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="clear-modal-title"
              className="text-base font-bold text-stone-900 font-serif-editorial"
            >
              确认一键清空当前小说内容？
            </h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              即将清空当前工作区中的《{projectTitle.replace(/[《》]/g, '')}》设定集条目、五维诊断报告、章节细纲矩阵及剧情推演记录，使工作台立即恢复为空白整洁状态，方便您无缝切换至全新的创作项目。
            </p>
          </div>
        </div>

        <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/70 text-xs text-stone-600">
          提示：预设示例项目仍保留在顶部「切换创作项目」下拉列表中，您可以随时切回或直接上传新小说设定。
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmClear();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>确认一键清空工作台</span>
          </button>
        </div>
      </div>
    </div>
  );
};
