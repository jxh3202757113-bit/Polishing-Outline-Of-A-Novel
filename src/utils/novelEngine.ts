import {
  ChapterOutline,
  LoreCategory,
  LoreEntry,
  NovelProject,
  OptimizationProposal,
  PacingValidationReport,
  PacingViolation,
  PlotTwistBranch,
  RhythmType,
} from '../types/novel';

export const CATEGORY_META: Record<
  LoreCategory,
  { label: string; shortLabel: string; description: string; color: string }
> = {
  character: {
    label: '人物角色档案',
    shortLabel: '人物',
    description: '核心主角、对手、群像动机与状态弧光',
    color: '#B45309',
  },
  faction: {
    label: '势力与阵营',
    shortLabel: '势力',
    description: '帝国、宗门、隐秘结社与利益同盟网络',
    color: '#1D4ED8',
  },
  geography: {
    label: '地理与疆域',
    shortLabel: '地理',
    description: '大陆版图、城邦聚落、禁区遗迹与风物建筑',
    color: '#047857',
  },
  system: {
    label: '力量与法则体系',
    shortLabel: '法则',
    description: '修行序列、代价机制、底层规则与晋升铁律',
    color: '#7C3AED',
  },
  artifact: {
    label: '奇物与核心道具',
    shortLabel: '奇物',
    description: '承载伏笔的信物、禁忌兵器、古籍与资源',
    color: '#BE123C',
  },
  timeline: {
    label: '纪元大事记',
    shortLabel: '纪元',
    description: '历史断层、旧日浩劫与主线时间轴锚点',
    color: '#374151',
  },
};

/**
 * Validates chapter rhythm planning against the core web-novel pacing rules:
 * 1. 相邻章节奏类型不得相同
 * 2. 开场/结尾方式3章内不重复
 * 3. 连续高压不超过2章
 * 4. 每3–5章穿插一个喘息/兑现章
 */
export function validatePacingRules(chapters: ChapterOutline[]): PacingValidationReport {
  if (chapters.length === 0) {
    return {
      isValid: true,
      complianceRate: 100,
      violations: [],
      highPressureMaxStreak: 0,
      reliefChapterCount: 0,
    };
  }

  const sorted = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
  const violations: PacingViolation[] = [];

  let currentHighStreak = 0;
  let highPressureMaxStreak = 0;
  let reliefChapterCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];

    if (curr.rhythmType === '喘息' || curr.rhythmType === '兑现') {
      reliefChapterCount++;
    }

    if (curr.rhythmType === '高压') {
      currentHighStreak++;
      if (currentHighStreak > highPressureMaxStreak) {
        highPressureMaxStreak = currentHighStreak;
      }
      if (currentHighStreak > 2) {
        violations.push({
          chapterNumber: curr.chapterNumber,
          ruleCode: 'HIGH_PRESSURE_STREAK',
          message: `第${curr.chapterNumber}章触发连续高压超限（已连续${currentHighStreak}章高压，上限2章）`,
        });
      }
    } else {
      currentHighStreak = 0;
    }

    // Rule 1: Adjacent chapters cannot have the same rhythmType
    if (i > 0 && sorted[i - 1].rhythmType === curr.rhythmType) {
      violations.push({
        chapterNumber: curr.chapterNumber,
        ruleCode: 'ADJACENT_RHYTHM',
        message: `第${curr.chapterNumber}章与第${sorted[i - 1].chapterNumber}章节奏类型重复（均为「${curr.rhythmType}」）`,
      });
    }

    // Rule 2: Opening/ending methods cannot repeat within 3 chapters (compare with i-1 and i-2)
    for (let back = 1; back <= 2; back++) {
      if (i - back >= 0) {
        const prev = sorted[i - back];
        if (
          curr.openingMethod.trim() &&
          curr.openingMethod.trim() === prev.openingMethod.trim()
        ) {
          violations.push({
            chapterNumber: curr.chapterNumber,
            ruleCode: 'OPENING_REPEAT',
            message: `第${curr.chapterNumber}章与第${prev.chapterNumber}章在3章内重复使用开场方式「${curr.openingMethod}」`,
          });
        }
        if (
          curr.endingMethod.trim() &&
          curr.endingMethod.trim() === prev.endingMethod.trim()
        ) {
          violations.push({
            chapterNumber: curr.chapterNumber,
            ruleCode: 'ENDING_REPEAT',
            message: `第${curr.chapterNumber}章与第${prev.chapterNumber}章在3章内重复使用结尾方式「${curr.endingMethod}」`,
          });
        }
      }
    }

    // Rule 4: Every 5-chapter window must contain at least one 喘息 or 兑现 chapter
    if (i >= 4) {
      const windowSlice = sorted.slice(i - 4, i + 1);
      const hasRelief = windowSlice.some(
        (ch) => ch.rhythmType === '喘息' || ch.rhythmType === '兑现'
      );
      if (!hasRelief) {
        violations.push({
          chapterNumber: curr.chapterNumber,
          ruleCode: 'MISSING_RELIEF_WINDOW',
          message: `第${windowSlice[0].chapterNumber}–${curr.chapterNumber}章连续5章未穿插「喘息」或「兑现」章`,
        });
      }
    }
  }

  const totalChecks = Math.max(1, sorted.length * 4);
  const complianceRate = Math.max(
    0,
    Math.min(100, Math.round(((totalChecks - violations.length) / totalChecks) * 100))
  );

  return {
    isValid: violations.length === 0,
    complianceRate,
    violations,
    highPressureMaxStreak,
    reliefChapterCount,
  };
}

