import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

const mapVariant = (variant) => {
  const v = (variant || "").toString().toLowerCase();
  if (v === "destructive" || v === "error") return "error";
  if (v === "success") return "success";
  if (v === "warning" || v === "warn") return "warning";
  return "info";
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");

  const callable = useMemo(() => {
    const fn = (arg, options = {}) => {
      if (typeof arg === "object" && arg !== null) {
        const { title, description, variant, type, duration } = arg;
        const message = title || description || "";
        return ctx.addToast({ type: mapVariant(type || variant), message, description, duration });
      }
      const message = String(arg ?? "");
      return ctx.addToast({
        type: mapVariant(options.type),
        message,
        description: options.description,
        duration: options.duration,
      });
    };
    fn.success = (message, options = {}) => ctx.addToast({ type: "success", message, ...options });
    fn.error = (message, options = {}) => ctx.addToast({ type: "error", message, ...options });
    fn.info = (message, options = {}) => ctx.addToast({ type: "info", message, ...options });
    fn.warning = (message, options = {}) => ctx.addToast({ type: "warning", message, ...options });
    fn.addToast = ctx.addToast;
    fn.removeToast = ctx.removeToast;
    fn.toast = fn;
    return fn;
  }, [ctx]);

  return callable;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", message = "", description = "", duration = 5000 }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message, description, duration }]);
      
      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration);
      }
      
      return id;
    },
    [removeToast]
  );

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const colors = (type) => {
    switch (type) {
      case "success":
        return "border-green-500/40 bg-green-500/10";
      case "error":
        return "border-red-500/40 bg-red-500/10";
      case "warning":
        return "border-yellow-500/40 bg-yellow-500/10";
      default:
        return "border-blue-500/40 bg-blue-500/10";
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[9999] space-y-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 250, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 250, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`p-4 rounded-2xl border backdrop-blur-xl ${colors(t.type)} shadow-2xl`}
            >
              <div className="flex items-start gap-3">
                {getIcon(t.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold leading-tight">{t.message}</p>
                  {t.description && (
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                  aria-label="Toast schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};