import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Link as LinkIcon, X } from 'lucide-react';

export default function ProfilePortfolio({ portfolio }) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
        <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">Noch keine Portfolio-Einträge</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {portfolio.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedItem(item)}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-zinc-900 border border-zinc-800 hover:border-green-500/50 transition-all"
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : item.type === 'video' ? (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <Video className="w-12 h-12 text-zinc-600" />
              </div>
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center p-4">
                <LinkIcon className="w-12 h-12 text-zinc-600" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-semibold line-clamp-1">
                  {item.title}
                </p>
              </div>
            </div>

            {item.type === 'video' && (
              <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                <Video className="w-4 h-4 text-white" />
              </div>
            )}
            {item.type === 'link' && (
              <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                <LinkIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-white hover:text-green-500 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full"
            >
              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full h-auto rounded-2xl max-h-[80vh] object-contain"
                />
              ) : selectedItem.type === 'video' ? (
                <video
                  src={selectedItem.url}
                  controls
                  className="w-full h-auto rounded-2xl max-h-[80vh]"
                />
              ) : (
                <div className="bg-zinc-900 rounded-2xl p-8 text-center">
                  <LinkIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 underline text-lg"
                  >
                    Link öffnen
                  </a>
                </div>
              )}

              <div className="mt-4 text-center">
                <h3 className="text-white text-xl font-bold mb-2">{selectedItem.title}</h3>
                {selectedItem.description && (
                  <p className="text-zinc-400">{selectedItem.description}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}