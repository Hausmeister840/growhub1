import React, { useState } from "react";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Save, FileText } from "lucide-react";

const categories = ["growing", "strains", "equipment", "legal", "medical", "processing", "troubleshooting"];
const difficultyLevels = ["beginner", "intermediate", "advanced"];

export default function CreateArticle() {
  const toast = useToast();
  const [user, setUser] = React.useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("growing");
  const [difficulty, setDifficulty] = useState("beginner");
  const [tags, setTags] = useState("");
  const [readTime, setReadTime] = useState(5);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Bitte anmelden, um einen Artikel zu erstellen.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.warning("Titel und Inhalt dürfen nicht leer sein.");
      return;
    }

    const payload = {
      title: title.trim(),
      content,
      category,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      difficulty_level: difficulty,
      read_time_minutes: Number(readTime) || 5,
      author_email: user.email,
      cover_image_url: coverImageUrl || undefined,
      featured: false,
      expert_verified: false,
    };

    await KnowledgeArticle.create(payload);
    toast.success("Artikel veröffentlicht!");
    window.location.href = createPageUrl("Knowledge");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Artikel verfassen</h1>
        </div>

        <Card className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                placeholder="Titel des Artikels"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Schwierigkeitsgrad" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {difficultyLevels.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min="1"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Lesezeit (Min.)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Tags (kommagetrennt: indoor,hydro,beginner)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white sm:col-span-2"
                />
                <div className="flex gap-2">
                  <ImageIcon className="w-5 h-5 text-zinc-400 mt-2" />
                  <Input
                    placeholder="Cover-Bild URL (optional)"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-zinc-800">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => window.history.back()}>
                  Abbrechen
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  Veröffentlichen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}