<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
});

// Simple markdown parser that handles common patterns
const renderedContent = computed(() => {
  if (!props.content) return '';
  
  let text = props.content;
  
  // Process code blocks first (before escaping)
  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return id;
  });

  // Process images ![alt](url) or ![alt](url "title") before escaping
  const imageBlocks = [];
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, alt, url) => {
    const id = `__IMAGE_BLOCK_${imageBlocks.length}__`;
    const safe = safeImageUrl(url);
    const img = safe
      ? `<img src="${escapeHtml(safe)}" alt="${escapeHtml(alt)}" loading="lazy" class="markdown-image" />`
      : '';
    imageBlocks.push(img);
    return id;
  });

  // Process blockquotes (multiline > ...) before escaping - store raw content, restore after bold/italic
  const blockquoteBlocks = [];
  text = text.replace(/((?:^>\s?.+$\n?)+)/gm, (match) => {
    const id = `__BLOCKQUOTE_${blockquoteBlocks.length}__`;
    const rawContent = match.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n').trim();
    blockquoteBlocks.push(rawContent);
    return id;
  });

  // Escape HTML to prevent XSS (but preserve placeholders)
  text = escapeHtml(text);

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    text = text.replace(`__CODE_BLOCK_${index}__`, block);
  });

  // Restore images
  imageBlocks.forEach((block, index) => {
    text = text.replace(`__IMAGE_BLOCK_${index}__`, block);
  });
  
  // Process inline code (after code blocks but before other formatting)
  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (match, code) => {
    const id = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${code}</code>`);
    return id;
  });
  
  // Restore inline codes
  inlineCodes.forEach((code, index) => {
    text = text.replace(`__INLINE_CODE_${index}__`, code);
  });
  
  // Bold (**text** or __text__) - but not inside code
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_) - but not inside code
  text = text.replace(/(?<!<code[^>]*>)(?<!<\/code>)\*([^*]+)\*(?!<\/code>)/g, '<em>$1</em>');
  text = text.replace(/(?<!<code[^>]*>)(?<!<\/code>)_([^_]+)_(?!<\/code>)/g, '<em>$1</em>');

  // Restore blockquotes (content escaped and formatted with bold/italic)
  blockquoteBlocks.forEach((rawContent, index) => {
    let content = escapeHtml(rawContent);
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
    content = content.replace(/(?<!<code[^>]*>)(?<!<\/code>)\*([^*]+)\*(?!<\/code>)/g, '<em>$1</em>').replace(/(?<!<code[^>]*>)(?<!<\/code>)_([^_]+)_(?!<\/code>)/g, '<em>$1</em>');
    content = content.replace(/\n/g, '<br>');
    text = text.replace(`__BLOCKQUOTE_${index}__`, `<blockquote>${content}</blockquote>`);
  });
  
  // Process lists line by line
  const lines = text.split('\n');
  const processedLines = [];
  let inUnorderedList = false;
  let inOrderedList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    
    if (unorderedMatch) {
      if (!inUnorderedList) {
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
        processedLines.push('<ul>');
        inUnorderedList = true;
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`);
    } else if (orderedMatch) {
      if (!inOrderedList) {
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
        processedLines.push('<ol>');
        inOrderedList = true;
      }
      processedLines.push(`<li>${orderedMatch[1]}</li>`);
    } else {
      // Close lists if open
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close any open lists
  if (inUnorderedList) processedLines.push('</ul>');
  if (inOrderedList) processedLines.push('</ol>');
  
  text = processedLines.join('\n');
  
  // Headers (# Header)
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  
  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert double newlines to paragraph breaks, single newlines to <br>
  const paragraphs = text.split(/\n\n+/);
  text = paragraphs.map(para => {
    para = para.trim();
    if (!para) return '';
    
    // Don't wrap if it's already a block element
    if (para.startsWith('<ul>') || para.startsWith('<ol>') ||
        para.startsWith('<h1>') || para.startsWith('<h2>') || para.startsWith('<h3>') ||
        para.startsWith('<pre>') || para.startsWith('<img') || para.startsWith('<blockquote>')) {
      return para.replace(/\n/g, '<br>');
    }
    
    // Wrap in paragraph and convert single newlines to <br>
    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
  }).filter(p => p).join('');
  
  return text;
});

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Only allow http, https, or relative URLs for images (prevents javascript:/data: XSS)
function safeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (/^https?:\/\//i.test(t) || t.startsWith('/') || t.startsWith('./') || t.startsWith('../')) return t;
  return '';
}
</script>

<style scoped>
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.dark .markdown-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}

.markdown-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.dark .markdown-content :deep(pre) {
  background-color: rgba(255, 255, 255, 0.05);
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin: 0.25rem 0;
}

.markdown-content :deep(p) {
  margin: 0.5rem 0;
}

.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem 0;
}

.markdown-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem 0;
}

.markdown-content :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.5rem 0 0.25rem 0;
}

.markdown-content :deep(a) {
  color: rgb(13, 148, 136);
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: rgb(15, 118, 110);
}

.markdown-content :deep(img.markdown-image) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: block;
}

.markdown-content :deep(p img.markdown-image) {
  margin: 1rem 0;
}

.markdown-content :deep(blockquote) {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 3px solid rgba(0, 0, 0, 0.2);
  color: inherit;
}

.dark .markdown-content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.3);
}
</style>
