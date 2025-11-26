import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/config/env'

export async function GET() {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://bawalnews.com'
  const siteName = 'Bawal News'
  const siteDescription = 'Latest news and breaking updates from Bawal News'

  // Get latest published news (last 50)
  const news = await prisma.news.findMany({
    where: {
      isPublished: true,
      isActive: true,
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      categories: {
        include: {
          menu: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 50,
  })

  // Generate RSS XML
  const rssItems = news.map((item: typeof news[number]) => {
    const authorName = item.author
      ? `${item.author.firstName || ''} ${item.author.lastName || ''}`.trim() || item.author.username
      : 'Bawal News'
    
    const categories = item.categories.map((cat: typeof item.categories[number]) => cat.menu.name).join(', ')
    const excerpt = item.excerpt || item.content.substring(0, 200).replace(/<[^>]*>/g, '') + '...'
    const content = item.content.replace(/<[^>]*>/g, '').substring(0, 500) + '...'
    const imageUrl = item.coverImage || `${baseUrl}/placeholder.png`
    const pubDate = item.publishedAt || item.createdAt

    return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${baseUrl}/news/${item.slug}</link>
      <guid isPermaLink="true">${baseUrl}/news/${item.slug}</guid>
      <description><![CDATA[${excerpt}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <author>${authorName}</author>
      <category><![CDATA[${categories}]]></category>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <updated>${item.updatedAt.toUTCString()}</updated>
      <enclosure url="${imageUrl}" type="image/jpeg" />
      ${item.isBreaking ? '<breaking>true</breaking>' : ''}
      ${item.isFeatured ? '<featured>true</featured>' : ''}
    </item>`
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title><![CDATA[${siteName}]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/assets/logo.png</url>
      <title>${siteName}</title>
      <link>${baseUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

