/**
 * Social Media Share Utilities
 * Provides functions to share content on various platforms
 */

export interface ShareData {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

/**
 * Share on Facebook
 */
export function shareOnFacebook(data: ShareData) {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
  window.open(url, "_blank", "width=600,height=400");
}

/**
 * Share on Twitter/X
 */
export function shareOnTwitter(data: ShareData) {
  const text = `${data.title}${data.description ? ` - ${data.description}` : ""}`;
  const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "width=600,height=400");
}

/**
 * Share on LinkedIn
 */
export function shareOnLinkedIn(data: ShareData) {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`;
  window.open(url, "_blank", "width=600,height=400");
}

/**
 * Share on Pinterest
 */
export function shareOnPinterest(data: ShareData) {
  const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(data.url)}&description=${encodeURIComponent(data.title)}${data.image ? `&media=${encodeURIComponent(data.image)}` : ""}`;
  window.open(url, "_blank", "width=600,height=400");
}

/**
 * Share via Email
 */
export function shareViaEmail(data: ShareData) {
  const subject = encodeURIComponent(data.title);
  const body = encodeURIComponent(`${data.description || ""}\n\n${data.url}`);
  const url = `mailto:?subject=${subject}&body=${body}`;
  window.location.href = url;
}

/**
 * Share via WhatsApp
 */
export function shareOnWhatsApp(data: ShareData) {
  const text = `${data.title}${data.description ? ` - ${data.description}` : ""} ${data.url}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "width=600,height=400");
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

