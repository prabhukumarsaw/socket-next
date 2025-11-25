import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import Link from 'next/link';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  views: number;
  author: {
    name: string;
    email: string;
    image: string | null;
    fallback: string;
  };
}

interface RecentSalesProps {
  news?: NewsItem[];
}

export function RecentSales({ news = [] }: RecentSalesProps) {
  if (!news || news.length === 0) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Top News</CardTitle>
          <CardDescription>Most viewed news posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[200px] items-center justify-center text-muted-foreground text-sm'>
            No news posts available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Top News</CardTitle>
        <CardDescription>
          {news.length} most viewed news post{news.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className='flex items-center gap-3 transition-colors hover:text-primary'
            >
              <Avatar className='h-9 w-9'>
                <AvatarImage src={item.author.image || undefined} alt={item.author.name} />
                <AvatarFallback>{item.author.fallback}</AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-1 min-w-0'>
                <p className='text-sm leading-none font-medium line-clamp-1'>{item.title}</p>
                <p className='text-muted-foreground text-xs'>{item.author.name}</p>
              </div>
              <div className='ml-auto font-medium text-sm whitespace-nowrap'>
                {item.views.toLocaleString()} views
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
