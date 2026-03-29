import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function VirtualEventWidget({ event }) {
  if (!event) return null;

  const isUpcoming = new Date(event.start_time) > new Date();
  const attendees = event.attendees?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400 font-semibold">Virtuelles Event</span>
          </div>
          <h4 className="text-white font-bold mb-2">{event.title}</h4>
          <p className="text-sm text-zinc-400 mb-3">{event.description}</p>

          <div className="space-y-2 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(event.start_time), 'PPp', { locale: de })}
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              {attendees} Teilnehmer
            </div>
          </div>
        </div>
      </div>

      {isUpcoming && (
        <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30">
          <Ticket className="w-4 h-4" />
          Teilnehmen
        </button>
      )}
    </motion.div>
  );
}