"use client"

import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  // Enhance images and ensure proper rendering
  useEffect(() => {
    const contentDiv = document.querySelector('.lexical-content')
    if (!contentDiv) return

    // Process images to ensure they're responsive
    const images = contentDiv.querySelectorAll('img.lexical-image')
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement
      if (!imgElement.dataset.processed) {
        imgElement.dataset.processed = 'true'
        // Ensure images respect their max-width from Lexical
        if (!imgElement.style.maxWidth && imgElement.getAttribute('style')) {
          // Preserve existing styles
        } else if (!imgElement.style.maxWidth) {
          imgElement.style.maxWidth = '100%'
        }
        imgElement.style.height = 'auto'
        imgElement.classList.add('w-full', 'h-auto')
      }
    })

    // Add responsive wrapper to tables
    const tables = contentDiv.querySelectorAll('table')
    tables.forEach((table) => {
      if (!table.parentElement?.classList.contains('table-wrapper')) {
        const wrapper = document.createElement('div')
        wrapper.className = 'table-wrapper overflow-x-auto my-4 sm:my-6'
        table.parentNode?.insertBefore(wrapper, table)
        wrapper.appendChild(table)
      }
    })
  }, [content])

  return (
    <>
      <style>{`
        .lexical-content {
          font-family: var(--font-hindi), var(--font-sans), sans-serif;
        }
        .lexical-content h1 { font-size: 1.5rem; line-height: 1.2; margin-top: 1.5rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .lexical-content h1 { font-size: 1.875rem; margin-top: 2rem; margin-bottom: 1.5rem; } }
        @media (min-width: 768px) { .lexical-content h1 { font-size: 2.25rem; } }
        @media (min-width: 1024px) { .lexical-content h1 { font-size: 3rem; } }
        .lexical-content h2 { font-size: 1.25rem; line-height: 1.3; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        @media (min-width: 640px) { .lexical-content h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; } }
        @media (min-width: 768px) { .lexical-content h2 { font-size: 1.875rem; } }
        @media (min-width: 1024px) { .lexical-content h2 { font-size: 2.25rem; } }
        .lexical-content h3 { font-size: 1.125rem; line-height: 1.4; margin-top: 1rem; margin-bottom: 0.5rem; }
        @media (min-width: 640px) { .lexical-content h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; } }
        @media (min-width: 768px) { .lexical-content h3 { font-size: 1.5rem; } }
        @media (min-width: 1024px) { .lexical-content h3 { font-size: 1.875rem; } }
        .lexical-content h4 { font-size: 1rem; margin-top: 1rem; margin-bottom: 0.5rem; }
        @media (min-width: 640px) { .lexical-content h4 { font-size: 1.125rem; margin-top: 1.5rem; margin-bottom: 0.75rem; } }
        @media (min-width: 768px) { .lexical-content h4 { font-size: 1.25rem; } }
        @media (min-width: 1024px) { .lexical-content h4 { font-size: 1.5rem; } }
        .lexical-content h5 { font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem; }
        @media (min-width: 640px) { .lexical-content h5 { font-size: 1rem; } }
        @media (min-width: 768px) { .lexical-content h5 { font-size: 1.125rem; } }
        @media (min-width: 1024px) { .lexical-content h5 { font-size: 1.25rem; } }
        .lexical-content h6 { font-size: 0.875rem; margin-top: 1rem; margin-bottom: 0.5rem; }
        @media (min-width: 640px) { .lexical-content h6 { font-size: 1rem; } }
        @media (min-width: 768px) { .lexical-content h6 { font-size: 1.125rem; } }
        .lexical-content p + h1, .lexical-content p + h2, .lexical-content p + h3,
        .lexical-content ul + h1, .lexical-content ul + h2, .lexical-content ul + h3,
        .lexical-content ol + h1, .lexical-content ol + h2, .lexical-content ol + h3,
        .lexical-content blockquote + h1, .lexical-content blockquote + h2, .lexical-content blockquote + h3 {
          margin-top: 2rem;
        }
        @media (min-width: 640px) {
          .lexical-content p + h1, .lexical-content p + h2, .lexical-content p + h3,
          .lexical-content ul + h1, .lexical-content ul + h2, .lexical-content ul + h3,
          .lexical-content ol + h1, .lexical-content ol + h2, .lexical-content ol + h3,
          .lexical-content blockquote + h1, .lexical-content blockquote + h2, .lexical-content blockquote + h3 {
            margin-top: 2.5rem;
          }
        }
      `}</style>
      <article className="w-full max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className={cn(
            "lexical-content",
            // Base typography
            "text-base sm:text-lg lg:text-xl",
            "leading-[1.8] sm:leading-[1.9]",
            "text-foreground/90",
            "font-hindi",
            
            // Headings
            "[&_h1]:font-bold [&_h1]:text-foreground [&_h1]:tracking-tight",
            "[&_h2]:font-bold [&_h2]:text-foreground [&_h2]:tracking-tight",
            "[&_h3]:font-bold [&_h3]:text-foreground [&_h3]:tracking-tight",
            "[&_h4]:font-semibold [&_h4]:text-foreground",
            "[&_h5]:font-semibold [&_h5]:text-foreground",
            "[&_h6]:font-semibold [&_h6]:text-foreground",
            
            // Paragraphs
            "[&_p]:mb-4 sm:[&_p]:mb-6",
            "[&_p]:text-foreground/90",
            "[&_p]:leading-[1.8] sm:[&_p]:leading-[1.9]",
            
            // Links
            "[&_a]:text-primary [&_a]:no-underline [&_a]:font-medium",
            "[&_a:hover]:underline [&_a]:transition-colors",
            "[&_a]:decoration-2 [&_a]:underline-offset-2",
            
            // Blockquotes
            "[&_blockquote]:border-l-4 [&_blockquote]:border-primary",
            "[&_blockquote]:bg-muted/50 dark:[&_blockquote]:bg-muted/30",
            "[&_blockquote]:py-3 sm:[&_blockquote]:py-4",
            "[&_blockquote]:px-4 sm:[&_blockquote]:px-6",
            "[&_blockquote]:rounded-r-lg",
            "[&_blockquote]:text-foreground/90",
            "[&_blockquote]:my-6 sm:[&_blockquote]:my-8",
            "[&_blockquote]:font-normal",
            
            // Images
            "[&_img]:max-w-full [&_img]:h-auto",
            "[&_img]:rounded-lg sm:[&_img]:rounded-xl",
            "[&_img]:shadow-md",
            "[&_img]:my-4 sm:[&_img]:my-6 lg:[&_img]:my-8",
            "[&_img]:block [&_img]:mx-auto",
            "[&_img.lexical-image]:object-contain",
            "[&_img.lexical-image]:shadow-lg",
            
            // Lists
            "[&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:pl-6 md:[&_ul]:pl-8",
            "[&_ul]:mb-4 sm:[&_ul]:mb-6",
            "[&_ul]:marker:text-primary",
            "[&_ol]:list-decimal [&_ol]:pl-5 sm:[&_ol]:pl-6 md:[&_ol]:pl-8",
            "[&_ol]:mb-4 sm:[&_ol]:mb-6",
            "[&_li]:mb-2 sm:[&_li]:mb-3",
            "[&_li]:text-foreground/90",
            "[&_li]:leading-relaxed",
            "[&_ul_ul]:mt-2 sm:[&_ul_ul]:mt-3 [&_ul_ul]:mb-2",
            "[&_ol_ol]:mt-2 sm:[&_ol_ol]:mt-3 [&_ol_ol]:mb-2",
            
            // Code
            "[&_code]:text-sm sm:[&_code]:text-base",
            "[&_code]:bg-muted [&_code]:text-foreground",
            "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
            "[&_code]:font-mono",
            "[&_pre]:bg-muted [&_pre]:text-foreground",
            "[&_pre]:p-3 sm:[&_pre]:p-4",
            "[&_pre]:rounded-lg [&_pre]:overflow-x-auto",
            "[&_pre]:my-4 sm:[&_pre]:my-6",
            "[&_pre]:border [&_pre]:border-border",
            "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            
            // Horizontal rules
            "[&_hr]:border-border [&_hr]:my-6 sm:[&_hr]:my-8",
            "[&_hr]:border-t-2",
            
            // Tables
            "[&_table]:w-full [&_table]:border-collapse",
            "[&_table]:my-4 sm:[&_table]:my-6",
            "[&_table]:shadow-sm [&_table]:rounded-lg",
            "[&_table]:overflow-hidden [&_table]:border [&_table]:border-border",
            "[&_thead]:bg-muted",
            "[&_th]:px-3 sm:[&_th]:px-4 [&_th]:py-2 sm:[&_th]:py-3",
            "[&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground",
            "[&_th]:border-b [&_th]:border-border",
            "[&_td]:px-3 sm:[&_td]:px-4 [&_td]:py-2 sm:[&_td]:py-3",
            "[&_td]:border-b [&_td]:border-border",
            "[&_td]:text-foreground/90",
            "[&_tbody_tr:last-child_td]:border-b-0",
            "[&_tbody_tr:hover]:bg-muted/50",
            
            // Text formatting
            "[&_strong]:font-bold [&_strong]:text-foreground",
            "[&_em]:italic",
            "[&_u]:underline [&_u]:decoration-2",
            "[&_s]:line-through",
            "[&_sub]:text-xs [&_sub]:align-sub",
            "[&_sup]:text-xs [&_sup]:align-super",
          )}
        />
      </article>
    </>
  )
}
