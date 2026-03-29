import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PostContent({ content }) {
  if (!content) return null;

  const renderContent = () => {
    const parts = [];
    let lastIndex = 0;

    // Regex für Mentions (@username) und Hashtags (#tag)
    const regex = /(@\w+)|(#\w+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Text vor dem Match
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>
        );
      }

      const matched = match[0];
      
      if (matched.startsWith('@')) {
        // Mention
        const username = matched.slice(1);
        parts.push(
          <Link
            key={match.index}
            to={createPageUrl(`Profile?id=${username}`)}
            className="text-green-400 hover:text-green-300 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {matched}
          </Link>
        );
      } else if (matched.startsWith('#')) {
        // Hashtag
        const tag = matched.slice(1);
        parts.push(
          <Link
            key={match.index}
            to={createPageUrl(`Feed?tag=${tag}`)}
            className="text-green-400 hover:text-green-300 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {matched}
          </Link>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Rest des Texts
    if (lastIndex < content.length) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="text-white text-[15px] leading-relaxed mb-4 whitespace-pre-wrap break-words">
      {renderContent()}
    </div>
  );
}