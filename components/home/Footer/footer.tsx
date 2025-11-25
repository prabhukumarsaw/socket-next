
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    FacebookIcon,
    GithubIcon,
    InstagramIcon,
    LinkedinIcon,
    TwitterIcon,
    YoutubeIcon,
} from "lucide-react";

export function Footer() {
    const company = [
        {
            title: "About Us",
            href: "/about",
        },
        {
            title: "Contact Us",
            href: "/contact",
        },
        {
            title: "Advertising",
            href: "/ads",
        },
        {
            title: "Privacy Policy",
            href: "/privacy",
        },
        {
            title: "Terms & Conditions",
            href: "/terms",
        },
        {
            title: "DMCA",
            href: "/dmca",
        },
        {
            title: "Cookie Policy",
            href: "/cookies",
        },
    ];

    const resources = [
        {
            title: "Search",
            href: "/search",
        },
        {
            title: "Contact Support",
            href: "/contact",
        },
        {
            title: "Advertising",
            href: "/ads",
        },
    ];

    const socialLinks = [
        {
            icon: FacebookIcon,
            link: "#",
        },
        {
            icon: GithubIcon,
            link: "#",
        },
        {
            icon: InstagramIcon,
            link: "#",
        },
        {
            icon: LinkedinIcon,
            link: "#",
        },
        {
            icon: TwitterIcon,
            link: "#",
        },
        {
            icon: YoutubeIcon,
            link: "#",
        },
    ];
    return (
        <footer className="relative">
            <div
                className={cn(
                    "mx-auto max-w-5xl lg:border-x",
                    "dark:bg-[radial-gradient(35%_80%_at_30%_0%,--theme(--color-foreground/.1),transparent)]"
                )}
            >
                <div className="absolute inset-x-0 h-px w-full bg-border" />
                <div className="grid max-w-5xl grid-cols-6 gap-6 p-4">
                    <div className="col-span-6 flex flex-col gap-4 pt-5 md:col-span-4">
                        <a className="w-max" href="#">
                            <div className="flex h-10 w-full items-center justify-center">
                                <img
                                    src="/assets/logo.png"   // <-- यहाँ तुम्हारा mini mic logo आएगा
                                    alt="Bawal News"
                                    className="h-full w-auto"
                                />
                            </div>
                        </a>
                        <p className="max-w-sm text-balance text-muted-foreground text-sm">
                            Stay informed with the latest news, breaking updates, and featured stories from around the world.
                        </p>
                        <div className="flex gap-2">
                            {socialLinks.map((item, index) => (
                                <Button
                                    key={`social-${item.link}-${index}`}
                                    size="icon-sm"
                                    variant="outline"
                                >
                                    <a href={item.link} target="_blank">
                                        <item.icon className="size-3.5" />
                                    </a>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3 w-full md:col-span-1">
                        <span className="text-muted-foreground text-xs">Resources</span>
                        <div className="mt-2 flex flex-col gap-2">
                            {resources.map(({ href, title }) => (
                                <a
                                    className="w-max text-sm hover:underline"
                                    href={href}
                                    key={title}
                                >
                                    {title}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3 w-full md:col-span-1">
                        <span className="text-muted-foreground text-xs">Company</span>
                        <div className="mt-2 flex flex-col gap-2">
                            {company.map(({ href, title }) => (
                                <a
                                    className="w-max text-sm hover:underline"
                                    href={href}
                                    key={title}
                                >
                                    {title}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute inset-x-0 h-px w-full bg-border" />
                <div className="flex max-w-5xl flex-col justify-between gap-2 py-6 px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-center md:text-left font-light text-muted-foreground text-sm">
                            &copy; {new Date().getFullYear()} Bawal News. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <a href="/rss.xml" className="hover:text-foreground transition-colors">RSS Feed</a>
                            <span>•</span>
                            <a href="/sitemap.xml" className="hover:text-foreground transition-colors">Sitemap</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
