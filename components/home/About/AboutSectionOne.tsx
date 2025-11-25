"use client"

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { staticPagesData } from "@/lib/data/static-pages";

const AboutSectionOne = () => {
  const features = staticPagesData.about.sections
    .find(section => section.type === "features")
    ?.items?.slice(0, 4) || [];

  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-hindi">
                {staticPagesData.about.sections[0]?.title || "About Bawal News"}
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-hindi">
                {staticPagesData.about.sections[0]?.content || ""}
              </p>
            </div>

            {/* Features Grid */}
            {features.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-4">
              <Button asChild size="lg" className="group">
                <Link href="/about">
                  Learn More About Us
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative aspect-square max-w-lg mx-auto lg:mx-0">
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="text-6xl font-bold text-primary/20">BAWAL</div>
                      <p className="text-muted-foreground font-hindi">
                        Your trusted source for news
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionOne;
