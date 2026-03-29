import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GrowMasterChat from './GrowMasterChat';

export default function GrowAIChat({ user, diary, onClose }) {
  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="flex-shrink-0 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Grow Master</h2>
            {diary && (
              <p className="text-sm text-zinc-400">{diary.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <GrowMasterChat diaryId={diary?.id} currentUser={user} />
      </div>
    </div>
  );
}