/**
 * Minimal project parsing utilities for the agoodbackend-style generation flow.
 */

export function parseFilesFromRaw(text) {
  if (!text || typeof text !== 'string') return [];

  const files = [];
  const fileRegex = /---FILE:(.*?)---\s*```(?:\w+)?\s*([\s\S]*?)(?:```|(?=---FILE:)|$)/g;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    files.push({
      path: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return files;
}

export function extractNextProject(text) {
  const files = parseFilesFromRaw(text);
  if (files.length === 0) return null;
  return { files: Object.fromEntries(files.map((file) => [file.path, file.content])) };
}

export function extractStreamingFile(text) {
  const files = parseFilesFromRaw(text);
  return files.length > 0 ? files[files.length - 1] : null;
}

export function getHtmlPages(project) {
  if (!project?.files || typeof project.files !== 'object') return [];
  return Object.keys(project.files).filter((path) => /\.html?$/i.test(path)).sort((a, b) => {
    if (a.toLowerCase() === 'index.html' || a.toLowerCase() === 'index.htm') return -1;
    if (b.toLowerCase() === 'index.html' || b.toLowerCase() === 'index.htm') return 1;
    return a.localeCompare(b);
  });
}

export function getHtmlPreviewContent(project, page = null) {
  if (!project?.files || typeof project.files !== 'object') return '';
  const htmlPages = getHtmlPages(project);
  const pageKey = page || htmlPages[0] || 'index.html';
  return typeof project.files[pageKey] === 'string' ? project.files[pageKey] : '';
}