/**
 * Auto-optimizes chapter rhythm sequence so that adjacent rhythms don't collide,
 * opening/ending styles don't repeat within 3 chapters, and high-pressure streaks <= 2.
 */
export function autoRebalanceChapterPacing(chapters: ChapterOutline[]): ChapterOutline[] {
  const openingPool = [
    '动作切入·危机余波',
    '感官特写·器物异变',
    '对白交锋·潜台词试探',
    '环境反差·日常静景',
    '悬念现场·残迹推演',
  ];
  const endingPool = [
    '反问定格·身份揭晓',
    '器物异动·倒计时启动',
    '情绪落点·无钩余韵',
    '盟友背刺·局势逆转',
    '抉择落子·踏入禁区',
  ];
  const rhythmSequence: RhythmType[] = [
    '悬疑',
    '高压',
    '转折',
    '喘息',
    '高压',
    '兑现',
    '悬疑',
    '转折',
    '高压',
    '喘息',
  ];

  return chapters.map((ch, idx) => {
    const rhythmType = rhythmSequence[idx % rhythmSequence.length];
    const tensionMap: Record<RhythmType, number> = {
      高压: 88,
      转折: 76,
      悬疑: 68,
      兑现: 54,
      喘息: 36,
    };
    return {
      ...ch,
      rhythmType,
      openingMethod: openingPool[idx % openingPool.length],
      endingMethod: endingPool[idx % endingPool.length],
      tensionScore: tensionMap[rhythmType],
    };
  });
}

/**
 * Pure state transition: One-click clear current novel content to reset workspace cleanly.
 */
export function clearNovelProject(currentProject?: NovelProject): NovelProject {
  return {
    id: `empty-${Date.now()}`,
    title: '未命名长篇企划（空白工作台）',
    genre: '待导入题材',
    targetScale: '待定篇幅',
    logline: '当前小说内容已一键清空。请上传设定文档、粘贴AI Studio生成的细纲，或从预设模板快速开启新创作项目。',
    corePremise: '',
    lastSyncedPrompt: '',
    updatedAt: '刚刚清空',
    loreEntries: [],
    relations: [],
    diagnostics: [],
    optimizations: [],
    chapters: [],
    plotBranches: [],
    foreshadowings: [],
  };
}

/**
 * Pure state transition: Adopt an optimization proposal and archive it into the Lore Database.
 */
