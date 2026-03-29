import { useState } from 'react';
import { Share2, Copy, MessageCircle, Twitter, Facebook, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ShareButton({ post, iconOnly = false }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/PostThread?id=${post.id}`;
  const shareText = `${post.content?.substring(0, 100) || 'Schau dir diesen Post an'}...`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GrowHub Post',
          text: shareText,
          url: shareUrl
        });
        setShowMenu(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      setShowMenu(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link kopiert!');
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1500);
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
    setShowMenu(false);
  };

  const handleTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setShowMenu(false);
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank');
    setShowMenu(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size={iconOnly ? "icon" : "sm"}
        onClick={handleNativeShare}
        className="text-zinc-400 hover:text-white"
      >
        <Share2 className="w-5 h-5" />
        {!iconOnly && <span className="ml-2">Teilen</span>}
      </Button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end lg:items-center lg:justify-center"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-t-3xl lg:rounded-3xl p-6 w-full lg:max-w-md border-t lg:border border-zinc-800"
            >
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 lg:hidden" />
              
              <h3 className="text-xl font-bold text-white mb-6">Teilen</h3>

              <div className="space-y-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  {copied ? (
                    <Check className="w-6 h-6 text-green-500" />
                  ) : (
                    <Copy className="w-6 h-6 text-zinc-400" />
                  )}
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">
                      {copied ? 'Link kopiert!' : 'Link kopieren'}
                    </p>
                    <p className="text-sm text-zinc-500">In Zwischenablage kopieren</p>
                  </div>
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-green-500" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">WhatsApp</p>
                    <p className="text-sm text-zinc-500">Per WhatsApp teilen</p>
                  </div>
                </button>

                <button
                  onClick={handleTwitter}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <Twitter className="w-6 h-6 text-blue-400" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">Twitter/X</p>
                    <p className="text-sm text-zinc-500">Auf X teilen</p>
                  </div>
                </button>

                <button
                  onClick={handleFacebook}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <Facebook className="w-6 h-6 text-blue-500" />
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">Facebook</p>
                    <p className="text-sm text-zinc-500">Auf Facebook teilen</p>
                  </div>
                </button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowMenu(false)}
                className="w-full mt-4 border-zinc-700"
              >
                Abbrechen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}