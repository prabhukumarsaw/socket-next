"use client"

import { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Edit, 
  Megaphone, 
  HelpCircle, 
  CheckCircle2,
  FileText,
  Shield,
  Scale,
  Cookie
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StaticPageSection {
  type: "hero" | "content" | "features" | "contact-info"
  title?: string
  content?: string
  items?: Array<{
    title: string
    description: string
    value?: string
    icon?: string
  }>
}

interface StaticPageLayoutProps {
  title: string
  description: string
  sections: StaticPageSection[]
  lastUpdated?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  mail: Mail,
  edit: Edit,
  megaphone: Megaphone,
  "help-circle": HelpCircle,
}

export function StaticPageLayout({ 
  title, 
  description, 
  sections,
  lastUpdated 
}: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground font-hindi">
            {title}
          </h1>
          {description && (
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-hindi">
              {description}
            </p>
          )}
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-4">
              Last Updated: {lastUpdated}
            </p>
          )}
        </div>

        <Separator className="mb-8" />

        {/* Content Sections */}
        <div className="space-y-8 sm:space-y-12">
          {sections.map((section, index) => (
            <div key={index}>
              {section.type === "hero" && (
                <Card className="border-2 shadow-sm">
                  <CardContent className="p-6 sm:p-8">
                    {section.title && (
                      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">
                        {section.title}
                      </h2>
                    )}
                    {section.content && (
                      <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-hindi">
                        {section.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {section.type === "content" && (
                <div className="space-y-4">
                  {section.title && (
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      {section.title}
                    </h2>
                  )}
                  {section.content && (
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-hindi">
                      {section.content}
                    </p>
                  )}
                </div>
              )}

              {section.type === "features" && section.items && (
                <div className="space-y-6">
                  {section.title && (
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                      {section.title}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {section.items.map((item, itemIndex) => (
                      <Card key={itemIndex} className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2 text-foreground">
                                {item.title}
                              </h3>
                              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {section.type === "contact-info" && section.items && (
                <div className="space-y-6">
                  {section.title && (
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
                      {section.title}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {section.items.map((item, itemIndex) => {
                      const IconComponent = item.icon ? iconMap[item.icon] : Mail
                      return (
                        <Card key={itemIndex} className="border shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex-shrink-0">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 text-foreground">
                                  {item.title}
                                </h3>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {item.description}
                                  </p>
                                )}
                                {item.value && (
                                  <a
                                    href={`mailto:${item.value}`}
                                    className="text-sm sm:text-base text-primary hover:underline font-medium"
                                  >
                                    {item.value}
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            If you have any questions or concerns, please{" "}
            <a href="/contact" className="text-primary hover:underline">
              contact us
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

