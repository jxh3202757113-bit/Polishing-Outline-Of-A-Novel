import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Server-side Gemini endpoint: Analyze uploaded novel settings & generate optimization proposals + plot twists
  app.post('/api/novel/analyze', async (req, res) => {
    const { rawText, title, genre } = req.body || {};
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: '请提供有效的小说设定或细纲文本。' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(200).json({
        mode: 'local-engine',
        message: '已使用内置结构化设定解析引擎完成拆解。',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `请深入分析以下中长篇小说设定与细纲，提取关键设定条目、五维诊断评分、个性化优化方案以及剧情推演转折灵感。\n小说标题：${title || '未命名'}\n题材类型：${genre || '中长篇小说'}\n原文内容：\n${rawText.slice(0, 8000)}`,
        config: {
          systemInstruction:
            '你是一位资深中长篇网文主编与世界观架构师。请针对用户上传的设定进行结构化深度诊断，指出潜在逻辑漏洞或张力不足之处，并给出可落地的优化方案与后续剧情转折灵感。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              logline: { type: Type.STRING, description: '一句话核心故事钩子' },
              optimizations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    targetArea: { type: Type.STRING },
                    title: { type: Type.STRING },
                    problemAnalysis: { type: Type.STRING },
                    actionablePlan: { type: Type.STRING },
                    expectedPayoff: { type: Type.STRING },
                  },
                },
              },
              plotTwists: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stageLabel: { type: Type.STRING },
                    triggerCondition: { type: Type.STRING },
                    title: { type: Type.STRING },
                    twistMechanism: { type: Type.STRING },
                    consequencePreview: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        mode: 'gemini-ai',
        data: parsed,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI深度分析暂时不可用';
      res.status(200).json({
        mode: 'local-engine',
        warning: message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
