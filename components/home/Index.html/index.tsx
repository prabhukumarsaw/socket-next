import { FeaturedSection } from "./featured-section"
import { ContentSidebarSection } from "./content-sidebar-section"
import { CategoryNewsSection } from "./category-news-section"
import { OneSection } from "./section-one"
import Ads from "@/components/ads/page"
import { getHomeFeaturedData, getContentSidebarData, getTechnologySectionData } from "@/lib/actions/home-data"
import { getCategorySectionData } from "@/lib/actions/category-section-data"
import { BreakingNewsTicker } from "@/components/home/BreakingNewsTicker/breaking-news-ticker"

export default async function Home() {
  // Fetch all data server-side in parallel
  const [featuredData, contentSidebarData, technologyData, categorySectionData] = await Promise.all([
    getHomeFeaturedData(),
    getContentSidebarData(),
    getTechnologySectionData(),
    getCategorySectionData(),
  ])

  // Get breaking news for ticker (after 5th post, so skip first 5 breaking news items)
  const tickerNews = featuredData.breakingNews.slice(5).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
  }))

  return (
    <div className="space-y-6 feature-section-font ">
      {/* FEATURED SECTION - Now using dynamic data */}
      <FeaturedSection
        mainFeatured={featuredData.mainFeatured}
        middleFeatured={featuredData.middleFeatured}
        rightTopFeatured={featuredData.rightTopFeatured}
        rightListMostViewed={featuredData.rightListMostViewed}
        breakingNews={featuredData.breakingNews}
      />

      {/* BREAKING NEWS TICKER - After 5th post (featured section) */}
      {tickerNews.length > 0 && (
        <BreakingNewsTicker news={tickerNews} />
      )}


      {/* STATE SECTION - Now using dynamic data */}
      <ContentSidebarSection
        topHeadlines={contentSidebarData.topHeadlines}
        featuredArticle={contentSidebarData.featuredArticle}
        stateArticles={contentSidebarData.stateArticles}
        moreNewsArticles={contentSidebarData.moreNewsArticles}
        sidebarTopArticle={contentSidebarData.sidebarTopArticle}
        sidebarColumns={contentSidebarData.sidebarColumns}
        sidebarOpinion={contentSidebarData.sidebarOpinion}
      />

      {/* TECHNOLOGY SECTION - Now using dynamic data */}
      <OneSection 
        categoryName={technologyData.categoryName}
        featuredArticle={technologyData.featuredArticle}
        sideArticles={technologyData.sideArticles}
        rightArticles={technologyData.rightArticles}
      />
      {/* ADS */}
      <Ads />
      {/* CONTENT SIDEBAR SECTION */}

      <CategoryNewsSection 
        politics={categorySectionData.politics}
        sports={categorySectionData.sports}
        entertainment={categorySectionData.entertainment}
        crime = {categorySectionData.crime}
        topTrending={categorySectionData.topTrending}
        exclusiveNews={categorySectionData.exclusiveNews}
        sidebarBottom={categorySectionData.sidebarBottom}
      />
    </div>
  )
}
