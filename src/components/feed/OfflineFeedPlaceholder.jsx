import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineFeedPlaceholder({ onRetry }) {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Card className="glass-effect border-red-500/20 mb-6">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center">
            <WifiOff className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-semibold text-lg">Keine Verbindung</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Du bist offline oder der Server ist vorübergehend nicht erreichbar. Der Feed wird nicht geladen, um Fehler zu vermeiden.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => {
                  if (typeof onRetry === "function") onRetry();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeletons for posts */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-effect p-4 rounded-xl border border-zinc-800/50">
            <div className="h-4 w-40 bg-zinc-800 rounded mb-3 animate-pulse" />
            <div className="w-full aspect-video bg-zinc-900 rounded-lg animate-pulse" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}