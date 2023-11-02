"use client";
import { Skeleton } from "@/components/ui/skeleton";
import useStore from "@/store";
type CompProps = {};

export default function Loading({}: CompProps) {
  const loading = useStore((state) => state.loading);

  if (!loading) {
    return null;
  }
  return (
    <div className="flex flex-wrap">
      <Skeleton className="aspect-square" />
    </div>
  );
}
