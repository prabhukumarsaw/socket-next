/**
 * Convert Lexical JSON state to SEO-friendly HTML
 * This utility converts Lexical editor state to HTML for public display
 * Optimized for fast image loading while preserving format and style
 * Uses local media storage system
 */

import type { SerializedEditorState } from "lexical";

/**
 * Check if URL is a local storage URL
 */
function isLocalStorageUrl(url: string): boolean {
  return url.startsWith("/storage/") || url.startsWith("./storage/");
}

/**
 * Normalize local storage URL to ensure it starts with /
 */
function normalizeLocalStorageUrl(url: string): string {
  if (url.startsWith("./storage/")) {
    return url.replace("./storage/", "/storage/");
  }
  if (!url.startsWith("/") && url.startsWith("storage/")) {
    return `/${url}`;
  }
  return url;
}

interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number;
  style?: string;
  [key: string]: any;
}

/**
 * Convert Lexical JSON to HTML string
 */
export function lexicalToHTML(lexicalState: SerializedEditorState | string): string {
  try {
    // Parse if string
    const state = typeof lexicalState === "string" ? JSON.parse(lexicalState) : lexicalState;
    
    if (!state || !state.root || !state.root.children) {
      return "";
    }

    const htmlParts: string[] = [];
    
    // Process each child node
    state.root.children.forEach((node: LexicalNode) => {
      htmlParts.push(processNode(node));
    });

    return htmlParts.join("");
  } catch (error) {
    console.error("Error converting Lexical to HTML:", error);
    return "";
  }
}

/**
 * Process a single Lexical node and convert to HTML
 */
function processNode(node: LexicalNode): string {
  if (!node) return "";

  const { type, children, text, format, style, ...attributes } = node;

  switch (type) {
    case "text":
      return formatText(text || "", format || 0, style);

    case "paragraph":
      const pContent = children ? children.map(processNode).join("") : "";
      return `<p>${pContent}</p>`;

    case "heading":
      const level = attributes.tag || "h1";
      const hContent = children ? children.map(processNode).join("") : "";
      return `<${level}>${hContent}</${level}>`;

    case "quote":
      const quoteContent = children ? children.map(processNode).join("") : "";
      return `<blockquote>${quoteContent}</blockquote>`;

    case "list":
      const listType = attributes.listType === "number" ? "ol" : "ul";
      const listContent = children
        ? children.map((child) => `<li>${processNode(child)}</li>`).join("")
        : "";
      return `<${listType}>${listContent}</${listType}>`;

    case "listitem":
      const itemContent = children ? children.map(processNode).join("") : "";
      return itemContent;

    case "link":
      const linkContent = children ? children.map(processNode).join("") : "";
      const url = attributes.url || "#";
      const target = attributes.target || "_self";
      return `<a href="${escapeHtml(url)}" target="${target}">${linkContent}</a>`;

    case "image":
      const src = attributes.src || "";
      const alt = attributes.altText || "";
      const imgWidth = attributes.width;
      const imgHeight = attributes.height;
      const maxWidth = attributes.maxWidth || 1200;
      
      // Normalize local storage URLs
      const normalizedSrc = isLocalStorageUrl(src) ? normalizeLocalStorageUrl(src) : src;

      // Build image attributes
      const imgAttributes: string[] = [];
      
      // Add src
      imgAttributes.push(`src="${escapeHtml(normalizedSrc)}"`);
      
      // Add alt
      imgAttributes.push(`alt="${escapeHtml(alt)}"`);
      
      // Add width and height for layout stability (prevent CLS)
      if (typeof imgWidth === "number") {
        imgAttributes.push(`width="${imgWidth}"`);
      }
      if (typeof imgHeight === "number") {
        imgAttributes.push(`height="${imgHeight}"`);
      }
      
      // Add lazy loading for better performance
      imgAttributes.push(`loading="lazy"`);
      
      // Add decoding for better performance
      imgAttributes.push(`decoding="async"`);
      
      // Preserve styling from Lexical (maxWidth, width, height)
      const styleParts: string[] = [];
      if (typeof imgWidth === "number") {
        styleParts.push(`max-width: ${imgWidth}px`);
        styleParts.push(`width: ${imgWidth}px`);
      } else if (maxWidth) {
        styleParts.push(`max-width: ${maxWidth}px`);
      }
      if (typeof imgHeight === "number") {
        styleParts.push(`height: ${imgHeight}px`);
      }
      if (styleParts.length > 0) {
        imgAttributes.push(`style="${escapeHtml(styleParts.join("; "))}"`);
      }
      
      // Add class for styling consistency
      imgAttributes.push(`class="lexical-image"`);
      
      return `<img ${imgAttributes.join(" ")} />`;

    case "linebreak":
      return "<br />";

    case "code":
      const codeContent = children ? children.map(processNode).join("") : text || "";
      return `<code>${escapeHtml(codeContent)}</code>`;

    case "codehighlight":
      const codeHighlightContent = children ? children.map(processNode).join("") : text || "";
      const language = attributes.language || "";
      return `<pre class="language-${language}"><code>${escapeHtml(codeHighlightContent)}</code></pre>`;

    case "horizontalrule":
      return "<hr />";

    case "table":
      const tableContent = children ? children.map(processNode).join("") : "";
      return `<table>${tableContent}</table>`;

    case "tablerow":
      const rowContent = children ? children.map(processNode).join("") : "";
      return `<tr>${rowContent}</tr>`;

    case "tablecell":
      const cellContent = children ? children.map(processNode).join("") : "";
      const header = attributes.header ? "th" : "td";
      return `<${header}>${cellContent}</${header}>`;

    default:
      // For unknown node types, try to process children
      if (children) {
        return children.map(processNode).join("");
      }
      return text ? escapeHtml(text) : "";
  }
}

/**
 * Format text with formatting flags
 */
function formatText(text: string, format: number, style?: string): string {
  if (!text) return "";

  let formatted = escapeHtml(text);

  // Apply formatting flags (bitwise)
  if (format & 1) formatted = `<strong>${formatted}</strong>`; // Bold
  if (format & 2) formatted = `<em>${formatted}</em>`; // Italic
  if (format & 4) formatted = `<s>${formatted}</s>`; // Strikethrough
  if (format & 8) formatted = `<u>${formatted}</u>`; // Underline
  if (format & 16) formatted = `<code>${formatted}</code>`; // Code
  if (format & 32) formatted = `<sub>${formatted}</sub>`; // Subscript
  if (format & 64) formatted = `<sup>${formatted}</sup>`; // Superscript

  // Apply inline styles if present
  if (style) {
    formatted = `<span style="${escapeHtml(style)}">${formatted}</span>`;
  }

  return formatted;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

