
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Camera, Target, Calendar, FlaskConical, TrendingUp, Sparkles } from "lucide-react";
import CannabisAI from "@/components/ai/CannabisAI";
import { User } from "@/entities/User";

const features = [
  { id: "plant_doctor", title: "Pflanzen‑Doktor", desc: "Diagnose per Foto", icon: Camera, color: "from-green-500/20 to-emerald-500/20", badge: "NEU" },
  { id: "grow_advisor", title: "Grow‑Berater", desc: "Personalisierte Tipps", icon: TrendingUp, color: "from-blue-500/20 to-cyan-500/20" },
  { id: "strain_matcher", title: "Strain‑Finder", desc: "Passende Sorten", icon: Target, color: "from-purple-500/20 to-pink-500/20" },
  { id: "harvest_predictor", title: "Harvest‑Timer", desc: "Erntezeitpunkt", icon: Calendar, color: "from-orange-500/20 to-red-500/20" },
  { id: "nutrient_calculator", title: "Nährstoff‑Rechner", desc: "Perfekte Mischung", icon: FlaskConical, color: "from-teal-500/20 to-green-500/20" }
];

export default function AIProfileAssistant({ currentUser: userProp }) {
  const [currentUser, setCurrentUser] = useState(userProp || null);
  const [showAI, setShowAI] = useState(false);
  const [initialFeature, setInitialFeature] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      if (!userProp) {
        try {
          const me = await User.me();
          if (mounted) setCurrentUser(me);
        } catch {
          // not logged in or network issue
        }
      }
    };
    loadMe();
    return () => { mounted = false; };
  }, [userProp]);

  const openAI = (feature = null) => {
    setInitialFeature(feature);
    setShowAI(true);
  };

  return (
    <>
      <Card className="bg-zinc-900/60 border-zinc-800/60 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-600 to-green-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-zinc-100">KI‑Assistent für dein Profil</CardTitle>
          </div>
          <Button onClick={() => openAI(null)} className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500">
            <Sparkles className="w-4 h-4 mr-2" />
            KI öffnen
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => openAI(f.id)}
                className="text-left rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors p-4 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800/60 group-hover:bg-zinc-800 transition-colors">
                    <Icon className="w-5 h-5 text-zinc-100" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100">{f.title}</h4>
                      {f.badge && <Badge className="bg-green-500/20 text-green-400">{f.badge}</Badge>}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{f.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Datenschutzhinweis */}
      <div className="text-xs text-zinc-400 mt-2">
        Hinweis: Hochgeladene Bilder und Texte dienen ausschließlich der Analyse innerhalb der App. Bitte keine persönlichen Daten im Bild hochladen.
      </div>

      {showAI && (
        <CannabisAI
          currentUser={currentUser}
          onClose={() => {
            setShowAI(false);
            setInitialFeature(null);
          }}
          initialFeature={initialFeature}
        />
      )}
    </>
  );
}
