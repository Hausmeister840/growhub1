export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Datenschutzerklärung</h1>
        
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 space-y-6 border border-green-500/20 text-gray-300">
          
          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3">
              1. Datenschutz auf einen Blick
            </h2>
            <h3 className="font-medium text-white mb-2">Allgemeine Hinweise</h3>
            <p className="text-sm mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, 
              was mit Ihren personenbezogenen Daten passiert, wenn Sie diese 
              App nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie 
              persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3">
              2. Datenerfassung in dieser App
            </h2>
            <h3 className="font-medium text-white mb-2">
              Welche Daten werden erfasst?
            </h3>
            <ul className="text-sm list-disc list-inside space-y-1 mb-4">
              <li>Benutzername und E-Mail-Adresse bei Registrierung</li>
              <li>Profilinformationen, die Sie freiwillig angeben</li>
              <li>Inhalte, die Sie erstellen (Posts, Kommentare, Bilder)</li>
              <li>Nutzungsdaten und Geräteinformationen</li>
              <li>Standortdaten (nur mit Ihrer Zustimmung)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3">
              3. Ihre Rechte
            </h2>
            <p className="text-sm mb-2">Sie haben jederzeit das Recht:</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Auskunft über Ihre gespeicherten Daten zu erhalten</li>
              <li>Berichtigung unrichtiger Daten zu verlangen</li>
              <li>Löschung Ihrer Daten zu verlangen</li>
              <li>Die Verarbeitung einzuschränken</li>
              <li>Datenübertragbarkeit zu verlangen</li>
              <li>Ihre Einwilligung zu widerrufen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3">
              4. Kontakt
            </h2>
            <p className="text-sm">
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
              <a href="mailto:privacy@growhub.de" className="text-green-400 hover:underline">
                privacy@growhub.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3">
              5. Hinweis zu Cannabis-Inhalten
            </h2>
            <p className="text-sm">
              Diese App richtet sich ausschließlich an Personen ab 18 Jahren. 
              Die Nutzung erfolgt im Rahmen des deutschen Cannabisgesetzes (CanG). 
              Standortbezogene Features berücksichtigen die gesetzlichen 
              Schutzzonen gemäß CanG.
            </p>
          </section>

        </div>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          Stand: {new Date().toLocaleDateString('de-DE')}
        </p>
      </div>
    </div>
  );
}