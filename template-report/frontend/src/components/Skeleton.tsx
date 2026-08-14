type Props = {
  className?: string;
};

/** Loading skeleton blocks for report layout. */
export function SkeletonBlock({ className = "" }: Props) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6" aria-busy="true" aria-label="报表加载中">
      <SkeletonBlock className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <SkeletonBlock className="h-80 lg:col-span-3" />
        <SkeletonBlock className="h-80 lg:col-span-2" />
      </div>
      <SkeletonBlock className="h-64 w-full" />
    </div>
  );
}