export function adoptOptimizationIntoLore(
  project: NovelProject,
  proposalId: string
): NovelProject {
  const target = project.optimizations.find((o) => o.id === proposalId);
  if (!target || target.adopted) {
    return project;
  }

  const updatedOptimizations = project.optimizations.map((o) =>
    o.id === proposalId ? { ...o, adopted: true } : o
  );

  const newLoreEntries = [...project.loreEntries];
  if (target.suggestedLoreEntry) {
    const newEntry: LoreEntry = {
      id: `lore-opt-${Date.now()}-${proposalId}`,
      category: target.suggestedLoreEntry.category,
      name: target.suggestedLoreEntry.name,
      subtitle: target.suggestedLoreEntry.subtitle,
      summary: target.suggestedLoreEntry.summary,
      attributes: target.suggestedLoreEntry.attributes,
      tags: target.suggestedLoreEntry.tags,
      source: 'co-created',
      updatedAt: '刚刚归档',
      graphPosition: {
        x: 180 + ((newLoreEntries.length * 130) % 520),
        y: 110 + ((newLoreEntries.length * 85) % 240),
      },
    };
    newLoreEntries.unshift(newEntry);
  }

  // Boost corresponding diagnostic dimension score slightly
  const updatedDiagnostics = project.diagnostics.map((d) => ({
    ...d,
    score: Math.min(98, d.score + 3),
  }));

  return {
    ...project,
    updatedAt: '刚刚更新设定库',
    optimizations: updatedOptimizations,
    loreEntries: newLoreEntries,
    diagnostics: updatedDiagnostics,
  };
}

/**
 * Pure state transition: Convert a Plot Twist Inspiration into a concrete Chapter Outline entry.
 */
export function adoptTwistIntoOutline(
  project: NovelProject,
  branchId: string
): NovelProject {
  const branch = project.plotBranches.find((b) => b.id === branchId);
  if (!branch || branch.adoptedChapter) {
    return project;
  }

  const nextChapterNum =
    project.chapters.length > 0
      ? Math.max(...project.chapters.map((c) => c.chapterNumber)) + 1
      : 1;

  const tensionMap: Record<RhythmType, number> = {
    高压: 90,
    转折: 80,
    悬疑: 70,
    兑现: 56,
    喘息: 38,
  };

  const newChapter: ChapterOutline = {
    chapterNumber: nextChapterNum,
    title: branch.title,
    rhythmType: branch.suggestedRhythm,
    openingMethod: branch.suggestedOpening,
    endingMethod: branch.suggestedEnding,
    corePlotPoints: [
      `触发条件：${branch.triggerCondition}`,
      `核心转折：${branch.twistMechanism}`,
      `局势后果：${branch.consequencePreview}`,
    ],
    microPayoff: `回收或推进线索「${branch.foreshadowingUsed}」`,
    sensoryAnchor: '金属冷冽触感与环境低频共鸣声',
    hookRequirement: branch.consequencePreview,
    tensionScore: tensionMap[branch.suggestedRhythm],
    targetWordCount: 2300,
    status: 'planned',
    handoverSummary: {
      protagonistKnowledge: `知晓了${branch.title}背后的直接推手，但尚未查明更高层布局。`,
      emotionalState: branch.suggestedRhythm === '喘息' ? '回落' : '紧绷',
      nextChapterHook: branch.consequencePreview,
    },
  };

  return {
    ...project,
    updatedAt: `已推演至第${nextChapterNum}章`,
    chapters: [...project.chapters, newChapter],
    plotBranches: project.plotBranches.map((b) =>
      b.id === branchId ? { ...b, adoptedChapter: nextChapterNum } : b
    ),
  };
}

/**
 * Parses uploaded or pasted raw text/markdown/JSON into a structured NovelProject.
 */
