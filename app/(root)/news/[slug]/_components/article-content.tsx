import { cn } from "@/lib/utils"

interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <article className="prose prose-base md:prose-lg dark:prose-invert max-w-none mx-auto">
        {/* We use a dangerouslySetInnerHTML here because the content simulates HTML from a CMS */}
        {/* In a real app, use a parser or MDX */}
        <div
          dangerouslySetInnerHTML={{ __html: content }}
          className={cn(
            "prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight",
            "prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8",
            "prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8",
            "prose-p:text-muted-foreground prose-p:leading-7 prose-p:mb-6",
            "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
            "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/30 prose-blockquote:py-4 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-foreground prose-blockquote:my-8",
            "prose-img:rounded-xl prose-img:shadow-md prose-img:my-8 prose-img:max-w-full prose-img:h-auto",
            "prose-img.lexical-image:max-w-full prose-img.lexical-image:h-auto prose-img.lexical-image:object-contain",
            "prose-strong:text-foreground prose-strong:font-bold",
            "prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:marker:text-blue-500",
            "prose-li:text-muted-foreground prose-li:mb-2",
            "prose-hr:border-border prose-hr:my-8",
          )}
        />
      </article>
  )
}
