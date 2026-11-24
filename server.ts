import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

type LyriaModelId = 'lyria-3-clip-preview' | 'lyria-3-pro-preview';

function getServerGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
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
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'daily-tide-server' });
  });

  /**
   * Server-side Lyria 3 music generation route.
   * Supports:
   * - lyria-3-clip-preview (short clips up to 30s)
   * - lyria-3-pro-preview (full-length tracks)
   * Never exposes GEMINI_API_KEY to the browser; propagates upstream errors honestly.
   */
  app.post('/api/music/generate', async (req, res) => {
    try {
      const body = req.body as {
        prompt?: unknown;
        mode?: unknown;
      };

      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      if (!prompt || prompt.length < 4) {
        res.status(400).json({
          error: 'Please enter a short description of the calm music or soundscape you would like to generate.',
        });
        return;
      }

      if (prompt.length > 600) {
        res.status(400).json({
          error: 'Prompt is too long. Please keep music prompts under 600 characters.',
        });
        return;
      }

      const mode = body.mode === 'full' ? 'full' : 'clip';
      const model: LyriaModelId =
        mode === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      const ai = getServerGeminiClient();
      if (!ai) {
        res.status(403).json({
          error:
            'Lyria music generation requires a billing-enabled Gemini API key. You can configure one anytime in Settings > Secrets. All offline Daily Tide features remain 100% available.',
          code: 'API_KEY_MISSING',
        });
        return;
      }

      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
      });

      const audioChunks: Buffer[] = [];
      let lyrics = '';
      let mimeType = 'audio/mpeg';

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (audioChunks.length === 0 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
          }
          if (part.text) {
            lyrics += part.text;
          }
        }
      }

      if (audioChunks.length === 0) {
        res.status(502).json({
          error:
            'The Lyria model completed without returning audio data. Please try a slightly different musical description.',
          code: 'EMPTY_AUDIO',
        });
        return;
      }

      const audioBase64 = Buffer.concat(audioChunks).toString('base64');
      const audioDataUrl = `data:${mimeType};base64,${audioBase64}`;

      res.json({
        model,
        mode,
        mimeType,
        audioDataUrl,
        lyrics: lyrics.trim(),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error during music generation.';
      const lower = message.toLowerCase();

      if (
        lower.includes('permission_denied') ||
        lower.includes('api_key_invalid') ||
        lower.includes('403') ||
        lower.includes('billing')
      ) {
        res.status(403).json({
          error:
            'Lyria models require a billing-enabled Gemini API key. Please check your key in the Settings > Secrets panel.',
          code: 'PERMISSION_DENIED',
        });
        return;
      }

      if (lower.includes('resource_exhausted') || lower.includes('429')) {
        res.status(429).json({
          error:
            'Rate limit or quota reached for Lyria music generation. Please check your billing-enabled API key in Settings > Secrets or try again shortly.',
          code: 'RESOURCE_EXHAUSTED',
        });
        return;
      }

      res.status(500).json({
        error: `Music generation failed: ${message}`,
        code: 'GENERATION_FAILED',
      });
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daily Tide server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Daily Tide server:', err);
  process.exit(1);
});
