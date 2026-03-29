import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

function initialsFromNameOrEmail(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (!email) return "?";
  return email[0].toUpperCase();
}

export default function ChatSidebar({
  conversations = [],
  currentUser,
  selectedId,
  onSelect,
  onNewConversation,
  onSearch,
  search
}) {
  return (
    <aside className="h-full flex flex-col bg-zinc-950/70 border-r border-zinc-800/60">
      <div className="p-3 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-zinc-900/70 border-zinc-800 pl-7"
          />
        </div>
        <Button onClick={onNewConversation} className="bg-green-600 hover:bg-green-500" size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-zinc-400">Keine Konversationen</div>
        ) : (
          conversations.map((c) => {
            const unread = (c.unread_counts && currentUser?.email && c.unread_counts[currentUser.email]) || 0;
            const title = c.is_group ? (c.name || "Gruppe") : (c.other_display || "Direktnachricht");
            const avatarText = initialsFromNameOrEmail(title, (c.other_email || c.name));
            const preview = c.last_message_preview || "Keine Nachrichten";
            const ts = c.last_message_timestamp ? formatDistanceToNow(new Date(c.last_message_timestamp), { addSuffix: true, locale: de }) : "";

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b border-zinc-900/60 hover:bg-zinc-900/60 transition ${
                  selectedId === c.id ? "bg-zinc-900/70" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-green-600/20 text-green-300 flex items-center justify-center font-bold">
                  {avatarText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-100 font-medium truncate">{title}</p>
                    <span className="text-xs text-zinc-500 ml-2">{ts}</span>
                  </div>
                  <p className={`text-sm truncate ${unread > 0 ? "text-zinc-100 font-medium" : "text-zinc-400"}`}>
                    {preview}
                  </p>
                </div>
                {unread > 0 && (
                  <div className="min-w-6 h-6 px-2 rounded-full bg-green-600 text-white text-xs font-semibold flex items-center justify-center">
                    {unread}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}