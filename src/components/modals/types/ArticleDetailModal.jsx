import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ArticleDetailModal({ data }) {
  const contentRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const minutes = useMemo(() => {
    const words = (data?.content || "").trim().split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  }, [data?.content]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setProgress(p);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative">
      <div className="h-1 w-full bg-zinc-800/60">
        <div className="h-1 bg-green-500" style={{ width: `${progress}%` }} />
      </div>
      {data?.cover_image_url && (
        <img src={data.cover_image_url} alt={data.title} className="w-full h-60 sm:h-80 object-cover" />
      )}
      <div className="p-4 sm:p-6">
        <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">{data?.title}</h3>
        <div className="text-zinc-400 text-xs mb-4">{minutes} Min. Lesezeit • {data?.category}</div>
        <div ref={contentRef} className="prose prose-invert max-w-none max-h-[55vh] overflow-y-auto custom-scrollbar">
          <ReactMarkdown>{data?.content || ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}