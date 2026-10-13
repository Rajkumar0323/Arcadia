"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const START_EVENT = "arcade:nav-start";

/** Call right before router.push/replace so programmatic navigation shows the progress bar too. */
export function startNavProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

/** Thin top bar that appears the instant a link is clicked and stays until the new page is on screen. */
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => setActive(false), [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), 15_000); // never get stuck if a navigation is cancelled
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
    };
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="nav-progress"
          role="progressbar"
          aria-label="Loading page"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 shadow-[0_0_12px_rgba(217,70,239,0.8)]"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.9, transition: { duration: 6, ease: [0.1, 0.8, 0.2, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.25 } }}
        />
      )}
    </AnimatePresence>
  );
}
