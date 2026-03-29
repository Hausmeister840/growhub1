import { AlertTriangle, Copy, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const envTemplate = `VITE_BASE44_APP_ID=DEINE_APP_ID
VITE_BASE44_BACKEND_URL=https://DEIN-BACKEND
BASE44_LEGACY_SDK_IMPORTS=true`;

export default function MissingConfigScreen() {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envTemplate);
      toast.success("Env-Vorlage kopiert");
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl md:text-2xl font-semibold">Base44-Konfiguration fehlt</h1>
        </div>

        <p className="text-zinc-300 mb-4">
          Die App ist gestartet, aber ohne Backend-Parameter kann sie keine echten Daten laden.
          Deshalb siehst du leere Feeds/Listen.
        </p>

        <ol className="list-decimal ml-5 space-y-2 text-zinc-200 mb-5">
          <li>Erstelle im Projekt eine Datei <code>.env.local</code>.</li>
          <li>Fuge die folgenden Werte ein (deine echten Base44-Daten):</li>
        </ol>

        <div className="rounded-lg border border-zinc-800 bg-black/70 p-4 text-sm overflow-x-auto">
          <pre>{envTemplate}</pre>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 hover:bg-green-700 px-3 py-2 text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            Vorlage kopieren
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 hover:bg-zinc-800 px-3 py-2 text-sm font-medium"
          >
            <RefreshCcw className="w-4 h-4" />
            Neu laden
          </button>
        </div>
      </div>
    </div>
  );
}
