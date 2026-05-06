"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="החלף מצב כהה / בהיר"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "btn-ghost h-10 w-10 !p-0 rounded-full",
        className,
      )}
    >
      {mounted ? (isDark ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} />}
    </button>
  );
}
