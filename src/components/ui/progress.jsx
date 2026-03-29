import React from "react";

const Progress = React.forwardRef(({ className, value = 0, max = 100, ...props }, ref) => {
  // Ensure value is between 0 and max
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;

  return (
    <div
      ref={ref}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-zinc-800/50 ${className || ''}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-in-out"
        style={{ 
          transform: `translateX(-${100 - percentage}%)`,
          transition: "transform 0.3s ease-in-out"
        }}
      />
    </div>
  );
});

Progress.displayName = "Progress";

export { Progress };