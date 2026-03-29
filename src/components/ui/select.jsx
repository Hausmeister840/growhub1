import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

// Shared context so Trigger <-> Content can talk
const SelectContext = React.createContext({});

const Select = ({ children, value, onValueChange, ...props }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ children, ...props }) => <div {...props}>{children}</div>;

const SelectValue = ({ placeholder, value: valueProp, ...props }) => {
  const { value } = React.useContext(SelectContext);
  const resolved = valueProp ?? value;
  return (
    <span className={joinClasses("block truncate", !resolved && "text-zinc-400")} {...props}>
      {resolved || placeholder}
    </span>
  );
};

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      ref={ref}
      type="button"
      className={joinClasses(
        "flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={() => setOpen(o => !o)}
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

// ── Desktop dropdown ──────────────────────────────────────────────────────────
const DesktopContent = ({ children, className }) => {
  const { open, setOpen, value, onValueChange } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className={joinClasses(
        "absolute top-full left-0 z-50 mt-1 max-h-96 min-w-[8rem] w-full overflow-auto rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-md",
        className
      )}>
        <div className="p-1">
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, { _selected: value, _onSelect: (v) => { onValueChange?.(v); setOpen(false); } })
              : child
          )}
        </div>
      </div>
    </>
  );
};

// ── Mobile drawer (vaul) ──────────────────────────────────────────────────────
const MobileDrawerContent = ({ children, className, title }) => {
  const { open, setOpen, value, onValueChange } = React.useContext(SelectContext);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-zinc-900 border-zinc-800 text-white">
        {title && (
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-white text-sm font-semibold">{title}</DrawerTitle>
          </DrawerHeader>
        )}
        <div className="overflow-y-auto max-h-[55dvh] p-2 pb-[max(8px,env(safe-area-inset-bottom))]">
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  _selected: value,
                  _onSelect: (v) => { onValueChange?.(v); setOpen(false); },
                  _mobile: true,
                })
              : child
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// ── Adaptive SelectContent ────────────────────────────────────────────────────
const SelectContent = React.forwardRef(({ className, children, title, ...props }, ref) => {
  const [mobile, setMobile] = React.useState(() => isMobile());

  React.useEffect(() => {
    const update = () => setMobile(isMobile());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (mobile) {
    return <MobileDrawerContent className={className} title={title}>{children}</MobileDrawerContent>;
  }
  return <DesktopContent className={className}>{children}</DesktopContent>;
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={joinClasses("py-1.5 pl-8 pr-2 text-sm font-semibold text-zinc-400", className)} {...props} />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef(({ className, children, value, _selected, _onSelect, _mobile, ...props }, ref) => {
  const isSelected = _selected === value;
  return (
    <div
      ref={ref}
      className={joinClasses(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-3 pl-10 pr-4 text-sm outline-none transition-colors",
        _mobile
          ? "text-white hover:bg-zinc-800 active:bg-zinc-700"
          : "hover:bg-zinc-800 hover:text-zinc-100",
        isSelected && "bg-green-500/10 text-green-400",
        className
      )}
      onClick={() => _onSelect?.(value)}
      {...props}
    >
      <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
        {isSelected && <Check className="h-4 w-4 text-green-400" />}
      </span>
      <span>{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={joinClasses("-mx-1 my-1 h-px bg-zinc-800", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}