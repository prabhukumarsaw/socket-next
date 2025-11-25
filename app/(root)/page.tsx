import Home from "@/components/home/Index.html";
import { Metadata } from "next";

// Revalidate every 60 seconds for fresh content
export const revalidate = 1;

export const metadata: Metadata = {
  title: "Bawal - Latest News and Breaking Updates",
  description: "Stay informed with the latest news, breaking updates, and featured stories from around the world.",
  openGraph: {
    title: "Bawal - Latest News and Breaking Updates",
    description: "Stay informed with the latest news, breaking updates, and featured stories from around the world.",
    type: "website",
  },
};

export default async function HomePage() {
  return (
    <div className="max-w-[90rem] mx-auto py-8">
      <Home />
    </div>
  );
}
