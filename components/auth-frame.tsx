import { Logo } from "./brand";
import { FloatingShapes } from "./floating-shapes";

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <FloatingShapes />
        <Logo href="/" className="relative" />
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="mt-3 text-zinc-400">{subtitle}</p>
        </div>
        <p className="relative text-xs text-zinc-500">Play · Learn · Win</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="lg:hidden">
          <Logo href="/" />
        </div>
        {children}
      </div>
    </div>
  );
}
