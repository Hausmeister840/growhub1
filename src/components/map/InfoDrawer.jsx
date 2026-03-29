import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function InfoDrawer({ isOpen, onClose }) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full md:w-[500px] bg-zinc-950 border-l border-green-800/20 text-white p-0 overflow-y-auto custom-scrollbar">
        <SheetHeader className="p-6 border-b border-green-800/20 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
          <SheetTitle className="text-green-400 text-2xl">Karten-Informationen & FAQ</SheetTitle>
          <SheetDescription className="text-gray-400">
            Alles, was du über die Funktionsweise und die rechtlichen Grundlagen der Karte wissen musst.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6 space-y-8">
            {/* Anleitung */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Anleitung</h3>
                <p className="p-3 bg-red-900/50 border border-red-700/50 text-red-300 rounded-lg">Im rot gekennzeichneten Bereich kann das Konsumverbot zutreffen.</p>
                <p className="text-gray-300">
                    Fußgängerzonen (Verkehrszeichen 242.1), in denen ebenfalls zwischen 7 und 20 Uhr nicht konsumiert werden darf, sind in der Karte nicht dargestellt.
                </p>
                <p className="text-gray-300">
                    Standorte von Anbauvereinigungen haben Abstände von 200 m einzuhalten; dieser und andere Abstände lassen sich über das Zahnrad (bald verfügbar) im rechten unteren Bildschirmrand einstellen.
                </p>
            </div>

            {/* Gesetzestext */}
            <div className="space-y-4">
                 <h3 className="text-xl font-bold text-white">Gesetzestext (§ 5 CanG)</h3>
                 <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg space-y-3 text-gray-300 text-sm">
                    <p><strong className="text-white">Der Konsum von Cannabis in unmittelbarer Gegenwart von Personen, die das 18. Lebensjahr noch nicht vollendet haben, ist verboten.</strong></p>
                    <p>Der öffentliche Konsum von Cannabis ist verboten:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>in Schulen und in deren Sichtweite,</li>
                        <li>auf Kinderspielplätzen und in deren Sichtweite,</li>
                        <li>in Kinder- und Jugendeinrichtungen und in deren Sichtweite,</li>
                        <li>in öffentlich zugänglichen Sportstätten und in deren Sichtweite,</li>
                        <li>in Fußgängerzonen zwischen 7 und 20 Uhr und</li>
                        <li>innerhalb des befriedeten Besitztums von Anbauvereinigungen und in deren Sichtweite.</li>
                    </ul>
                    <p className="pt-2 border-t border-zinc-700/50">Im Sinne von Satz 1 ist eine Sichtweite bei einem Abstand von mehr als <strong className="text-white">100 Metern</strong> von dem Eingangsbereich der genannten Einrichtungen nicht mehr gegeben.</p>
                 </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">FAQ</h3>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Was, wenn etwas auf der Karte fehlt?</AccordionTrigger>
                        <AccordionContent>
                        Fehlerhafte Daten müssen direkt bei OpenStreetMap korrigiert werden. Die Bubatzkarten-Integration verwendet diese Daten als Quelle. Fehler können dort gemeldet oder über Tools wie StreetComplete und MapComplete korrigiert werden.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Wann sind meine Änderungen sichtbar?</AccordionTrigger>
                        <AccordionContent>
                        Das kann mindestens ein bis zwei Tage dauern. Die Kartendaten werden in Intervallen aktualisiert.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Wertet GrowHub meine Standortdaten aus?</AccordionTrigger>
                        <AccordionContent>
                        Nein. Dein Standort wird nur lokal auf deinem Gerät verwendet, um die Karte zu zentrieren und die Distanz zu berechnen. Es werden keine Bewegungsdaten oder Standorte gespeichert oder verkauft.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            
             {/* Kontakt & Quellen */}
            <div className="space-y-4 text-center border-t border-green-800/20 pt-6">
                <p className="text-gray-400 text-sm">Diese Funktion basiert auf der Arbeit und der Philosophie der originalen Bubatzkarte.</p>
                <a href="https://bubatzkarte.de" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-green-800/20 text-green-400 hover:bg-green-500/10">
                        Original Bubatzkarte besuchen <ExternalLink className="w-4 h-4 ml-2"/>
                    </Button>
                </a>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}