export default function Impressum() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Impressum</h1>
        
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 space-y-6 border border-green-500/20">
          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-2">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="text-gray-300">
              GrowHub<br />
              Cannabis Community Platform<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-2">Kontakt</h2>
            <p className="text-gray-300">
              E-Mail: info@growhub.de
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-2">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <p className="text-gray-300">
              GrowHub Team<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-2">
              EU-Streitschlichtung
            </h2>
            <p className="text-gray-300">
              Die Europäische Kommission stellt eine Plattform zur 
              Online-Streitbeilegung (OS) bereit:{' '}
              <a 
                href="https://ec.europa.eu/consumers/odr" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-2">
              Haftungsausschluss
            </h2>
            <p className="text-gray-300 text-sm">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine 
              Haftung für die Inhalte externer Links. Für den Inhalt der 
              verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}