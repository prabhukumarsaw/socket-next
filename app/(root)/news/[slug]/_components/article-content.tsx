import { cn } from "@/lib/utils"

interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <article className="prose prose-base md:prose-lg lg:prose-xl dark:prose-invert max-w-none mx-auto font-hindi">
        {/* We use a dangerouslySetInnerHTML here because the content simulates HTML from a CMS */}
        {/* In a real app, use a parser or MDX */}
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className={cn(
            "prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight",
            "prose-h1:text-2xl md:text-3xl lg:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:leading-[1.3]",
            "prose-h2:text-xl md:text-2xl lg:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:leading-[1.4]",
            "prose-h3:text-lg md:text-xl lg:text-2xl prose-h3:mb-3 prose-h3:mt-6",
            "prose-p:text-base md:text-lg lg:text-xl prose-p:leading-[1.8] prose-p:mb-6 prose-p:text-foreground/90",
            "prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
            "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/30 prose-blockquote:py-4 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-foreground prose-blockquote:my-8",
            "prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:max-w-full prose-img:h-auto prose-img:w-full",
            "prose-img.lexical-image:max-w-full prose-img.lexical-image:h-auto prose-img.lexical-image:object-contain prose-img.lexical-image:w-full",
            "prose-strong:text-foreground prose-strong:font-bold",
            "prose-ul:list-disc prose-ul:pl-6 md:prose-ul:pl-8 prose-ul:mb-6 prose-ul:marker:text-blue-500",
            "prose-ol:list-decimal prose-ol:pl-6 md:prose-ol:pl-8 prose-ol:mb-6",
            "prose-li:text-foreground/90 prose-li:mb-3 prose-li:leading-relaxed",
            "prose-hr:border-border prose-hr:my-8",
            "prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
            "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg",
          )}
        />
      </article>
  )
}
