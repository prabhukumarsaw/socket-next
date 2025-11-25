"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Facebook,
  Twitter,
  Instagram,
  Search,
  Menu,
  Globe,
  Newspaper,
  TrendingUp,
  ShoppingCart,
  Calendar,
  ChevronRight,
  Home,
  Cpu,
  Trophy,
  Zap,
} from "lucide-react"
import { useScroll } from "@/hooks/use-scroll"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false)
  const { scrolled, visible } = useScroll(20)
  const [publicMenus, setPublicMenus] = React.useState([]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  React.useEffect(() => {
    async function loadMenus() {
      try {
        const res = await fetch("/api/public/menus");
        const json = await res.json();
        if (json.success) {
          setPublicMenus(json.data);
        }
      } catch (err) {
        console.error("Failed loading public menus", err);
      }
    }
    loadMenus();
  }, []);

  return (
    <>
      {/* Spacer to prevent layout shift */}
      <div className="h-[120px] w-full invisible hidden md:block" />
      <div className="h-16 w-full invisible md:hidden" />

      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-transform duration-300 ease-in-out bg-background",
          !visible ? "-translate-y-full md:-translate-y-16" : "translate-y-0",
          scrolled ? "shadow-md" : "",
        )}
      >
        {/* Top Bar / Mobile Main Bar */}
        <div className="h-16 border-b border-border bg-background">
          <div className="container mx-auto flex h-full items-center justify-between px-4 lg:px-6">
            {/* Mobile Toggle (Left) */}
            <div className="flex md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Toggle menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col bg-background border-r">
                  <div className="p-6 border-b">
                    <SheetTitle className="flex items-center gap-3">
                      {/* Logo Box */}
                      <div className="flex h-10 w-full items-center justify-center">
                        <img
                          src="/assets/logo.png"  // <-- यहाँ mini mic logo आएगा
                          alt="Bawal News"
                          className="h-7 w-auto"
                        />
                      </div>

                      {/* Text Section */}
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-xl leading-none text-red-600">
                          Bawal News
                        </span>
                        <span className="text-xs mt-1 font-medium text-muted-foreground">
                          खबरें जो आपको जगा दे
                        </span>
                      </div>
                    </SheetTitle>

                  </div>

                  <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="flex flex-col space-y-1">
                      <a
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Home className="h-4 w-4" />
                        Home
                      </a>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="features" className="border-none">
                          <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground hover:no-underline rounded-md text-sm font-medium [&[data-state=open]]:bg-accent">
                            <div className="flex items-center gap-3">
                              <Zap className="h-4 w-4" />
                              Features
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pl-10 pt-1">
                            <div className="flex flex-col space-y-1 border-l border-border/50 pl-2">
                              <a
                                href="#"
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                              >
                                Latest News
                              </a>
                              <a
                                href="#"
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                              >
                                Featured Articles
                              </a>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="politics" className="border-none">
                          <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground hover:no-underline rounded-md text-sm font-medium [&[data-state=open]]:bg-accent">
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4" />
                              World Politics
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pl-10 pt-1">
                            <div className="flex flex-col space-y-1 border-l border-border/50 pl-2">
                              <a
                                href="#"
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                              >
                                International
                              </a>
                              <a
                                href="#"
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                              >
                                National Politics
                              </a>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <a
                        href="/sports"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Trophy className="h-4 w-4" />
                        Sports
                      </a>

                      <a
                        href="/technology"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Cpu className="h-4 w-4" />
                        Technology
                      </a>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="economy" className="border-none">
                          <AccordionTrigger className="py-2 px-3 hover:bg-accent hover:text-accent-foreground hover:no-underline rounded-md text-sm font-medium [&[data-state=open]]:bg-accent">
                            <div className="flex items-center gap-3">
                              <TrendingUp className="h-4 w-4" />
                              Economy
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-0 pl-10 pt-1">
                            <div className="flex flex-col space-y-1 border-l border-border/50 pl-2">
                              <a
                                href="#"
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                              >
                                Markets
                              </a>
                              <a
                                href="#"
                                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                              >
                                Business
                              </a>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </nav>
                  </div>

                  <div className="p-6 border-t bg-muted/10">
                    <div className="flex items-center justify-center gap-6 mb-6">
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-blue-400 transition-colors p-2 hover:bg-blue-50 rounded-full"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-pink-600 transition-colors p-2 hover:bg-pink-50 rounded-full"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20">
                      SUBSCRIBE NOW
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo (Center on Mobile, Left on Desktop) */}
            <a
              href="/"
              className="flex items-center gap-2 text-2xl font-bold absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto"
            >
              {/* Circle icon area */}
              <div className="flex h-10 w-full items-center justify-center">
                <img
                  src="/assets/logo.png"   // <-- यहाँ तुम्हारा mini mic logo आएगा
                  alt="Bawal News"
                  className="h-full w-auto"
                />
              </div>

              {/* Logo Text */}
              {/* <span className="flex hidden sm:inline-block font-bold">
                 BawalNews  
              </span> */}
            </a>


            {/* Desktop Socials & Subscribe */}
            <div className="hidden items-center gap-6 md:flex">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{currentDate}</span>
              </div>

              <div className="flex items-center gap-4 border-l border-border pl-6">
                <a
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-blue-600"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-blue-400"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-pink-600"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <Button className="ml-2 bg-blue-600 font-semibold hover:bg-blue-700">SUBSCRIBE</Button>
              </div>
            </div>

            {/* Mobile Functional Search (Right) */}
            <div className="flex md:hidden justify-end">
              <div
                className={cn(
                  "absolute left-0 top-0 w-full h-full bg-background flex items-center px-4 transition-all duration-200 ease-in-out z-20",
                  isMobileSearchOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none",
                )}
              >
                <div className="relative w-full max-w-md mx-auto flex items-center gap-2">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus={isMobileSearchOpen}
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-10 h-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0"
                    onClick={() => setIsMobileSearchOpen(false)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(true)} aria-label="Open search">
                <Search className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar (Desktop Only) */}
        <div className="border-b-4 border-blue-600 bg-background hidden md:block">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex h-14 items-center justify-between">
              {/* Mini Logo - Only shows when Top Bar is hidden */}
              <div
                className={cn(
                  "flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out",
                  !visible ? "w-auto opacity-100 mr-4" : "w-0 opacity-0",
                )}
              >
                {/* Mini Mic Logo */}
                <img
                  src="/assets/logo.png"  // <-- यहाँ तुम अपना छोटा लोगो रखोगे
                  alt="Bawal News"
                  className="h-8 w-auto"
                />

                {/* Mini Text */}
                <span className="hidden sr-only font-bold whitespace-nowrap lg:inline-block">
                  Bawal News
                </span>
              </div>


              {/* Desktop Navigation Links */}
              <div className="flex-1">
                <NavigationMenu className="mx-0 max-w-full justify-start">
                  <NavigationMenuList className="flex w-full items-center justify-start gap-1">
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        href="/"
                        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        Home
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-transparent">Features</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href="#"
                              >
                                <div className="text-sm font-medium leading-none">Latest News</div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  Breaking stories from around the world
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href="#"
                              >
                                <div className="text-sm font-medium leading-none">Featured Articles</div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  In-depth coverage and analysis
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-transparent">World Politics</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href="#"
                              >
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <span className="text-sm font-medium leading-none">International</span>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  Global political developments
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href="#"
                              >
                                <div className="flex items-center gap-2">
                                  <Newspaper className="h-4 w-4" />
                                  <span className="text-sm font-medium leading-none">National Politics</span>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  Domestic political coverage
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink
                        href="/sports"
                        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        Sports
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink
                        href="/technology"
                        className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      >
                        Technology
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-transparent">Economy</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href="#"
                              >
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  <span className="text-sm font-medium leading-none">Markets</span>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  Stock market and financial news
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                href="#"
                              >
                                <div className="flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4" />
                                  <span className="text-sm font-medium leading-none">Business</span>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  Corporate and business coverage
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>

              {/* Desktop Search */}
              <div className="flex items-center">
                <div
                  className={cn(
                    "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
                    isSearchOpen ? "w-64 opacity-100" : "w-0 opacity-0",
                  )}
                >
                  <Input type="text" placeholder="Search news..." className="h-9 w-full bg-background shadow-sm" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Search"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="ml-2"
                >
                  {isSearchOpen ? <ChevronRight className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
