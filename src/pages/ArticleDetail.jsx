
import { useEffect, useMemo, useState } from "react";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const slugify = (str = "") =>
  str.toString().toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

const readingTime = (text = "") => Math.max(1, Math.ceil((text.trim().split(/\s+/).length || 0) / 200));

export default function ArticleDetail() {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id") || urlParams.get("articleId");
    if (!id) {
      setIsLoading(false);
      return;
    }
    setLoadError(null); // Clear previous errors
    // Netzwerkfehler freundlich behandeln
    KnowledgeArticle.filter({ id })
      .then((res) => setArticle(res?.[0] || null))
      .catch((e) => {
        console.error("ArticleDetail loading error:", e);
        setLoadError(e?.message || "Network Error");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const retryLoad = () => {
    setIsLoading(true);
    setLoadError(null);
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id") || urlParams.get("articleId");
    if (!id) { // Should ideally not happen if already loaded once
      setIsLoading(false);
      return;
    }
    KnowledgeArticle.filter({ id })
      .then((res) => setArticle(res?.[0] || null))
      .catch((e) => {
        console.error("ArticleDetail retry error:", e);
        setLoadError(e?.message || "Network Error");
      })
      .finally(() => setIsLoading(false));
  };

  const meta = useMemo(() => {
    if (!article?.content) return { minutes: 0, toc: [] };
    const minutes = readingTime(article.content);
    const toc = [];
    article.content.split("\n").forEach((line) => {
      const m = line.match(/^(#{1,3})\s+(.*)/);
      if (m) {
        const level = m[1].length;
        const text = m[2].trim();
        toc.push({ level, text, id: slugify(text) });
      }
    });
    return { minutes, toc };
  }, [article]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link kopiert!");
    } catch {
      // no-op
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-64 w-full mb-6 rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="glass-effect max-w-lg w-full p-6 text-center rounded-lg"> {/* Added rounded-lg for consistency */}
          <h2 className="text-white text-lg font-semibold mb-2">Artikel kann nicht geladen werden</h2>
          <p className="text-zinc-400 text-sm mb-4">Bitte prüfe deine Internetverbindung und versuche es erneut.</p>
          <Button onClick={retryLoad} className="grow-gradient bg-green-600 hover:bg-green-500 text-white">Erneut versuchen</Button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="glass-effect max-w-lg w-full text-center">
          <CardContent className="p-8">
            <h2 className="text-zinc-100 text-xl font-bold mb-2">Artikel nicht gefunden</h2>
            <p className="text-zinc-400">Der gewünschte Artikel ist nicht verfügbar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const created = article.created_date ? format(new Date(article.created_date), "dd.MM.yyyy", { locale: de }) : null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="glass-effect overflow-hidden">
            {article.cover_image_url && (
              <img src={article.cover_image_url} alt={article.title} className="w-full h-64 sm:h-80 object-cover" />
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-2xl sm:text-3xl">{article.title}</CardTitle>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 capitalize">{article.category}</Badge>
                {article.difficulty_level && (
                  <Badge className="bg-blue-500/20 text-blue-300 capitalize">{article.difficulty_level}</Badge>
                )}
                {Array.isArray(article.tags) &&
                  article.tags.slice(0, 6).map((t, i) => (
                    <Badge key={i} variant="outline" className="text-zinc-300">#{t}</Badge>
                  ))}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {created && <>Veröffentlicht am {created} · </>}
                {meta.minutes} Min. Lesezeit
              </div>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 id={slugify(String(props.children))} className="mt-8 mb-3 text-3xl font-bold" {...props} />,
                  h2: ({ node, ...props }) => <h2 id={slugify(String(props.children))} className="mt-8 mb-3 text-2xl font-bold" {...props} />,
                  h3: ({ node, ...props }) => <h3 id={slugify(String(props.children))} className="mt-6 mb-2 text-xl font-semibold" {...props} />,
                  p: (props) => <p className="text-zinc-300 leading-7 my-4" {...props} />,
                  ul: (props) => <ul className="list-disc pl-6 my-4 space-y-2" {...props} />,
                  ol: (props) => <ol className="list-decimal pl-6 my-4 space-y-2" {...props} />,
                  blockquote: (props) => <blockquote className="border-l-4 border-zinc-700 pl-4 italic text-zinc-300 my-4" {...props} />,
                  code: (props) => <code className="bg-zinc-900/80 px-1.5 py-0.5 rounded text-green-300" {...props} />,
                  a: (props) => <a className="text-green-400 underline hover:text-green-300" target="_blank" rel="noreferrer" {...props} />,
                  img: (props) => <img className="rounded-xl border border-zinc-800 my-4" {...props} />
                }}
              >
                {article.content || ""}
              </ReactMarkdown>

              <div className="mt-6 flex gap-2">
                <Button onClick={handleShare} className="bg-green-600 hover:bg-green-500">Link kopieren</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky TOC */}
        <aside className="lg:col-span-1">
          <Card className="glass-effect sticky top-20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Inhalt</CardTitle>
            </CardHeader>
            <CardContent>
              {meta.toc.length === 0 ? (
                <p className="text-zinc-400 text-sm">Keine Überschriften gefunden.</p>
              ) : (
                <nav className="space-y-1">
                  {meta.toc.map((item, idx) => (
                    <a
                      key={idx}
                      href={`#${item.id}`}
                      className={`block px-2 py-1 rounded-lg text-sm hover:bg-zinc-800/60 text-zinc-300 ${
                        item.level === 1 ? "font-semibold" : item.level === 2 ? "ml-2" : "ml-4"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
