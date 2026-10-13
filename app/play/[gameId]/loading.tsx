import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
