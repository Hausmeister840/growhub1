import { motion } from 'framer-motion';
import { ArrowLeft, FileText, ShieldAlert, Users, Gavel, Ban, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
              <h1 className="text-xl font-bold">Nutzungsbedingungen</h1>
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
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-bold">1. Geltungsbereich</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <p>
                Diese Nutzungsbedingungen regeln die Nutzung der GrowHub-Plattform. 
                Mit der Registrierung und Nutzung akzeptierst du diese Bedingungen.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 font-medium">
                  ℹ️ Durch die Nutzung von GrowHub bestätigst du, dass du mindestens 18 Jahre alt bist 
                  und die geltenden Gesetze in deinem Land einhältst.
                </p>
              </div>
            </div>
          </section>

          {/* Cannabis & Legalität */}
          <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-amber-400">2. Cannabis und rechtliche Hinweise</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">2.1 Altersbeschränkung (18+)</h3>
                <p>
                  GrowHub ist ausschließlich für Personen ab 18 Jahren. Bei Verstoß behalten wir uns 
                  vor, deinen Account sofort und ohne Vorankündigung zu sperren.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">2.2 Gesetzeskonformität (CanG)</h3>
                <p className="mb-2">Die Nutzung erfolgt im Rahmen des deutschen Cannabisgesetzes (CanG):</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Konsum verboten in Schutzzonen (Schulen, Spielplätze, Jugendzentren)</li>
                  <li>Konsum verboten in Sichtweite von Minderjährigen</li>
                  <li>Anbau nur für Eigenbedarf (max. 3 Pflanzen pro Person)</li>
                  <li>Abgabe an Minderjährige ist strafbar</li>
                  <li>Verkauf ohne Lizenz ist illegal</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">2.3 Haftungsausschluss</h3>
                <p>
                  GrowHub ist eine Informations- und Community-Plattform. Wir fordern nicht zum 
                  illegalen Konsum oder Handel auf. Du bist selbst verantwortlich für die Einhaltung 
                  der Gesetze in deinem Land.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 font-medium">
                  ⚠️ <strong>Wichtig:</strong> Die Gesetze variieren je nach Land und Bundesland. 
                  Informiere dich über die aktuellen Regelungen in deiner Region!
                </p>
              </div>
            </div>
          </section>

          {/* Accountnutzung */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold">3. Account und Registrierung</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">3.1 Account-Erstellung</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ein Account pro Person</li>
                  <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
                  <li>Sichere Aufbewahrung deiner Login-Daten</li>
                  <li>Sofortige Meldung bei unbefugtem Zugriff</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3.2 Account-Sicherheit</h3>
                <p>
                  Du bist für alle Aktivitäten unter deinem Account verantwortlich. 
                  Teile deine Login-Daten mit niemandem.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3.3 Account-Löschung</h3>
                <p>
                  Du kannst deinen Account jederzeit in den Einstellungen löschen. 
                  Alle deine Daten werden gemäß DSGVO entfernt.
                </p>
              </div>
            </div>
          </section>

          {/* Verbotene Inhalte */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold">4. Verbotene Inhalte und Verhaltensweisen</h2>
            </div>
            <div className="space-y-4 text-zinc-300 text-sm">
              <p className="font-semibold text-white">Folgende Inhalte sind auf GrowHub verboten:</p>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <h4 className="font-semibold text-red-400 mb-1">🚫 Illegale Aktivitäten</h4>
                  <p className="text-xs">Verkauf, Handel, Angebote zum Kauf von Cannabis oder anderen Drogen</p>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <h4 className="font-semibold text-red-400 mb-1">🚫 Hassrede & Diskriminierung</h4>
                  <p className="text-xs">Inhalte, die Personen oder Gruppen beleidigen oder diskriminieren</p>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <h4 className="font-semibold text-red-400 mb-1">🚫 Gewalt & Extremismus</h4>
                  <p className="text-xs">Gewaltverherrlichung, Terrorismus, extremistische Inhalte</p>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <h4 className="font-semibold text-red-400 mb-1">🚫 Jugendschutz-Verstöße</h4>
                  <p className="text-xs">Sexuelle, pornografische oder für Minderjährige ungeeignete Inhalte</p>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <h4 className="font-semibold text-red-400 mb-1">🚫 Spam & Werbung</h4>
                  <p className="text-xs">Unerwünschte Werbung, wiederholte Posts, Betrug</p>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <h4 className="font-semibold text-red-400 mb-1">🚫 Urheberrechtsverletzungen</h4>
                  <p className="text-xs">Veröffentlichung fremder Inhalte ohne Genehmigung</p>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mt-4">
                <p className="text-orange-300 font-medium mb-2">⚡ Konsequenzen bei Verstößen:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Verwarnung bei erstmaligem Verstoß</li>
                  <li>• Temporäre Sperrung (7-30 Tage)</li>
                  <li>• Permanente Account-Löschung bei schweren Verstößen</li>
                  <li>• Meldung an Strafverfolgungsbehörden bei illegalen Aktivitäten</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Moderation */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold">5. Content-Moderation</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">5.1 Automatische Moderation</h3>
                <p>
                  Wir nutzen KI-gestützte Tools zur automatischen Erkennung von problematischen Inhalten. 
                  Diese können Inhalte kennzeichnen, altersrestringieren oder blockieren.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">5.2 Melde-System</h3>
                <p>
                  User können unangemessene Inhalte melden. Unser Moderations-Team prüft Meldungen 
                  innerhalb von 24-48 Stunden.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">5.3 Einspruch</h3>
                <p>
                  Bei ungerechtfertigter Sperrung kannst du Einspruch einlegen unter: 
                  moderation@growhub.de
                </p>
              </div>
            </div>
          </section>

          {/* Geistiges Eigentum */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-pink-400" />
              </div>
              <h2 className="text-xl font-bold">6. Geistiges Eigentum</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2">6.1 Deine Inhalte</h3>
                <p>
                  Du behältst alle Rechte an deinen veröffentlichten Inhalten (Posts, Bilder, Videos). 
                  Mit der Veröffentlichung gewährst du GrowHub eine nicht-exklusive Lizenz zur Anzeige 
                  und Verbreitung dieser Inhalte auf der Plattform.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">6.2 Plattform-Inhalte</h3>
                <p>
                  Alle Inhalte der GrowHub-Plattform (Design, Logo, Code) sind urheberrechtlich geschützt. 
                  Eine Nutzung ohne Genehmigung ist untersagt.
                </p>
              </div>
            </div>
          </section>

          {/* Haftung */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold">7. Haftungsbeschränkung</h2>
            </div>
            <div className="space-y-3 text-zinc-300 text-sm">
              <p>
                GrowHub stellt eine Plattform bereit. Wir haften nicht für:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Von Usern veröffentlichte Inhalte</li>
                <li>Fehlerhafte oder unvollständige Informationen</li>
                <li>Schäden durch Nutzung der Plattform</li>
                <li>Verlust von Daten bei technischen Problemen</li>
                <li>Rechtliche Konsequenzen aus dem Konsum von Cannabis</li>
              </ul>
            </div>
          </section>

          {/* Änderungen */}
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-xl font-bold mb-4">8. Änderungen der Nutzungsbedingungen</h2>
            <div className="text-zinc-300 text-sm">
              <p>
                Wir behalten uns vor, diese Nutzungsbedingungen zu ändern. Änderungen werden dir 
                rechtzeitig mitgeteilt. Durch fortgesetzte Nutzung nach der Änderung akzeptierst 
                du die neuen Bedingungen.
              </p>
            </div>
          </section>

          {/* Kontakt */}
          <section className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-400 mb-3">📧 Fragen?</h2>
            <p className="text-zinc-300 text-sm mb-3">
              Bei Fragen zu den Nutzungsbedingungen kontaktiere uns unter:
            </p>
            <a href="mailto:legal@growhub.de" className="text-green-400 hover:underline font-medium">
              legal@growhub.de
            </a>
          </section>

          <p className="text-center text-zinc-600 text-sm">
            Stand: Dezember 2024
          </p>
        </motion.div>
      </div>
    </div>
  );
}