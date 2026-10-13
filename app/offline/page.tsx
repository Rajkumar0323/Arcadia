import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-violet-300">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-zinc-400">
          Reconnect to the internet to keep playing. Your progress is saved on the server.
        </p>
        <a href="/dashboard" className="inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold">
          Try again
        </a>
      </div>
    </div>
  );
}
