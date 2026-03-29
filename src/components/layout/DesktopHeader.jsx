import { Search, Bell, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DesktopHeader({ user }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50 z-30 lg:pl-72">
      <div className="flex items-center justify-between h-full px-6 max-w-7xl mx-auto">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Suche auf GrowHub..."
            className="w-full bg-zinc-900 border-zinc-800 rounded-full pl-10 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link to={createPageUrl('Notifications')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
          </Link>
          <Link to={createPageUrl('Messages')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageSquare className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="w-px h-6 bg-zinc-800 mx-2" />

          <Link to={createPageUrl(`Profile?id=${user?.id}`)}>
            <img 
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=27272a&color=fff`} 
              alt="User Avatar" 
              className="w-9 h-9 rounded-full cursor-pointer hover:opacity-90 transition-opacity" 
            />
          </Link>
        </div>
      </div>
    </div>
  );
}