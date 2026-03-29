import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

export const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Bestätigung erforderlich", 
  message = "Sind Sie sicher?", 
  confirmText = "Bestätigen", 
  cancelText = "Abbrechen",
  type = "danger",
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger': return {
        icon: <Trash2 className="w-6 h-6 text-red-400" />,
        confirmButton: "bg-red-600 hover:bg-red-700",
        iconBg: "bg-red-600"
      };
      case 'warning': return {
        icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
        confirmButton: "bg-yellow-600 hover:bg-yellow-700", 
        iconBg: "bg-yellow-600"
      };
      default: return {
        icon: <AlertTriangle className="w-6 h-6 text-blue-400" />,
        confirmButton: "grow-gradient",
        iconBg: "bg-blue-600"
      };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center pb-4">
              <div className={`w-12 h-12 rounded-full ${colors.iconBg} flex items-center justify-center mx-auto mb-4`}>
                {colors.icon}
              </div>
              <CardTitle className="text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-zinc-300">{message}</p>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {cancelText}
                </Button>
                <Button 
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={colors.confirmButton}
                >
                  {isLoading ? "Wird verarbeitet..." : confirmText}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};