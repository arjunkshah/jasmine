import { SYSTEM_PROMPT, EDIT_SYSTEM_PROMPT, enhanceUserPrompt } from './systemPrompt';

function buildContextBlock(files) {
  if (!files?.length) return '';
  const blocks = files.map((f) => `---FILE:${f.name}---\n${typeof f.content === 'string' ? f.content : ''}`).join('\n\n');
  return `\n\nADDITIONAL CONTEXT (user-uploaded files — use for reference):\n\n${blocks}\n\n`;
}

export async function generateWithGroq(apiKey, prompt, onChunk, contextFiles = []) {
  const contextBlock = buildContextBlock(contextFiles);
  const userContent = enhanceUserPrompt(prompt) + contextBlock;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  return streamResponse(response, onChunk);
}

export async function editWithGroq(apiKey, currentCode, userMessage, onChunk, contextFiles = []) {
  const contextBlock = buildContextBlock(contextFiles);
  const prompt = `EDIT REQUEST: ${userMessage}\n\nCURRENT PROJECT (only modify what's needed):\n${currentCode.slice(0, 12000)}${contextBlock}\n\nMake minimal targeted edits. Output ONLY the files you changed in ---FILE:path--- format.`;
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        { role: 'system', content: EDIT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 16384,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }
  return streamResponse(response, onChunk);
}

export async function editWithGemini(apiKey, currentCode, userMessage, onChunk, contextFiles = []) {
  const contextBlock = buildContextBlock(contextFiles);
  const prompt = `EDIT REQUEST: ${userMessage}\n\nCURRENT PROJECT (only modify what's needed):\n${currentCode.slice(0, 12000)}${contextBlock}\n\nMake minimal targeted edits. Output ONLY the files you changed in ---FILE:path--- format.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: EDIT_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 16384 },
      }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }
  return streamGeminiResponse(response, onChunk);
}

export async function generateWithGemini(apiKey, prompt, onChunk, contextFiles = []) {
  const contextBlock = buildContextBlock(contextFiles);
  const userContent = enhanceUserPrompt(prompt) + contextBlock;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 32000,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  return streamGeminiResponse(response, onChunk);
}

async function streamResponse(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;

      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          full += content;
          onChunk(full);
        }
      } catch {}
    }
  }

  return full;
}

async function streamGeminiResponse(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const parts = json.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.text) {
              full += part.text;
              onChunk(full);
            }
          }
        }
      } catch {}
    }
  }

  return full;
}

export function extractHTML(text) {
  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (htmlMatch) return htmlMatch[0];

  const codeBlockMatch = text.match(/```(?:html)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) return codeBlockMatch[1];

  if (text.includes('<html') && text.includes('</html>')) {
    const start = text.indexOf('<');
    const end = text.lastIndexOf('>') + 1;
    return text.slice(start, end);
  }

  return text;
}

/** Parse multi-file output (---FILE:path---). Returns { files: { path: content } } or null. */
export function extractNextProject(text) {
  const files = {};
  const regex = /---FILE:([^\n-]+)---\s*```(?:\w+)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    if (path && content) files[path] = content;
  }
  if (Object.keys(files).length > 0) return { files };
  return null;
}

/** Convert project files to ---FILE:path--- format for edit API. */
export function projectToRaw(project) {
  if (!project?.files || typeof project.files !== 'object') return '';
  return Object.entries(project.files)
    .map(([path, content]) => `---FILE:${path}---\n\`\`\`\n${typeof content === 'string' ? content : String(content)}\n\`\`\``)
    .join('\n\n');
}

const IMAGE_PLACEHOLDER_REGEX = /\{\{IMAGE:([^}]+)\}\}/g;

/**
 * Replace {{IMAGE:prompt}} placeholders with AI-generated images.
 * ALWAYS uses Gemini API for images (even when text is from Kimi/Groq).
 * Pass geminiApiKey when available (VITE_GEMINI_API_KEY) so images work with Kimi.
 */
export async function replaceImagePlaceholders(text, apiBase = '', geminiApiKey = '') {
  if (!text || typeof text !== 'string') return text;
  const matches = [...text.matchAll(IMAGE_PLACEHOLDER_REGEX)];
  if (matches.length === 0) return text;

  let result = text;
  const seen = new Set();
  const key = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  for (const match of matches) {
    const full = match[0];
    const prompt = match[1].trim();
    if (seen.has(full)) continue;
    seen.add(full);

    try {
      const body = { prompt };
      if (key) body.apiKey = key;
      const res = await fetch(`${apiBase}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.image) {
        result = result.split(full).join(data.image);
      } else {
        result = result.split(full).join(`https://placehold.co/800x600?text=${encodeURIComponent(prompt.slice(0, 30))}`);
      }
    } catch (e) {
      console.warn('[Jasmine] image gen failed:', prompt?.slice(0, 50), e?.message);
      result = result.split(full).join(`https://placehold.co/800x600?text=${encodeURIComponent(prompt.slice(0, 30))}`);
    }
  }
  return result;
}