export function parseUploadedNovelText(
  rawText: string,
  customTitle?: string,
  customGenre?: string
): NovelProject {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('上传或输入的设定内容不能为空');
  }

  // Try JSON parse first if user uploaded an exported project JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.title && Array.isArray(parsed.loreEntries)) {
        return {
          ...parsed,
          id: parsed.id || `proj-${Date.now()}`,
          updatedAt: '刚刚通过JSON导入',
        };
      }
    } catch {
      // Fallback to text parser
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract title
  let detectedTitle = customTitle?.trim() || '';
  if (!detectedTitle) {
    const bookMatch = trimmed.match(/《([^》]+)》/);
    if (bookMatch) {
      detectedTitle = `《${bookMatch[1]}》`;
    } else {
      const firstHeader = lines[0]?.replace(/^#+\s*/, '').slice(0, 24);
      detectedTitle = firstHeader ? `《${firstHeader}》` : '《新导入长篇企划》';
    }
  } else if (!detectedTitle.startsWith('《')) {
    detectedTitle = `《${detectedTitle}》`;
  }

  const genre = customGenre?.trim() || '长篇幻想/悬疑群像';
  const loreEntries: LoreEntry[] = [];
  const chapters: ChapterOutline[] = [];

  const categoryKeywords: { cat: LoreCategory; regex: RegExp }[] = [
    { cat: 'character', regex: /主角|人物|角色|姓名|性格|反派|女主|男主|导师/ },
    { cat: 'faction', regex: /势力|阵营|宗门|帝国|组织|家族|教会|联邦|公会/ },
    { cat: 'system', regex: /体系|境界|法则|序列|魔法|修真|异能|规则|代价/ },
    { cat: 'geography', regex: /地理|大陆|城市|禁区|地图|王都|海域|遗迹/ },
    { cat: 'artifact', regex: /奇物|兵器|道具|信物|神器|古籍|核心物/ },
    { cat: 'timeline', regex: /历史|纪元|时间线|万年|浩劫|旧历/ },
  ];

  const openingPool = [
    '动作切入·危机逼近',
    '感官特写·旧物异变',
    '对白交锋·当面质询',
    '静景反差·雨夜休整',
    '悬念现场·线索拼图',
  ];
  const endingPool = [
    '悬念定格·真相一角',
    '意外闯入·局势失控',
    '决断落子·孤身入局',
    '情绪余韵·短暂安宁',
    '倒计时响·伏笔引爆',
  ];
  const rhythmPool: RhythmType[] = ['悬疑', '高压', '转折', '喘息', '高压', '兑现'];

  lines.forEach((line, index) => {
    // Check if line represents a chapter outline
    const chapterMatch = line.match(
      /^(?:第\s*(\d+|[一二三四五六七八九十百]+)\s*章|Chapter\s*(\d+))[：:\s-]*(.*)$/i
    );
    if (chapterMatch) {
      const chNum = chapters.length + 1;
      const rawRest = chapterMatch[3] || `章节推进节点 ${chNum}`;
      const parts = rawRest.split(/[｜|；;。]/).map((s) => s.trim()).filter(Boolean);
      const chTitle = parts[0]?.slice(0, 18) || `第${chNum}幕推进`;
      const rhythm = rhythmPool[(chNum - 1) % rhythmPool.length];
      const tensionMap: Record<RhythmType, number> = {
        高压: 88,
        转折: 78,
        悬疑: 66,
        兑现: 55,
        喘息: 36,
      };

      chapters.push({
        chapterNumber: chNum,
        title: chTitle,
        rhythmType: rhythm,
        openingMethod: openingPool[(chNum - 1) % openingPool.length],
        endingMethod: endingPool[(chNum - 1) % endingPool.length],
        corePlotPoints:
          parts.length > 1
            ? parts.slice(1)
            : [`围绕「${chTitle}」展开核心冲突与人物抉择`, '埋设后续章节的关键线索锚点'],
        microPayoff: `兑现前文关于「${chTitle}」的局部悬念`,
        sensoryAnchor: '冷风掠过耳畔的低鸣与器物冰凉触感',
        hookRequirement: parts[parts.length - 1] || `章末停在关键抉择与未知来客现身`,
        tensionScore: tensionMap[rhythm],
        targetWordCount: 2200,
        status: 'planned',
        handoverSummary: {
          protagonistKnowledge: `主角已掌握「${chTitle}」的表层线索，但幕后操盘者身份仍未浮出水面。`,
          emotionalState: rhythm === '喘息' ? '回落' : '紧绷',
          nextChapterHook: parts[parts.length - 1] || `必须在下一章正面回应突发的局势异变`,
        },
      });
      return;
    }

    // Otherwise check if line is a lore setting item
    if (line.length >= 6 && loreEntries.length < 18) {
      let matchedCat: LoreCategory = 'system';
      for (const item of categoryKeywords) {
        if (item.regex.test(line)) {
          matchedCat = item.cat;
          break;
        }
      }
      const cleanLine = line.replace(/^[-*•\d.、#]+\s*/, '');
      const colonParts = cleanLine.split(/[：:]/);
      const entryName =
        colonParts.length > 1 && colonParts[0].length <= 16
          ? colonParts[0].trim()
          : `${CATEGORY_META[matchedCat].shortLabel}设定 #${loreEntries.length + 1}`;
      const summary =
        colonParts.length > 1 ? colonParts.slice(1).join('：').trim() : cleanLine;

      if (summary.length >= 4) {
        loreEntries.push({
          id: `imported-lore-${index}`,
          category: matchedCat,
          name: entryName,
          subtitle: `${CATEGORY_META[matchedCat].label} · 上传解析`,
          summary,
          attributes: [
            { label: '来源状态', value: '设定文档导入' },
            { label: '关联权重', value: '核心主线要素' },
          ],
          tags: [CATEGORY_META[matchedCat].shortLabel, '上传设定'],
          source: 'uploaded',
          updatedAt: '刚刚导入',
          graphPosition: {
            x: 160 + ((loreEntries.length % 4) * 175),
            y: 95 + (Math.floor(loreEntries.length / 4) * 120),
          },
        });
      }
    }
  });

  // Ensure at least baseline entries and chapters exist if user pasted a short paragraph
  if (loreEntries.length === 0) {
    loreEntries.push({
      id: 'imported-lore-core',
      category: 'system',
      name: '核心世界观基底',
      subtitle: '主设定概要 · 自动归档',
      summary: trimmed.slice(0, 240),
      attributes: [
        { label: '录入方式', value: '文本解析' },
        { label: '完整度', value: '待深化扩展' },
      ],
      tags: ['核心设定', '世界观基底'],
      source: 'uploaded',
      updatedAt: '刚刚导入',
      graphPosition: { x: 380, y: 180 },
    });
  }

  if (chapters.length === 0) {
    chapters.push(
      {
        chapterNumber: 1,
        title: '破局：风起于微末',
        rhythmType: '悬疑',
        openingMethod: '感官特写·器物异变',
        endingMethod: '反问定格·身份揭晓',
        corePlotPoints: [
          `切入核心设定：${trimmed.slice(0, 48)}...`,
          '主角在日常秩序中撞见第一处违背常理的异象',
        ],
        microPayoff: '验证主角随身信物或特殊能力的初步反馈',
        sensoryAnchor: '潮湿空气中的铁锈味与指尖微麻触感',
        hookRequirement: '异象背后指向早已被抹除的禁忌名讳',
        tensionScore: 68,
        targetWordCount: 2200,
        status: 'planned',
        handoverSummary: {
          protagonistKnowledge: '主角意识到眼前的危机并非偶然，但尚不知晓幕后势力的真实全貌。',
          emotionalState: '悬置',
          nextChapterHook: '门外传来不属于活人的叩击声，迫使主角立即做出抉择。',
        },
      },
      {
        chapterNumber: 2,
        title: '交锋：暗流下的试探',
        rhythmType: '高压',
        openingMethod: '动作切入·危机余波',
        endingMethod: '器物异动·倒计时启动',
        corePlotPoints: [
          '承接第1章末尾异动，主角在受限空间内与追踪者展开首次周旋',
          '通过短促交手暴露力量体系的代价约束',
        ],
        microPayoff: '首次动用核心能力脱困，兑现能力设定的实战表现',
        sensoryAnchor: '急促呼吸声与寒刃擦过石壁的高频刮擦声',
        hookRequirement: '脱困之际发现真正的封锁线刚刚合拢',
        tensionScore: 86,
        targetWordCount: 2350,
        status: 'planned',
        handoverSummary: {
          protagonistKnowledge: '摸清了追兵的底层路数，但发现对方真正的目标是自己携带的旧物。',
          emotionalState: '紧绷',
          nextChapterHook: '旧物表面浮现倒计时裂纹，必须在天亮前抵达安全屋。',
        },
      },
      {
        chapterNumber: 3,
        title: '余波：微光与代价',
        rhythmType: '喘息',
        openingMethod: '环境反差·日常静景',
        endingMethod: '情绪落点·无钩余韵',
        corePlotPoints: [
          '高压脱险后的休整，清点战利品与身体承受的反噬代价',
          '与关键盟友或信息源接触，拼凑世界观隐秘版图',
        ],
        microPayoff: '解开第1章遗留的器物铭文含义，获得阶段性情报奖励',
        sensoryAnchor: '篝火噼啪作响与苦涩药汤入喉的温热感',
        hookRequirement: '低压过场章以人物内心定下远行决意收束',
        tensionScore: 38,
        targetWordCount: 2100,
        status: 'planned',
        handoverSummary: {
          protagonistKnowledge: '明确了下一阶段必须前往的核心地图节点，但尚不知晓盟友隐藏的私心。',
          emotionalState: '回落',
          nextChapterHook: '次日清晨启程进入核心势力交界地。',
        },
      }
    );
  }

  // Build relations between first few lore entries
  const relations =
    loreEntries.length >= 2
      ? loreEntries.slice(1, 5).map((entry, idx) => ({
          id: `rel-imp-${idx}`,
          sourceId: loreEntries[0].id,
          targetId: entry.id,
          label: idx % 2 === 0 ? '核心牵制 / 因果绑定' : '秩序冲突 / 线索指向',
          tension: (idx % 2 === 0 ? 'mystery' : 'rival') as 'mystery' | 'rival',
        }))
      : [];

  return {
    id: `proj-imported-${Date.now()}`,
    title: detectedTitle,
    genre,
    targetScale: '120万字 · 多卷长篇架构',
    logline: trimmed.slice(0, 140) + (trimmed.length > 140 ? '...' : ''),
    corePremise: trimmed,
    lastSyncedPrompt: `已导入《${detectedTitle.replace(/[《》]/g, '')}》设定文本（共解析 ${loreEntries.length} 项设定条目、${chapters.length} 章细纲）。`,
    updatedAt: '刚刚上传解析',
    loreEntries,
    relations,
    diagnostics: [
      {
        id: 'diag-1',
        label: '核心冲突张力',
        score: 84,
        benchmark: '长篇黄金线 ≥ 80',
        diagnosis: '开篇切入具备明确生存或认知危机，主线驱动力清晰，建议在中段强化派系间的利益死结。',
      },
      {
        id: 'diag-2',
        label: '世界观自洽度',
        score: 78,
        benchmark: '长篇黄金线 ≥ 82',
        diagnosis: '核心设定框架已建立，但力量/规则体系的资源产出与底层平民生态尚有补全空间。',
      },
      {
        id: 'diag-3',
        label: '人物弧光立体度',
        score: 81,
        benchmark: '长篇黄金线 ≥ 80',
        diagnosis: '主角外在目标明确，建议补充一处“内在认知缺陷”以支撑中后期的信仰蜕变。',
      },
      {
        id: 'diag-4',
        label: '伏笔与微兑现密度',
        score: 76,
        benchmark: '长篇黄金线 ≥ 78',
        diagnosis: '大伏笔悬念充足，需注意每3章设置一处可感知的阶段性小兑现，避免读者审美疲劳。',
      },
      {
        id: 'diag-5',
        label: '长线连载延展性',
        score: 86,
        benchmark: '长篇黄金线 ≥ 80',
        diagnosis: '地图版图与势力层级具备良好的换地图扩写潜力，适合多卷递进式展开。',
      },
    ],
    optimizations: [
      {
        id: 'opt-imp-1',
        targetArea: '力量体系',
        severity: 'high',
        title: '补全「能力代价与不可逆反噬」闭环规则',
        problemAnalysis:
          '当前上传设定中展示了核心机制的上限威力，但若缺乏明确的代价硬约束，中后期容易陷入战力膨胀与危机感钝化。',
        actionablePlan:
          '在法则体系中引入「认知侵蚀 / 器物磨损阈值」：每次越阶动用核心能力，必须付出具体的感官或记忆代价，并成为特定章节的转折导火索。',
        expectedPayoff: '让每一场高压战斗都伴随筹码博弈，显著拉升第15–40章的悬疑紧迫感。',
        suggestedLoreEntry: {
          category: 'system',
          name: '越阶反噬律·感官剥离',
          subtitle: '力量体系硬约束 · 诊断优化生成',
          summary:
            '任何超负荷引动核心法则者，将在十二时辰内随机丧失一项次级感官（如色觉、痛觉或特定记忆锚点），唯有通过特定奇物方可逆转。',
          attributes: [
            { label: '触发阈值', value: '连续两次高压越阶出手' },
            { label: '叙事功能', value: '限制战力膨胀、制造战后喘息章戏剧张力' },
          ],
          tags: ['代价机制', '防崩盘规则', '共创成果'],
        },
        adopted: false,
      },
      {
        id: 'opt-imp-2',
        targetArea: '人物弧光',
        severity: 'medium',
        title: '增设「镜像对照组角色」强化主线抉择',
        problemAnalysis:
          '主角前期独行推进效率高，但缺少一个出身相似却选择截然不同道路的同辈镜像人物来映衬核心主题。',
        actionablePlan:
          '在核心敌对或中立势力中锚定一名“理念竞争者”，在第一卷中段与主角形成亦敌亦友的短暂合作与理念背离。',
        expectedPayoff: '丰富群像对白潜台词，为卷末高潮提供双重情感冲击。',
        suggestedLoreEntry: {
          category: 'character',
          name: '沈知微（镜像宿敌）',
          subtitle: '旧秩序守夜人 · 理念对照组',
          summary:
            '与主角同源出身却主动投身旧秩序中枢的年轻执律官，坚信“唯有绝对掌控方能止息浩劫”，行事克制冷峻。',
          attributes: [
            { label: '定位', value: '镜像对照组 / 灰域对手' },
            { label: '标志细节', value: '永远佩戴一副隔绝气息的白铜指套' },
          ],
          tags: ['镜像角色', '群像张力', '共创成果'],
        },
        adopted: false,
      },
    ],
    chapters,
    plotBranches: [
      {
        id: 'branch-imp-1',
        stageLabel: '近期推进（接续当前细纲末章）',
        triggerCondition: '当主角试图按原计划验证手中核心线索时',
        title: '盟友提供的安全路径实为「筛选诱饵」',
        twistMechanism:
          '原本以为的庇护所早已在三天前易主，引路人并非背叛，而是被种下了认知暗示而不自知。',
        involvedEntities: loreEntries.slice(0, 2).map((e) => e.name),
        foreshadowingUsed: '引路人反复摩挲怀表的异常动作细节',
        consequencePreview: '主角将计就计反锁密室，反客为主逼出幕后观察者的第一道分身。',
        suggestedRhythm: '转折',
        suggestedOpening: '对白交锋·潜台词试探',
        suggestedEnding: '盟友背刺·局势逆转',
      },
      {
        id: 'branch-imp-2',
        stageLabel: '中段高潮（卷中破局转折）',
        triggerCondition: '两大势力围绕核心奇物展开正面争夺时',
        title: '奇物真正的载体并非器物，而是「活人契约」',
        twistMechanism:
          '各方争夺的实体匣子只是空壳，真正的法则密钥早在开篇时便已烙印在主角与宿敌的血脉共鸣之中。',
        involvedEntities: loreEntries.slice(0, 3).map((e) => e.name),
        foreshadowingUsed: '开篇器物异变时主角耳畔出现的低鸣声',
        consequencePreview: '昔日死敌被迫在限时秘境中结成脆弱同盟，共同对抗高位猎杀者。',
        suggestedRhythm: '高压',
        suggestedOpening: '感官特写·器物异变',
        suggestedEnding: '抉择落子·踏入禁区',
      },
    ],
    foreshadowings: [
      {
        id: 'fs-imp-1',
        code: 'FS-01',
        title: '开篇异象中的残缺铭文',
        plantedChapter: '第1章',
        expectedPayoffChapter: '第3章（微兑现）/ 第12章（完全揭晓）',
        clueDetail: '器物内侧刻有被人为刮去的半枚纪元徽记',
        status: 'planted',
      },
    ],
  };
}
