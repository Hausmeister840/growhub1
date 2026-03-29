import * as React from "react"

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const Tabs = ({ defaultValue, value, onValueChange, orientation = "horizontal", className, children, ...props }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value ?? internalValue
  
  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <div
      data-orientation={orientation}
      className={classNames("w-full", className)}
      {...props}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, {
          currentValue,
          onValueChange: handleValueChange,
          orientation
        }) : child
      )}
    </div>
  )
}

const TabsList = React.forwardRef(({ className, currentValue, onValueChange, orientation, children, ...props }, ref) => (
  <div
    ref={ref}
    className={classNames(
      "inline-flex items-center justify-center rounded-lg bg-zinc-900 p-1 text-zinc-400",
      orientation === "vertical" && "flex-col h-auto",
      className
    )}
    {...props}
  >
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child, { currentValue, onValueChange }) : child
    )}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, children, value, currentValue, onValueChange, ...props }, ref) => {
  const isActive = currentValue === value
  
  return (
    <button
      ref={ref}
      type="button"
      className={classNames(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-zinc-800 text-zinc-100 shadow"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, children, value, currentValue, onValueChange, orientation, ...props }, ref) => {
  if (currentValue !== value) return null
  
  return (
    <div
      ref={ref}
      className={classNames(
        "mt-2 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }