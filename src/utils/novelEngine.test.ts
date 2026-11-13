import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adoptOptimizationIntoLore,
  adoptTwistIntoOutline,
  autoRebalanceChapterPacing,
  clearNovelProject,
  parseUploadedNovelText,
  validatePacingRules,
} from './novelEngine';
import { ChapterOutline } from '../types/novel';

function makeChapter(
  chapterNumber: number,
  rhythmType: ChapterOutline['rhythmType'],
  openingMethod: string,
  endingMethod: string
): ChapterOutline {
  return {
    chapterNumber,
    title: `测试第${chapterNumber}章`,
    rhythmType,
    openingMethod,
    endingMethod,
    corePlotPoints: ['情节点A'],
    microPayoff: '微兑现A',
    sensoryAnchor: '听觉锚点',
    hookRequirement: '章末钩子',
    tensionScore: 70,
    targetWordCount: 2200,
    status: 'planned',
    handoverSummary: {
      protagonistKnowledge: '已知线索',
      emotionalState: '紧绷',
      nextChapterHook: '下一章钩子',
    },
  };
}

test('validatePacingRules detects adjacent identical rhythm types and 3-chapter opening repeats', () => {
  const chapters: ChapterOutline[] = [
    makeChapter(1, '高压', '动作切入', '悬念定格'),
    makeChapter(2, '高压', '对白交锋', '意外闯入'),
    makeChapter(3, '喘息', '动作切入', '情绪落点'),
  ];

  const report = validatePacingRules(chapters);
  assert.equal(report.isValid, false);
  assert.ok(report.violations.some((v) => v.ruleCode === 'ADJACENT_RHYTHM'));
  assert.ok(report.violations.some((v) => v.ruleCode === 'OPENING_REPEAT'));
});

test('autoRebalanceChapterPacing resolves rhythm and opening/ending collisions', () => {
  const flawed: ChapterOutline[] = [
    makeChapter(1, '高压', '同一种开场', '同一种结尾'),
    makeChapter(2, '高压', '同一种开场', '同一种结尾'),
    makeChapter(3, '高压', '同一种开场', '同一种结尾'),
    makeChapter(4, '高压', '同一种开场', '同一种结尾'),
    makeChapter(5, '高压', '同一种开场', '同一种结尾'),
  ];

  const rebalanced = autoRebalanceChapterPacing(flawed);
  const report = validatePacingRules(rebalanced);
  assert.equal(report.isValid, true);
  assert.equal(report.violations.length, 0);
  assert.ok(report.highPressureMaxStreak <= 2);
});

test('clearNovelProject wipes all novel lore, chapters, and diagnostics cleanly', () => {
  const imported = parseUploadedNovelText(
    '《星渊折剑录》\n主角：陆沉，背负古剑的守夜人。\n第1章：寒夜孤灯｜古剑异动｜发现密信'
  );
  assert.ok(imported.loreEntries.length > 0);
  assert.ok(imported.chapters.length > 0);

  const cleared = clearNovelProject(imported);
  assert.equal(cleared.loreEntries.length, 0);
  assert.equal(cleared.chapters.length, 0);
  assert.equal(cleared.optimizations.length, 0);
  assert.equal(cleared.plotBranches.length, 0);
});

test('adoptOptimizationIntoLore marks proposal adopted and adds co-created entry to lore DB', () => {
  const project = parseUploadedNovelText(
    '《烬海长歌》\n世界观：烬海之上的十二座浮空城邦。\n第1章：灰雪降临｜城邦断联'
  );
  const initialLoreCount = project.loreEntries.length;
  const firstOptId = project.optimizations[0].id;

  const updated = adoptOptimizationIntoLore(project, firstOptId);
  assert.equal(updated.optimizations[0].adopted, true);
  assert.equal(updated.loreEntries.length, initialLoreCount + 1);
  assert.equal(updated.loreEntries[0].source, 'co-created');
});

test('adoptTwistIntoOutline appends a new chapter outline from a plot twist branch', () => {
  const project = parseUploadedNovelText(
    '《北境残卷》\n第1章：雪原古驿｜驿站血迹'
  );
  const initialChapters = project.chapters.length;
  const branchId = project.plotBranches[0].id;

  const updated = adoptTwistIntoOutline(project, branchId);
  assert.equal(updated.chapters.length, initialChapters + 1);
  assert.equal(updated.plotBranches[0].adoptedChapter, initialChapters + 1);
});
