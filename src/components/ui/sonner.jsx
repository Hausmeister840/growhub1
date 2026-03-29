"use client";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    (<Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast gh-sheet group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_18px_45px_rgba(0,0,0,0.45)] rounded-xl px-4 py-3",
          title: "text-sm font-semibold tracking-tight",
          description: "group-[.toast]:text-zinc-300 text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-zinc-100 group-[.toast]:rounded-lg",
          success: "border-emerald-400/35",
          error: "border-red-400/35",
          warning: "border-amber-400/35",
          info: "border-blue-400/35",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
