import Image from "next/image"
import { Facebook, Twitter, Linkedin, Instagram, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthorBioProps {
  author: string
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-8 mb-12 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
      <div className="relative h-24 w-24 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-background shadow-lg">
        <Image src="/author-avatar.png" alt={author} fill className="object-cover" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-between mb-2 flex-wrap gap-2">
          <h3 className="font-bold text-lg text-foreground">{author}</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed mb-0">
          specializes in local and regional stories, bringing simple, factual, and timely updates to readers.
        </p>
      </div>
    </div>
  )
}
