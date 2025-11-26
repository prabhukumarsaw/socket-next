import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://bawalnews.com'

  // Get all published news posts
  const news = await prisma.news.findMany({
    where: {
      isPublished: true,
      isActive: true,
    },
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
  })

  // Get all public categories (menus)
  const categories = await prisma.menu.findMany({
    where: {
      isPublic: true,
      isActive: true,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ads`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // News posts
  const newsPages: MetadataRoute.Sitemap = news.map((item: typeof news[number]) => ({
    url: `${baseUrl}/news/${item.slug}`,
    lastModified: item.updatedAt,
    changeFrequency: 'daily' as const,
    priority: item.publishedAt ? 0.9 : 0.7,
  }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category: typeof categories[number]) => ({
    url: `${baseUrl}/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...newsPages, ...categoryPages]
}

