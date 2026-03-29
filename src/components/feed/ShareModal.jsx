import { useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Link as LinkIcon, MessageCircle, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareModal({ isOpen, onClose, post }) {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const shareUrl = `${window.location.origin}/PostThread?id=${post.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Fehler beim Kopieren');
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) { handleCopyLink(); return; }
    try {
      await navigator.share({
        title: post.content?.substring(0, 50) || 'GrowHub Post',
        text: post.content || 'Schau dir diesen Post an!',
        url: shareUrl
      });
    } catch (error) {
      if (error.name !== 'AbortError') console.error('Share error:', error);
    }
  };

  return (
    <DrawerPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80" />
        <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-[101] rounded-t-3xl bg-zinc-900 border-t border-zinc-800 outline-none">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-zinc-600" />
          </div>

          <DrawerPrimitive.Title className="px-5 pb-4 pt-1 text-lg font-bold text-white">
            Post teilen
          </DrawerPrimitive.Title>

          <div className="px-5 pb-6 space-y-3">
            {/* Native Share (Mobile) */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button onClick={handleNativeShare} className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all text-left active:scale-[0.98]">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Teilen</p>
                  <p className="text-sm text-zinc-400">Über andere Apps teilen</p>
                </div>
              </button>
            )}

            {/* Copy Link */}
            <button onClick={handleCopyLink} className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all text-left active:scale-[0.98]">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                {copied ? <Check className="w-6 h-6 text-green-500" /> : <LinkIcon className="w-6 h-6 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{copied ? 'Link kopiert!' : 'Link kopieren'}</p>
                <p className="text-sm text-zinc-400 truncate">{shareUrl}</p>
              </div>
            </button>

            {/* Share via Message */}
            <button
              onClick={() => { onClose(); toast.info('Nachrichtenfunktion kommt bald!'); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all text-left active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Per Nachricht senden</p>
                <p className="text-sm text-zinc-400">An GrowHub Freunde</p>
              </div>
            </button>
          </div>

          {/* Safe area padding */}
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}