"use client";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useStore from "@/store";
type CompProps = {};
export default function Error({}: CompProps) {
  const error = useStore((state) => state.error);

  if (!error) {
    return null;
  }
  return (
    <Alert variant="destructive">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Unknown Error Occurred</AlertDescription>
    </Alert>
  );
}
