/**
 * Convert Lexical JSON state to SEO-friendly HTML
 * This utility converts Lexical editor state to HTML for public display
 * Optimized for fast image loading while preserving format and style
 */

import type { SerializedEditorState } from "lexical";

/**
 * Check if URL is a Cloudinary URL
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com") || url.includes("cloudinary.com");
}

/**
 * Extract Cloudinary public ID from URL
 */
function extractCloudinaryPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;
  
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
    // Handle both with and without transformations
    const uploadMatch = url.match(/\/upload\/(.+)$/);
    if (uploadMatch && uploadMatch[1]) {
      const pathAfterUpload = uploadMatch[1];
      
      // Split by '/' to get all parts
      const parts = pathAfterUpload.split('/');
      
      // The last part is usually the public ID with extension
      // But transformations can be in the middle, so we need to find the actual public ID
      // Public ID typically doesn't have transformation-like patterns (w_, h_, q_, etc.)
      let publicId = parts[parts.length - 1];
      
      // Remove file extension
      publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i, "");
      
      // If the last part looks like a transformation, try to find the actual public ID
      // by looking for parts that don't match transformation patterns
      if (publicId.match(/^(w_|h_|q_|c_|f_|fl_)/)) {
        // This might be a transformation, look for the actual public ID
        for (let i = parts.length - 2; i >= 0; i--) {
          const part = parts[i];
          if (!part.match(/^(w_|h_|q_|c_|f_|fl_|ar_|b_|bo_|dpr_|e_|g_|l_|o_|r_|t_|u_|x_|y_|z_)/)) {
            publicId = part.replace(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i, "");
            break;
          }
        }
      }
      
      return publicId || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate optimized Cloudinary image URL with transformations
 */
function getOptimizedCloudinaryUrl(
  url: string,
  options: {
    width?: number | string;
    height?: number | string;
    maxWidth?: number;
    quality?: number;
    format?: "auto" | "webp" | "avif";
  } = {}
): string {
  if (!isCloudinaryUrl(url)) {
    return url; // Return original if not Cloudinary
  }

  try {
    // Extract cloud name from URL
    const cloudNameMatch = url.match(/res\.cloudinary\.com\/([^\/]+)/);
    if (!cloudNameMatch) return url;

    const cloudName = cloudNameMatch[1];
    
    // Extract the path after /upload/
    const uploadMatch = url.match(/\/upload\/(.+)$/);
    if (!uploadMatch) return url;
    
    const existingPath = uploadMatch[1];
    
    // Check if URL already has transformations
    // If it does, we'll append our optimizations
    // If not, we'll add them fresh
    const hasTransformations = existingPath.includes(',') || 
                               existingPath.match(/^(w_|h_|q_|c_|f_|fl_|ar_|b_|bo_|dpr_|e_|g_|l_|o_|r_|t_|u_|x_|y_|z_)/);
    
    const transformations: string[] = [];

    // Add width transformation
    if (options.width && typeof options.width === "number") {
      transformations.push(`w_${options.width}`);
    } else if (options.maxWidth) {
      transformations.push(`w_${options.maxWidth}`);
    }

    // Add height transformation if provided (only if width is also set)
    if (options.height && typeof options.height === "number" && (options.width || options.maxWidth)) {
      transformations.push(`h_${options.height}`);
    }

    // Add quality (auto:good for good compression)
    transformations.push("q_auto:good");

    // Add format (auto for WebP/AVIF when supported)
    transformations.push("f_auto");

    // Add progressive and strip metadata flags
    transformations.push("fl_progressive");
    transformations.push("fl_strip_profile");

    if (hasTransformations) {
      // URL already has transformations, prepend ours
      const transformString = transformations.join(",") + ",";
      return url.replace(/\/upload\//, `/upload/${transformString}`);
    } else {
      // No existing transformations, add ours
      const transformString = transformations.join(",") + "/";
      return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${existingPath}`;
    }
  } catch (error) {
    console.error("Error optimizing Cloudinary URL:", error);
    return url; // Return original on error
  }
}

/**
 * Generate responsive srcset for images
 */
function generateSrcSet(url: string, maxWidth?: number): string {
  if (!isCloudinaryUrl(url)) {
    return ""; // No srcset for non-Cloudinary images
  }

  const widths = [400, 800, 1200, 1600, 2000];
  const srcset: string[] = [];

  widths.forEach((width) => {
    if (!maxWidth || width <= maxWidth) {
      const optimizedUrl = getOptimizedCloudinaryUrl(url, { width, quality: 85 });
      srcset.push(`${optimizedUrl} ${width}w`);
    }
  });

  return srcset.join(", ");
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
      
      // Optimize image URL for Cloudinary
      const optimizedSrc = isCloudinaryUrl(src)
        ? getOptimizedCloudinaryUrl(src, {
            width: typeof imgWidth === "number" ? imgWidth : maxWidth,
            height: typeof imgHeight === "number" ? imgHeight : undefined,
            maxWidth: typeof imgWidth === "number" ? undefined : maxWidth,
            quality: 85,
            format: "auto",
          })
        : src;

      // Build image attributes
      const imgAttributes: string[] = [];
      
      // Add src
      imgAttributes.push(`src="${escapeHtml(optimizedSrc)}"`);
      
      // Add alt
      imgAttributes.push(`alt="${escapeHtml(alt)}"`);
      
      // Add width and height for layout stability (prevent CLS)
      if (typeof imgWidth === "number") {
        imgAttributes.push(`width="${imgWidth}"`);
      }
      if (typeof imgHeight === "number") {
        imgAttributes.push(`height="${imgHeight}"`);
      }
      
      // Add responsive srcset for Cloudinary images
      if (isCloudinaryUrl(src)) {
        const srcset = generateSrcSet(src, typeof imgWidth === "number" ? imgWidth : maxWidth);
        if (srcset) {
          imgAttributes.push(`srcset="${srcset}"`);
          imgAttributes.push(`sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, ${typeof imgWidth === "number" ? imgWidth : maxWidth}px"`);
        }
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

