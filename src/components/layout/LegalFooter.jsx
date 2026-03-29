import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LegalFooter() {
  return (
    <div className="bg-black/50 backdrop-blur-xl border-t border-zinc-900 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>© {new Date().getFullYear()} GrowHub</span>
            <span>•</span>
            <span>Cannabis Community</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link 
              to={createPageUrl('Impressum')} 
              className="hover:text-green-400 transition-colors"
            >
              Impressum
            </Link>
            <span>•</span>
            <Link 
              to={createPageUrl('Datenschutz')} 
              className="hover:text-green-400 transition-colors"
            >
              Datenschutz
            </Link>
            <span>•</span>
            <Link 
              to={createPageUrl('Terms')} 
              className="hover:text-green-400 transition-colors"
            >
              AGB
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}