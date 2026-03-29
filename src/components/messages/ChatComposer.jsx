import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { UploadFile } from "@/integrations/Core";

export default function ChatComposer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  const handleChoose = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      if (file_url) {
        setAttachments((prev) => [...prev, file_url]);
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;
    await onSend({ content: text.trim(), media_urls: attachments });
    setText("");
    setAttachments([]);
  };

  return (
    <div className="p-3 border-t border-zinc-800 bg-zinc-950/70">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((url, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 truncate max-w-[200px]">
              {url.split("/").pop()}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleChoose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" disabled={disabled || isUploading}>
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        <Input
          placeholder="Nachricht schreiben…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 bg-zinc-900/70 border-zinc-800 text-zinc-100"
          disabled={disabled}
        />
        <Button onClick={handleSend} className="bg-green-600 hover:bg-green-500" disabled={disabled || (text.trim() === "" && attachments.length === 0)}>
          <Send className="w-4 h-4 mr-1" />
          Senden
        </Button>
      </div>
    </div>
  );
}