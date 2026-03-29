
const badgeVariants = {
  default: "bg-zinc-800 hover:bg-zinc-800/80 border-transparent text-zinc-100",
  secondary: "bg-zinc-100 hover:bg-zinc-100/80 border-transparent text-zinc-900",
  destructive: "bg-red-500 hover:bg-red-500/80 border-transparent text-zinc-100",
  outline: "text-zinc-100 border border-zinc-800",
}

const Badge = ({ className, variant = "default", ...props }) => {
  const classes = [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
    badgeVariants[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props} />
  )
}

export { Badge }