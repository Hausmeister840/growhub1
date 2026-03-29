import { motion } from 'framer-motion';
import { ExternalLink, Code, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ProfileProjects({ projects }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
        <Code className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-500">Noch keine Projekte</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-green-500/30 transition-colors"
        >
          <div className="flex gap-4">
            {project.image_url && (
              <img
                src={project.image_url}
                alt={project.title}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-bold text-white">{project.title}</h3>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>

              {project.description && (
                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.technologies.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}

              {project.created_date && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(project.created_date), { addSuffix: true, locale: de })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}