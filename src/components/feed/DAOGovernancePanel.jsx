import { useState } from 'react';
import { motion } from 'framer-motion';
import { Vote, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DAOGovernancePanel({ group }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  if (!group?.dao_proposal) return null;

  const proposal = group.dao_proposal;
  const totalVotes = proposal.votes?.reduce((sum, v) => sum + v.count, 0) || 0;

  const vote = async (optionIndex) => {
    setSelectedOption(optionIndex);
    setHasVoted(true);
    toast.success('Vote registriert! Blockchain-Transaktion läuft...');
    
    // Simulate blockchain vote
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Vote auf Blockchain bestätigt! ✓');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-3xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
          <Vote className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">DAO Abstimmung</h3>
          <p className="text-xs text-zinc-500">Community-Governance</p>
        </div>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-2">{proposal.title}</h4>
        <p className="text-sm text-zinc-400 mb-4">{proposal.description}</p>

        <div className="space-y-2">
          {proposal.options?.map((option, idx) => {
            const votes = option.votes || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedOption === idx;

            return (
              <button
                key={idx}
                onClick={() => !hasVoted && vote(idx)}
                disabled={hasVoted}
                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-500/20 border border-indigo-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                } ${hasVoted ? 'cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{option.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{percentage}%</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {totalVotes} Stimmen
          </div>
          <div>
            Endet in {proposal.ends_in_hours || 24}h
          </div>
        </div>
      </div>
    </motion.div>
  );
}