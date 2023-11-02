"use client";
import useStore from "@/store";
type CompProps = {
  children: React.ReactNode;
};
export default function SuccessWrapper({ children }: CompProps) {
  const success = useStore((state) => state.success);

  if (!success) {
    return null;
  }
  return children;
}
