import { useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam oder irreführend' },
  { id: 'harassment', label: 'Belästigung oder Mobbing' },
  { id: 'inappropriate', label: 'Unangemessener Inhalt' },
  { id: 'violence', label: 'Gewalt oder Gefahr' },
  { id: 'hate', label: 'Hassrede' },
  { id: 'misinformation', label: 'Falschinformationen' },
  { id: 'other', label: 'Sonstiges' }
];

export default function ReportModal({ post, isOpen, onClose }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSnap, setActiveSnap] = useState(0.65);

  if (!post) return null;

  const handleSubmit = async () => {
    if (!selectedReason) { toast.error('Bitte wähle einen Grund'); return; }
    setIsSubmitting(true);
    try {
      await base44.entities.Report.create({
        post_id: post.id,
        reported_by: (await base44.auth.me()).email,
        reason: selectedReason,
        details: details,
        status: 'pending'
      });
      toast.success('Meldung eingereicht. Danke!');
      onClose();
    } catch {
      toast.error('Fehler beim Melden');
    } finally { setIsSubmitting(false); }
  };

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
      snapPoints={[0.65, 1]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={setActiveSnap}
      fadeFromIndex={1}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[201] flex flex-col rounded-t-3xl bg-zinc-900 border-t border-zinc-800 outline-none"
          style={{ maxHeight: activeSnap === 1 ? '100vh' : '65vh' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-zinc-600" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800/60">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <DrawerPrimitive.Title className="text-lg font-bold text-white">Post melden</DrawerPrimitive.Title>
              <p className="text-sm text-zinc-400">Warum meldest du diesen Post?</p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4" style={{ minHeight: 0 }}>
            <div className="space-y-2">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all active:scale-[0.98] ${
                    selectedReason === reason.id
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Zusätzliche Details (optional)..."
              className="bg-zinc-800/50 border-zinc-700"
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-zinc-800/60 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <DrawerPrimitive.Close asChild>
              <Button variant="outline" className="border-zinc-700">Abbrechen</Button>
            </DrawerPrimitive.Close>
            <Button onClick={handleSubmit} disabled={isSubmitting || !selectedReason} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Senden...</> : 'Melden'}
            </Button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}