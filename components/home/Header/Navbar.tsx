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
import { cn } from "@/lib/utils"
import {
  Facebook,
  Twitter,
  Instagram,
  Search,
  Menu,
  Calendar,
  ChevronRight,
  Home,
} from "lucide-react"
import { useScroll } from "@/hooks/use-scroll"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PublicMenu } from "@/types/public"
import { SearchBar } from "@/components/news/search-bar"

interface NavbarProps {
  menus?: PublicMenu[]; // Optional: can be passed from server-side
}

export function Navbar({ menus: initialMenus }: NavbarProps = {}) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false)
  const { scrolled, visible } = useScroll(20)
  const [publicMenus, setPublicMenus] = React.useState<PublicMenu[]>(initialMenus || []);
  const [isLoadingMenus, setIsLoadingMenus] = React.useState(!initialMenus || initialMenus.length === 0);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Optimized menu loading - use server-side menus if provided, otherwise fetch
  React.useEffect(() => {
    // If menus provided from server, use them and cache
    if (initialMenus && initialMenus.length > 0) {
      setPublicMenus(initialMenus);
      setIsLoadingMenus(false);
      // Cache in localStorage for future use
      try {
        localStorage.setItem("publicMenus", JSON.stringify(initialMenus));
        localStorage.setItem("publicMenusTimestamp", Date.now().toString());
      } catch (e) {
        // localStorage not available, ignore
      }
      return;
    }

    // Fallback: Load from client-side with localStorage cache
    async function loadMenus() {
      // Check localStorage cache first
      try {
        const cachedMenus = localStorage.getItem("publicMenus");
        const cacheTimestamp = localStorage.getItem("publicMenusTimestamp");
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes

        if (
          cachedMenus &&
          cacheTimestamp &&
          Date.now() - parseInt(cacheTimestamp) < cacheExpiry
        ) {
          try {
            setPublicMenus(JSON.parse(cachedMenus));
            setIsLoadingMenus(false);
            // Load fresh data in background
            fetchMenus();
            return;
          } catch (err) {
            console.error("Failed to parse cached menus", err);
          }
        }
      } catch (e) {
        // localStorage not available, continue to fetch
      }

      // Load from API
      await fetchMenus();
    }

    async function fetchMenus() {
      try {
        const res = await fetch("/api/public/menus", {
          cache: "force-cache",
        });
        const json = await res.json();
        if (json.success && json.data) {
          setPublicMenus(json.data);
          // Cache in localStorage
          try {
            localStorage.setItem("publicMenus", JSON.stringify(json.data));
            localStorage.setItem("publicMenusTimestamp", Date.now().toString());
          } catch (e) {
            // localStorage not available, ignore
          }
        }
      } catch (err) {
        console.error("Failed loading public menus", err);
      } finally {
        setIsLoadingMenus(false);
      }
    }

    loadMenus();
  }, [initialMenus]);

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

                      {publicMenus.map((menu) => (
                        <div key={menu.id}>
                          {menu.children.length === 0 ? (
                            <a href={`/${menu.slug}`} className="px-3 py-2">
                              {menu.name}
                            </a>
                          ) : (
                            <Accordion type="single" collapsible>
                              <AccordionItem value={menu.id}>
                                <AccordionTrigger>{menu.name}</AccordionTrigger>
                                <AccordionContent>
                                  {menu.children.map((child) => (
                                    <a
                                      key={child.id}
                                      href={`/${child.slug}`}
                                      className="block pl-6 py-2 text-sm"
                                    >
                                      {child.name}
                                    </a>
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                      ))}

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
                <div className="relative w-full max-w-md mx-auto">
                  <SearchBar variant="mobile" onClose={() => setIsMobileSearchOpen(false)} />
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
                    {isLoadingMenus ? (
                      <NavigationMenuItem>
                        <NavigationMenuLink className="text-muted-foreground">
                          Loading...
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ) : (
                      publicMenus.map((menu) => (
                        <NavigationMenuItem key={menu.id}>
                          {menu.children.length === 0 ? (
                            <NavigationMenuLink
                              href={`/${menu.slug}`}
                              className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-primary hover:text-accent-foreground focus:text-primary focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                            >
                              {menu.name}
                            </NavigationMenuLink>
                          ) : (
                            <>
                              <NavigationMenuTrigger>{menu.name}</NavigationMenuTrigger>
                              <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4">
                                  {menu.children.map((child) => (
                                    <li key={child.id}>
                                      <NavigationMenuLink asChild>
                                        <a href={`/${child.slug}`}>
                                          {child.name}
                                        </a>
                                      </NavigationMenuLink>
                                    </li>
                                  ))}
                                </ul>
                              </NavigationMenuContent>
                            </>
                          )}
                        </NavigationMenuItem>
                      ))
                    )}

                  </NavigationMenuList>
                </NavigationMenu>
              </div>

              {/* Desktop Search */}
              <div className="flex items-center">
                <div
                  className={cn(
                    "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
                    isSearchOpen ? "w-80 opacity-100" : "w-0 opacity-0",
                  )}
                >
                  {isSearchOpen && <SearchBar variant="desktop" />}
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
