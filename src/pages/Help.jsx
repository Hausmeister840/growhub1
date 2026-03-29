import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, ChevronDown, ChevronRight, Search, MessageCircle,
  Mail, Book, Smartphone, Shield,
  Leaf, Users, ShoppingBag, MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const FAQ_CATEGORIES = [
  {
    id: 'getting_started',
    title: 'Erste Schritte',
    icon: Smartphone,
    questions: [
      { q: 'Wie erstelle ich ein Konto?', a: 'Klicke auf "Anmelden" und folge den Anweisungen. Du kannst dich mit E-Mail oder Google anmelden.' },
      { q: 'Wie bearbeite ich mein Profil?', a: 'Gehe zu deinem Profil und klicke auf "Bearbeiten". Dort kannst du dein Bild, Namen und Bio ändern.' },
      { q: 'Wie poste ich meinen ersten Beitrag?', a: 'Klicke auf das "+" Symbol oder "Post erstellen". Du kannst Text, Bilder und Videos hinzufügen.' }
    ]
  },
  {
    id: 'growing',
    title: 'Grow Tagebücher',
    icon: Leaf,
    questions: [
      { q: 'Wie starte ich ein Grow-Tagebuch?', a: 'Gehe zu "Grows" und klicke auf "Neues Tagebuch". Wähle deine Sorte und fülle die Details aus.' },
      { q: 'Wie füge ich einen Eintrag hinzu?', a: 'Öffne dein Tagebuch und klicke auf "Neuer Eintrag". Füge Fotos, Messwerte und Notizen hinzu.' },
      { q: 'Kann ich mein Tagebuch privat halten?', a: 'Ja! In den Tagebuch-Einstellungen kannst du die Sichtbarkeit auf "Privat" setzen.' }
    ]
  },
  {
    id: 'social',
    title: 'Social Features',
    icon: Users,
    questions: [
      { q: 'Wie folge ich anderen Nutzern?', a: 'Besuche das Profil des Nutzers und klicke auf "Folgen".' },
      { q: 'Wie erstelle ich eine Story?', a: 'Klicke auf dein Profilbild in der Story-Leiste oder gehe zu "Story erstellen".' },
      { q: 'Wie sende ich eine Nachricht?', a: 'Gehe zu "Nachrichten" und starte eine neue Konversation oder klicke auf das Nachrichten-Symbol im Profil.' }
    ]
  },
  {
    id: 'marketplace',
    title: 'Marktplatz',
    icon: ShoppingBag,
    questions: [
      { q: 'Wie stelle ich ein Produkt ein?', a: 'Gehe zum Marktplatz und klicke auf "Verkaufen". Fülle das Formular mit Bildern und Details aus.' },
      { q: 'Ist der Marktplatz sicher?', a: 'Wir empfehlen, nur mit verifizierten Nutzern zu handeln und bei Treffen vorsichtig zu sein.' },
      { q: 'Welche Gebühren fallen an?', a: 'Der Marktplatz ist aktuell kostenlos. Wir nehmen keine Provision.' }
    ]
  },
  {
    id: 'map',
    title: 'Karte & Standorte',
    icon: MapPin,
    questions: [
      { q: 'Was zeigt die Karte an?', a: 'Clubs, Shops, Ärzte, Apotheken und Schutzzonen in deiner Nähe.' },
      { q: 'Was sind No-Go-Zonen?', a: 'Bereiche um Schulen, Kindergärten etc., in denen der Konsum nicht erlaubt ist.' },
      { q: 'Wie füge ich einen neuen Ort hinzu?', a: 'Kontaktiere uns mit den Details und wir prüfen die Aufnahme.' }
    ]
  },
  {
    id: 'safety',
    title: 'Sicherheit & Datenschutz',
    icon: Shield,
    questions: [
      { q: 'Wie schütze ich mein Konto?', a: 'Verwende ein starkes Passwort und melde verdächtige Aktivitäten.' },
      { q: 'Wie melde ich unangemessene Inhalte?', a: 'Klicke auf die drei Punkte bei jedem Beitrag und wähle "Melden".' },
      { q: 'Werden meine Daten verkauft?', a: 'Nein! Wir verkaufen keine persönlichen Daten. Siehe unsere Datenschutzerklärung.' }
    ]
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const navigate = useNavigate();

  const filteredCategories = searchQuery
    ? FAQ_CATEGORIES.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : FAQ_CATEGORIES;

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Hilfe & Support</h1>
              <p className="text-sm text-zinc-400">Wie können wir dir helfen?</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Frage suchen..."
              className="pl-10 bg-zinc-900 border-zinc-800"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => navigate(createPageUrl('Knowledge'))}
            className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all text-left"
          >
            <Book className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-white font-semibold">Wissensdatenbank</p>
            <p className="text-sm text-zinc-400">Artikel & Guides</p>
          </button>
          <button
            onClick={() => toast.info('Kontaktformular kommt bald')}
            className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all text-left"
          >
            <Mail className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-white font-semibold">Kontakt</p>
            <p className="text-sm text-zinc-400">Schreib uns</p>
          </button>
        </div>

        {/* FAQ Categories */}
        <h2 className="text-lg font-bold text-white mb-4">Häufige Fragen</h2>
        <div className="space-y-3">
          {filteredCategories.map(category => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id} className="bg-zinc-900 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-green-500" />
                    <span className="text-white font-semibold">{category.title}</span>
                    <span className="text-xs text-zinc-500">({category.questions.length})</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {category.questions.map((faq, idx) => {
                          const isQExpanded = expandedQuestion === `${category.id}-${idx}`;

                          return (
                            <div key={idx} className="bg-zinc-800/50 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedQuestion(isQExpanded ? null : `${category.id}-${idx}`)}
                                className="w-full flex items-center justify-between p-3 text-left"
                              >
                                <span className="text-zinc-200 text-sm">{faq.q}</span>
                                <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ml-2 ${isQExpanded ? 'rotate-90' : ''}`} />
                              </button>
                              
                              <AnimatePresence>
                                {isQExpanded && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="px-3 pb-3 text-sm text-zinc-400">{faq.a}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div className="mt-8 p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-2xl border border-green-500/20">
          <h3 className="text-lg font-bold text-white mb-2">Keine Antwort gefunden?</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Unser Support-Team hilft dir gerne weiter.
          </p>
          <Button 
            onClick={() => toast.info('Support-Chat kommt bald!')}
            className="bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Support kontaktieren
          </Button>
        </div>
      </div>
    </div>
  );
}