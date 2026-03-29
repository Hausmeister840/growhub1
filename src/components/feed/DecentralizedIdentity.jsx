import { Key, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DecentralizedIdentity({ user }) {
  const did = user.decentralized_id || generateDID(user.email);
  const verified = user.did_verified || false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl"
    >
      <Key className="w-3.5 h-3.5 text-indigo-400" />
      <span className="text-xs text-indigo-400 font-medium">
        DID: {did.slice(0, 12)}...
      </span>
      {verified && (
        <Shield className="w-3 h-3 text-green-400" />
      )}
    </motion.div>
  );
}

function generateDID(email) {
  const hash = email.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `did:grow:${Math.abs(hash).toString(16)}`;
}

export function CrossPlatformBadge({ platforms = [] }) {
  const icons = {
    twitter: '𝕏',
    instagram: '📷',
    tiktok: '🎵',
    youtube: '▶️'
  };

  return (
    <div className="flex items-center gap-1">
      {platforms.map(platform => (
        <span
          key={platform}
          className="text-xs opacity-60"
          title={`Verbunden mit ${platform}`}
        >
          {icons[platform] || '🔗'}
        </span>
      ))}
    </div>
  );
}