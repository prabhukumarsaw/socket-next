import { Skeleton } from "@/components/ui/skeleton"
import PageContainer from "@/components/layout/page-container"
import { Separator } from "@/components/ui/separator"

export default function Loading() {
  return (
    <PageContainer>
      <div className="flex flex-col space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Separator />
        <div className="space-y-6">
          <Skeleton className="h-10 w-[400px]" />
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-[250px]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
