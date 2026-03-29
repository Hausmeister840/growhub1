import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Lock, Database, Cookie, UserCheck, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Datenschutzerklärung</h1>
              <p className="text-sm text-zinc-400">Stand: Dezember 2024</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Einleitung */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">1. Datenschutz auf einen Blick</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <p>
                Der Schutz deiner persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung 
                informiert dich über die Verarbeitung personenbezogener Daten bei der Nutzung von GrowHub.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 font-medium mb-2">🔐 Deine Rechte:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Auskunft über deine gespeicherten Daten</li>
                  <li>• Berichtigung unrichtiger Daten</li>
                  <li>• Löschung deiner Daten</li>
                  <li>• Datenübertragbarkeit</li>
                  <li>• Widerspruch gegen Datenverarbeitung</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Verantwortliche Stelle */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold">2. Verantwortliche Stelle</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="font-semibold text-white mb-2">GrowHub</p>
                <p>[Name des Verantwortlichen]</p>
                <p>[Adresse]</p>
                <div className="flex items-center gap-2 mt-3">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <a href="mailto:datenschutz@growhub.de" className="text-green-400 hover:underline">
                    datenschutz@growhub.de
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Datenerfassung */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold">3. Welche Daten erfassen wir?</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">3.1 Registrierung und Login</h3>
                <p className="mb-2">Bei der Registrierung erfassen wir:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>E-Mail-Adresse</li>
                  <li>Benutzername</li>
                  <li>Profilbild (optional)</li>
                  <li>Biografie (optional)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3.2 Nutzungsdaten</h3>
                <p className="mb-2">Bei der Nutzung der App speichern wir:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Deine Posts, Kommentare und Likes</li>
                  <li>Grow-Tagebücher und Einträge</li>
                  <li>Stories (24h Speicherung)</li>
                  <li>Interaktionen (Follows, Reactions)</li>
                  <li>Lesezeichen und Favoriten</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3.3 Standortdaten</h3>
                <p>
                  Wenn du die Karten-Funktion nutzt, verarbeiten wir deinen Standort zur Anzeige 
                  von Cannabis-Locations und Schutzzonen. Die Standortdaten werden nur temporär 
                  verarbeitet und nicht dauerhaft gespeichert.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold">4. Cookies und Local Storage</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <p>Wir verwenden Cookies und Local Storage für folgende Zwecke:</p>
              <div className="space-y-3">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2">🔐 Essenziell (technisch notwendig)</h4>
                  <ul className="space-y-1 ml-2">
                    <li>• Session-Management (Login-Status)</li>
                    <li>• Altersprüfung (30 Tage Gültigkeit)</li>
                    <li>• Einstellungen (Theme, Sprache)</li>
                  </ul>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2">📊 Analyse (optional)</h4>
                  <p>Keine Tracking-Cookies von Drittanbietern</p>
                </div>
              </div>
            </div>
          </section>

          {/* Drittanbieter */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold">5. Drittanbieter-Dienste</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">5.1 Google OAuth</h3>
                <p>
                  Für die Anmeldung nutzen wir Google OAuth. Dabei werden deine E-Mail-Adresse 
                  und dein Name an Google übermittelt. Es gelten die{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                    Datenschutzbestimmungen von Google
                  </a>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">5.2 Leaflet/OpenStreetMap</h3>
                <p>
                  Für die Kartenansicht nutzen wir Leaflet mit OpenStreetMap-Kartenmaterial. 
                  Beim Laden der Karten werden Verbindungen zu OpenStreetMap-Servern hergestellt.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">5.3 Base44 Platform</h3>
                <p>
                  Diese App läuft auf der Base44-Plattform. Daten werden in Europa (Deutschland) 
                  auf Servern von Supabase gespeichert.
                </p>
              </div>
            </div>
          </section>

          {/* Speicherdauer */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-pink-400" />
              </div>
              <h2 className="text-xl font-bold">6. Wie lange speichern wir deine Daten?</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <ul className="space-y-2">
                <li>
                  <span className="font-semibold text-white">Account-Daten:</span> Bis zur Löschung deines Accounts
                </li>
                <li>
                  <span className="font-semibold text-white">Posts & Kommentare:</span> Bis zur manuellen Löschung
                </li>
                <li>
                  <span className="font-semibold text-white">Stories:</span> Automatische Löschung nach 24 Stunden
                </li>
                <li>
                  <span className="font-semibold text-white">Session-Daten:</span> Bis zum Logout
                </li>
                <li>
                  <span className="font-semibold text-white">Altersprüfung:</span> 30 Tage im Browser
                </li>
              </ul>
            </div>
          </section>

          {/* Deine Rechte */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">7. Deine Rechte nach DSGVO</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <p>Du hast folgende Rechte:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-1">📄 Auskunftsrecht (Art. 15 DSGVO)</h4>
                  <p>Informationen über gespeicherte Daten</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-1">✏️ Berichtigungsrecht (Art. 16 DSGVO)</h4>
                  <p>Korrektur falscher Daten</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-1">🗑️ Löschung (Art. 17 DSGVO)</h4>
                  <p>Löschung deiner Daten</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-1">📦 Datenportabilität (Art. 20 DSGVO)</h4>
                  <p>Export deiner Daten</p>
                </div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
                <p className="text-green-300 font-medium mb-2">💡 So nutzt du deine Rechte:</p>
                <ul className="space-y-1">
                  <li>• <strong>Datenexport:</strong> Einstellungen → Daten herunterladen</li>
                  <li>• <strong>Account löschen:</strong> Einstellungen → Konto löschen</li>
                  <li>• <strong>Sonstiges:</strong> E-Mail an datenschutz@growhub.de</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sicherheit */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold">8. Datensicherheit</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <p>Wir setzen technische und organisatorische Maßnahmen ein:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>SSL/TLS-Verschlüsselung für alle Verbindungen</li>
                <li>Verschlüsselte Datenspeicherung</li>
                <li>Row Level Security (RLS) für Datenbanken</li>
                <li>Regelmäßige Sicherheits-Updates</li>
                <li>Zugangsbeschränkungen für Administratoren</li>
              </ul>
            </div>
          </section>

          {/* Kontakt */}
          <section className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-400 mb-3">📧 Fragen zum Datenschutz?</h2>
            <p className="text-zinc-300 text-sm mb-4">
              Bei Fragen zur Verarbeitung deiner Daten oder zur Ausübung deiner Rechte 
              kannst du dich jederzeit an uns wenden:
            </p>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-400" />
              <a href="mailto:datenschutz@growhub.de" className="text-green-400 hover:underline font-medium">
                datenschutz@growhub.de
              </a>
            </div>
          </section>

          <p className="text-center text-zinc-600 text-sm">
            Stand: Dezember 2024
          </p>
        </motion.div>
      </div>
    </div>
  );
}