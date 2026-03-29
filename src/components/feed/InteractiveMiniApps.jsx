import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Calculator, Clock } from 'lucide-react';

export default function InteractiveMiniApps({ post }) {
  const [activeApp, setActiveApp] = useState(null);

  const miniApps = [
    { id: 'poll', icon: Gamepad2, label: 'Umfrage', color: 'blue' },
    { id: 'calc', icon: Calculator, label: 'Rechner', color: 'green' },
    { id: 'timer', icon: Clock, label: 'Timer', color: 'purple' }
  ];

  const hasMiniApp = post.mini_app_type;

  if (!hasMiniApp) return null;

  return (
    <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Gamepad2 className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">Interaktive App</span>
      </div>

      {post.mini_app_type === 'poll' && <MiniPoll poll={post.poll_data} />}
      {post.mini_app_type === 'calculator' && <MiniCalculator />}
      {post.mini_app_type === 'timer' && <MiniTimer />}
    </div>
  );
}

function MiniPoll({ poll }) {
  const [voted, setVoted] = useState(null);

  return (
    <div className="space-y-2">
      {poll?.options?.map((option, idx) => {
        const votes = option.votes || 0;
        const total = poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
        const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;

        return (
          <button
            key={idx}
            onClick={() => setVoted(idx)}
            className={`w-full p-3 rounded-xl text-left transition-all ${
              voted === idx
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white">{option.text}</span>
              <span className="text-xs text-zinc-500">{percentage}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MiniCalculator() {
  const [result, setResult] = useState(0);

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white mb-4">{result}</div>
      <div className="grid grid-cols-4 gap-2">
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
          <button
            key={btn}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  React.useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="text-center space-y-4">
      <div className="text-4xl font-bold text-white">
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
      </div>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium"
      >
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}