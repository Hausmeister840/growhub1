import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, navigateToLogin } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/Feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-7 space-y-6 shadow-2xl">
        <div className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Willkommen bei GrowHub</h1>
          <p className="text-sm text-zinc-400">
            Melde dich online an oder erstelle dein Konto - schnell wie bei TikTok.
          </p>
        </div>

        <Button
          onClick={navigateToLogin}
          className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-zinc-200"
        >
          Anmelden / Registrieren
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <button
          onClick={() => navigate('/Feed')}
          className="w-full h-11 rounded-xl border border-zinc-700 text-sm font-medium hover:bg-zinc-900 transition-colors"
        >
          Erstmal ohne Konto ansehen
        </button>
      </div>
    </div>
  );
}
