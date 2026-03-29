import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Search, MapPin, Users, Plus, Clock, Video, 
  ExternalLink, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { de } from 'date-fns/locale';

const EVENT_TYPES = [
  { value: 'all', label: 'Alle Events', icon: '📅' },
  { value: 'meetup', label: 'Meetups', icon: '🤝' },
  { value: 'workshop', label: 'Workshops', icon: '🎓' },
  { value: 'webinar', label: 'Webinare', icon: '💻' },
  { value: 'conference', label: 'Konferenzen', icon: '🎤' },
  { value: 'social', label: 'Social Events', icon: '🎉' }
];

const TIME_FILTERS = [
  { value: 'upcoming', label: 'Kommende' },
  { value: 'today', label: 'Heute' },
  { value: 'past', label: 'Vergangene' }
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedType, timeFilter]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await base44.entities.Event.list('-start_date', 50);
      setEvents(fetchedEvents || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Fehler beim Laden der Events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events.filter(event => {
      if (!event) return false;
      
      const searchMatch = !searchTerm || 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const typeMatch = selectedType === 'all' || event.event_type === selectedType;
      
      let timeMatch = true;
      if (event.start_date) {
        try {
          const eventDate = parseISO(event.start_date);
          switch (timeFilter) {
            case 'upcoming':
              timeMatch = isFuture(eventDate);
              break;
            case 'past':
              timeMatch = isPast(eventDate);
              break;
            case 'today':
              const today = new Date();
              timeMatch = eventDate.toDateString() === today.toDateString();
              break;
          }
        } catch {
          timeMatch = true;
        }
      }
      
      return searchMatch && typeMatch && timeMatch;
    });

    setFilteredEvents(filtered);
  };

  const handleRegister = async (eventId) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      base44.auth.redirectToLogin();
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const isRegistered = event.registered_participants?.includes(currentUser.email);
    let newParticipants;

    if (isRegistered) {
      newParticipants = event.registered_participants.filter(email => email !== currentUser.email);
      toast.success('Du hast dich vom Event abgemeldet');
    } else {
      if (event.max_participants && event.registered_participants?.length >= event.max_participants) {
        toast.error('Event ist bereits ausgebucht');
        return;
      }
      newParticipants = [...(event.registered_participants || []), currentUser.email];
      toast.success('Du hast dich erfolgreich angemeldet!');
    }

    try {
      await base44.entities.Event.update(eventId, { registered_participants: newParticipants });
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, registered_participants: newParticipants } : e
      ));
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Fehler bei der Anmeldung');
    }
  };

  const getEventTypeInfo = (type) => {
    const typeInfo = EVENT_TYPES.find(t => t.value === type);
    return typeInfo || { label: type, icon: '📅' };
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'meetup': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'workshop': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'webinar': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'conference': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'social': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const isUserRegistered = (event) => {
    return currentUser && event.registered_participants?.includes(currentUser.email);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
          <p className="text-zinc-400">Events laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-14 lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Events & Meetups</h1>
                <p className="text-sm text-zinc-400">Entdecke lokale und Online-Events</p>
              </div>
            </div>
            
            {currentUser && (
              <Button 
                onClick={() => navigate(createPageUrl('CreateEvent'))} 
                className="bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Event
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              placeholder="Events durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {EVENT_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedType === type.value
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>

          {/* Time Filter */}
          <div className="flex gap-2 mt-3">
            {TIME_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  timeFilter === filter.value
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <span className="ml-auto text-sm text-zinc-500">
              {filteredEvents.length} Events
            </span>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Keine Events gefunden</h3>
            <p className="text-zinc-400 mb-6">
              {searchTerm || selectedType !== 'all' 
                ? 'Versuche es mit anderen Suchkriterien.' 
                : timeFilter === 'past' 
                  ? 'Noch keine vergangenen Events.' 
                  : 'Noch keine kommenden Events vorhanden.'
              }
            </p>
            {currentUser && timeFilter !== 'past' && (
              <Button 
                onClick={() => navigate(createPageUrl('CreateEvent'))} 
                className="bg-green-500 hover:bg-green-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Erstes Event erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredEvents.map((event, idx) => {
                const typeInfo = getEventTypeInfo(event.event_type);
                const registered = isUserRegistered(event);
                let eventDate = null;
                try {
                  eventDate = event.start_date ? parseISO(event.start_date) : null;
                } catch {}

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Image */}
                      {event.cover_image_url && (
                        <div className="lg:w-48 h-40 lg:h-auto flex-shrink-0">
                          <img 
                            src={event.cover_image_url} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEventTypeColor(event.event_type)}`}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            {event.entry_fee > 0 && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                {event.entry_fee}€
                              </Badge>
                            )}
                            {registered && (
                              <Badge className="bg-green-500/20 text-green-400">
                                ✓ Angemeldet
                              </Badge>
                            )}
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                        
                        {event.description && (
                          <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
                          {eventDate && (
                            <div className="flex items-center gap-2 text-zinc-300">
                              <Clock className="w-4 h-4 text-green-500" />
                              <span>{format(eventDate, 'dd.MM.yyyy, HH:mm', { locale: de })}</span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-2 text-zinc-300">
                              {event.location === 'Online' ? (
                                <Video className="w-4 h-4 text-green-500" />
                              ) : (
                                <MapPin className="w-4 h-4 text-green-500" />
                              )}
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>
                              {event.registered_participants?.length || 0}
                              {event.max_participants && ` / ${event.max_participants}`} Teilnehmer
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => handleRegister(event.id)}
                            variant={registered ? "outline" : "default"}
                            className={registered 
                              ? "border-green-500/50 text-green-400 hover:bg-green-500/10" 
                              : "bg-green-500 hover:bg-green-600 text-black"
                            }
                            disabled={eventDate && isPast(eventDate)}
                          >
                            {registered ? 'Abmelden' : 'Anmelden'}
                          </Button>
                          
                          {event.meeting_link && event.location === 'Online' && (
                            <Button 
                              variant="outline" 
                              className="border-zinc-700"
                              onClick={() => window.open(event.meeting_link, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Teilnehmen
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}