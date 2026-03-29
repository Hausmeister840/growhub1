import React from "react";
import { Event } from "@/entities/Event";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Link as LinkIcon, Save } from "lucide-react";
import { createPageUrl } from "@/utils";

const eventTypes = ["meetup", "workshop", "webinar", "conference", "social"];

export default function CreateEvent() {
  const toast = useToast();
  const [me, setMe] = React.useState(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [eventType, setEventType] = React.useState("meetup");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [meetingLink, setMeetingLink] = React.useState("");
  const [entryFee, setEntryFee] = React.useState(0);
  const [tags, setTags] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        setMe(user);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const toISO = (localDateTime) => {
    if (!localDateTime) return null;
    // local datetime (YYYY-MM-DDTHH:mm) to ISO with local timezone offset
    const d = new Date(localDateTime);
    return d.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!me) {
      toast.error("Bitte anmelden, um ein Event zu erstellen.");
      return;
    }
    if (!title.trim() || !description.trim() || !start || !end) {
      toast.warning("Bitte fülle Titel, Beschreibung, Start- und Endzeit aus.");
      return;
    }
    const startISO = toISO(start);
    const endISO = toISO(end);
    if (new Date(startISO) >= new Date(endISO)) {
      toast.error("Das Ende muss nach dem Start liegen.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      event_type: eventType,
      start_date: startISO,
      end_date: endISO,
      location: location || (meetingLink ? "Online" : ""),
      organizer_email: me.email,
      meeting_link: meetingLink || undefined,
      entry_fee: Number(entryFee) || 0,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      status: "upcoming"
    };

    await Event.create(payload);
    toast.success("Event erstellt!");
    window.location.href = createPageUrl("Events");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Event erstellen</h1>
        </div>

        <Card className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
              <Textarea
                placeholder="Beschreibung"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white min-h-[120px]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Event-Typ" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Start"
                />
                <Input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Ende"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <Input
                    placeholder="Ort (z. B. Berlin)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-zinc-400" />
                  <Input
                    placeholder="Meeting-Link (optional)"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white"
                  placeholder="Eintritt (EUR)"
                />
                <Input
                  placeholder="Tags (kommagetrennt)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white sm:col-span-2"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => window.history.back()}>
                  Abbrechen
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}