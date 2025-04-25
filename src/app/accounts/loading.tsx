import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Skeleton className="h-5 w-full max-w-md" />
      <div className="rounded-md border">
        <div className="grid grid-cols-4 h-12 items-center border-b px-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2 justify-self-end" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2 justify-self-end" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 h-14 items-center border-b last:border-b-0 px-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3 justify-self-end" />
            <Skeleton className="h-5 w-2/3" />
            <div className="flex justify-self-end">
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 