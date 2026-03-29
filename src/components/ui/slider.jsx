"use client"

import React from 'react';

const Slider = React.forwardRef(({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  // The component expects `value` as an array, but standard range input uses a single number.
  const internalValue = Array.isArray(value) ? value[0] : 0;

  const handleChange = (event) => {
    const newValue = Number(event.target.value);
    if (onValueChange) {
      // The onValueChange handler expects an array back.
      onValueChange([newValue]);
    }
  };

  // Calculate the progress percentage for the track background.
  const progress = ((internalValue - min) / (max - min)) * 100;

  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onChange={handleChange}
        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer group"
        style={{
            // Use a gradient to show the progress on the track.
            background: `linear-gradient(to right, #22c55e ${progress}%, #3f3f46 ${progress}%)`
        }}
        {...props}
      />
      {/* Injecting custom styles for the slider thumb, which is hard to style with Tailwind. */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fafafa;
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid #22c55e;
          margin-top: -6px; /* Vertically align thumb with the track */
          transition: background-color 0.2s ease;
        }

        input[type=range]:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.3);
        }

        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #fafafa;
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid #22c55e;
        }

        input[type=range]:focus::-moz-range-thumb {
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.3);
        }
      `}</style>
    </div>
  );
});

Slider.displayName = 'Slider';

export { Slider };