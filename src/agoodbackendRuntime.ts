import { GoogleGenAI } from "@google/genai";
import { JASMINE_SYSTEM_PROMPT } from "./systemPrompt.js";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface AttachedImage {
  url?: string;
  mimeType: string;
  data: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  images?: AttachedImage[];
}

export const MODELS = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
  { id: 'gemini-3.1-flash-preview', name: 'Gemini 3.1 Flash' },
  { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
];

export const parseFiles = (text: string): GeneratedFile[] => {
  const fileRegex = /---FILE:(.*?)---\s*```(?:\w+)?\s*([\s\S]*?)(?:```|(?=---FILE:)|$)/g;
  const parsedFiles: GeneratedFile[] = [];
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    parsedFiles.push({
      path: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return parsedFiles;
};

export const scrapeUrls = async (
  text: string,
  setScrapingStatus: (value: string | null) => void,
  setScrapingError: (value: string | null) => void,
): Promise<{text: string, images: {mimeType: string, data: string}[]}> => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  let urls: string[] = Array.from(text.match(urlRegex) || []);
  if (urls.length === 0) return { text, images: [] };

  urls = urls.map(url => url.replace(/[.,;!?)]$/, ''));

  const fileExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json', '.md', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.txt', '.csv', '.zip', '.pdf'];
  const errorDocDomains = [
    'babeljs.io', 'reactjs.org', 'react.dev', 'fb.me', 'rollupjs.org',
    'ai.google.dev', 'ai.dev', 'firebase.google.com', 'developer.mozilla.org',
    'stackoverflow.com', 'github.com', 'vitejs.dev', 'nextjs.org'
  ];
  const isErrorLog = /Uncaught |Error:|Exception|Traceback|at <anonymous>|at \w+ \(|{"error":/i.test(text);

  urls = urls.filter(url => {
    const lowerUrl = url.toLowerCase();
    if (fileExtensions.some(ext => lowerUrl.endsWith(ext))) return false;

    try {
      const urlObj = new URL(lowerUrl.startsWith('http') ? lowerUrl : `https://${lowerUrl}`);
      if (isErrorLog && errorDocDomains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }
    } catch (e) {}

    return true;
  });

  urls = [...new Set(urls)];
  if (urls.length === 0) return { text, images: [] };

  const apiKey = (import.meta as any).env.VITE_FIRECRAWL_API_KEY;
  if (!apiKey) {
    setScrapingError("VITE_FIRECRAWL_API_KEY is missing. Add it to your environment variables to enable scraping.");
    return { text, images: [] };
  }

  let enrichedText = text;
  const scrapedImages: {mimeType: string, data: string}[] = [];

  for (let url of urls) {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      setScrapingStatus(`Scraping ${url}...`);
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ url, formats: ['markdown', 'html', 'screenshot'] })
      });
      if (response.ok) {
        const data = await response.json();
        const markdown = data.data?.markdown || data.data?.content;
        const html = data.data?.html;
        const screenshotUrl = data.data?.screenshot;

        if (markdown) {
          enrichedText += `\n\n--- Scraped Content (Markdown) from ${url} ---\n${markdown}\n--- End Scraped Content ---\n`;
        }

        if (html) {
          enrichedText += `\n\n--- Scraped HTML from ${url} (Use this for exact DOM/structural cloning) ---\n${html.substring(0, 150000)}\n--- End Scraped HTML ---\n`;
        }

        if (screenshotUrl) {
          try {
            const imgRes = await fetch(screenshotUrl);
            const blob = await imgRes.blob();
            const base64data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            scrapedImages.push({ mimeType: blob.type, data: base64data });
            enrichedText += `\n(A screenshot of ${url} has been attached to this prompt for visual reference. Use it to replicate the style, layout, and colors.)\n`;
          } catch (imgErr) {
            console.error("Failed to fetch screenshot:", imgErr);
          }
        }

        if (!markdown && !screenshotUrl) {
          setScrapingError(`Scraping succeeded for ${url}, but no content or screenshot was returned.`);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setScrapingError(`Scraping failed for ${url}: ${errData.error || response.statusText}`);
      }
    } catch (e: any) {
      setScrapingError(`Failed to scrape ${url}: ${e.message}`);
    }
  }
  setScrapingStatus(null);
  return { text: enrichedText, images: scrapedImages };
};

export async function runAgoodbackendTurn({
  prompt,
  messages,
  files,
  selectedModel,
  attachedImages,
  setStreamingText,
  onFiles,
  setScrapingStatus,
  setScrapingError,
}: {
  prompt: string;
  messages: Message[];
  files: GeneratedFile[];
  selectedModel: string;
  attachedImages: AttachedImage[];
  setStreamingText: (text: string) => void;
  onFiles: (files: GeneratedFile[]) => void;
  setScrapingStatus: (value: string | null) => void;
  setScrapingError: (value: string | null) => void;
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [
      { text: m.content },
      ...(m.images || []).map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }))
    ]
  }));

  const scrapeResult = await scrapeUrls(prompt, setScrapingStatus, setScrapingError);

  const currentParts: any[] = [
    { text: scrapeResult.text },
    ...attachedImages.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
    ...scrapeResult.images.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } }))
  ];

  let fullText = '';
  let currentMergedFiles = [...files];

  if (selectedModel === 'gemini-2.5-flash-image') {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: currentParts,
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (imageUrl) {
      const imageHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Generated Image</title>
  <style>
    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
    img { max-width: 100%; max-height: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; }
  </style>
</head>
<body>
  <img src="${imageUrl}" alt="Generated Image" />
</body>
</html>`;

      const htmlFile = { path: 'index.html', content: imageHtml };
      const idx = currentMergedFiles.findIndex(f => f.path === 'index.html');
      if (idx !== -1) currentMergedFiles[idx] = htmlFile;
      else currentMergedFiles.push(htmlFile);

      onFiles([...currentMergedFiles]);
      fullText = "Image generated successfully.";
      setStreamingText(fullText);
    } else {
      throw new Error("No image was returned by the model.");
    }
  } else {
    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: [
        ...history,
        { role: 'user', parts: currentParts }
      ],
      config: {
        systemInstruction: JASMINE_SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        setStreamingText(fullText);

        const currentFiles = parseFiles(fullText);
        if (currentFiles.length > 0) {
          currentFiles.forEach(cf => {
            const idx = currentMergedFiles.findIndex(f => f.path === cf.path);
            if (idx !== -1) {
              currentMergedFiles[idx] = cf;
            } else {
              currentMergedFiles.push(cf);
            }
          });

          onFiles([...currentMergedFiles]);
        }
      }
    }
  }

  const finalFiles = parseFiles(fullText);
  if (finalFiles.length > 0) {
    finalFiles.forEach(cf => {
      const idx = currentMergedFiles.findIndex(f => f.path === cf.path);
      if (idx !== -1) {
        currentMergedFiles[idx] = cf;
      } else {
        currentMergedFiles.push(cf);
      }
    });
    onFiles([...currentMergedFiles]);
  } else if (fullText.includes('<!DOCTYPE html>')) {
    const htmlFile = { path: 'index.html', content: fullText };
    const idx = currentMergedFiles.findIndex(f => f.path === 'index.html');
    if (idx !== -1) currentMergedFiles[idx] = htmlFile;
    else currentMergedFiles.push(htmlFile);
    onFiles([...currentMergedFiles]);
  }

  return {
    fullText,
    files: currentMergedFiles,
    messages: [...messages, { role: 'assistant' as const, content: fullText }],
  };
}
