
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Brain } from "lucide-react"; // Updated icons

export default function EmptyState({ onShowAgents }) { // Changed prop name
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-zinc-950 to-zinc-900">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-zinc-400" /> {/* Changed icon */}
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-3"> {/* Updated heading */}
          Willkommen bei GrowHub Chat
        </h3>
        
        <p className="text-zinc-400 mb-8 leading-relaxed"> {/* Updated text */}
          Chatte mit anderen Growern oder lass dich von unseren KI-Experten beraten. 
          Wähle eine Konversation links aus oder starte etwas Neues.
        </p>

        <div className="space-y-3">
          {/* ✅ NEW: Prominent Agent Chat Button */}
          <Button
            onClick={onShowAgents} // Uses the new prop
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3"
          >
            <Brain className="w-5 h-5 mr-3" /> {/* New icon */}
            🌱 Mit Grow-Meister chatten
          </Button>

          <div className="text-center text-zinc-500 text-sm py-2">
            oder
          </div>

          <Button
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 py-3"
            // No onClick handler specified in the outline for this button
          >
            <Users className="w-5 h-5 mr-3" />
            Community-Chat starten
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            💡 Tipp: Der Grow-Meister kann deine Tagebücher analysieren und personalisierte Ratschläge geben
          </p>
        </div>
      </div>
    </div>
  );
}
