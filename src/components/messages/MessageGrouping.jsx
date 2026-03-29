import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { de } from 'date-fns/locale';

export default function MessageGrouping({ messages, children }) {
  const groupedMessages = groupByDate(messages);

  return (
    <div className="space-y-6">
      {groupedMessages.map(group => (
        <div key={group.date} className="space-y-2">
          {/* Date Divider */}
          <div className="flex items-center justify-center py-2">
            <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 font-medium">
              {formatDateLabel(group.date)}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-1">
            {group.messages.map(message => children(message))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByDate(messages) {
  const groups = new Map();

  messages.forEach(message => {
    const date = new Date(message.created_date);
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: dateKey,
        timestamp: date,
        messages: []
      });
    }

    groups.get(dateKey).messages.push(message);
  });

  return Array.from(groups.values()).sort((a, b) => 
    a.timestamp - b.timestamp
  );
}

function formatDateLabel(dateString) {
  const date = new Date(dateString);

  if (isToday(date)) {
    return 'Heute';
  }

  if (isYesterday(date)) {
    return 'Gestern';
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE', { locale: de });
  }

  return format(date, 'dd. MMMM yyyy', { locale: de });
}