import { Loader2, Inbox } from 'lucide-react';
import ConversationItem from './ConversationItem';

export default function ConversationList({ 
  conversations, 
  isLoading, 
  selectedId,
  currentUser,
  allUsers,
  onSelect,
  totalCount = 0,
  filterActive = false,
}) {
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" aria-hidden />
      </div>
    );
  }

  if (conversations.length === 0) {
    const filteredOut = filterActive && totalCount > 0;
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-[280px]">
          <div className="w-16 h-16 bg-zinc-900/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800/60 shadow-lg shadow-black/40">
            <Inbox className="w-7 h-7 text-zinc-600" />
          </div>
          <h3 className="text-white font-semibold mb-1 text-[15px]">
            {filteredOut ? 'Keine Treffer' : 'Keine Chats'}
          </h3>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            {filteredOut
              ? 'Passe Suche oder Filter an — es gibt noch andere Unterhaltungen.'
              : 'Starte deine erste Unterhaltung mit der Community.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          currentUser={currentUser}
          allUsers={allUsers}
          onClick={() => onSelect(conversation.id)}
        />
      ))}
    </div>
  );
}