import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function MessageBubble({ message, isMine }) {
  const media = Array.isArray(message.media_urls) ? message.media_urls : [];

  return (
    <div className={`w-full flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          isMine ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-100"
        }`}
      >
        {message.content && (
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        )}

        {media.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {media.map((url, i) => {
              const isVid = /\.(mp4|webm|mov|avi)$/i.test(url);
              return (
                <div key={i} className="rounded-xl overflow-hidden bg-black/30">
                  {isVid ? (
                    <video src={url} controls className="w-full h-40 object-cover">
                      <track kind="captions" />
                    </video>
                  ) : (
                    <ImageWithFallback src={url} alt="Anhang" className="w-full h-40 object-cover" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}