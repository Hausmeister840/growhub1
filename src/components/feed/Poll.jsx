import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';

export default function Poll({ poll, postId, currentUser, onVote }) {
  const [votedOption, setVotedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (!currentUser || !poll?.votes) return;
    
    const userVote = poll.votes[currentUser.email];
    if (userVote !== undefined) {
      setVotedOption(userVote);
    }
  }, [poll, currentUser]);
  
  const totalVotes = useMemo(() => {
    if (!poll?.votes) return 0;
    return Object.keys(poll.votes).length;
  }, [poll?.votes]);

  const getVotePercentage = useCallback((optionIndex) => {
    if (totalVotes === 0) return 0;
    const votesForOption = Object.values(poll.votes || {}).filter(v => v === optionIndex).length;
    return (votesForOption / totalVotes) * 100;
  }, [poll?.votes, totalVotes]);

  const handleVote = async (optionIndex) => {
    if (votedOption !== null || !currentUser || isVoting) return;
    
    setIsVoting(true);
    setVotedOption(optionIndex);

    try {
      // ✅ FIX: Direct DB update
      const posts = await base44.entities.Post.filter({ id: postId });
      if (!posts || posts.length === 0) throw new Error('Post not found');
      
      const post = posts[0];
      const updatedVotes = {
        ...(post.poll?.votes || {}),
        [currentUser.email]: optionIndex
      };

      await base44.entities.Post.update(postId, {
        poll: {
          ...post.poll,
          votes: updatedVotes
        }
      });

      toast.success('Stimme abgegeben!');
      
      if (onVote) onVote(postId, optionIndex);
      
    } catch (error) {
      console.error('Vote error:', error);
      setVotedOption(null);
      toast.error('Abstimmung fehlgeschlagen');
    } finally {
      setIsVoting(false);
    }
  };

  if (!poll || !poll.options || poll.options.length === 0) {
    return null;
  }
  
  return (
    <div className="my-4 p-4 border border-zinc-800 rounded-2xl bg-zinc-900/30">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-green-400" />
        <h4 className="font-semibold text-white">
          {poll.question || 'Umfrage'}
        </h4>
      </div>

      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const optionText = typeof option === 'string' ? option : option.text;
          const percentage = getVotePercentage(index);
          const hasVoted = votedOption !== null;

          return (
            <div key={index}>
              {hasVoted ? (
                <div className="relative w-full h-10 bg-zinc-800 rounded-xl overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-full ${
                      votedOption === index ? 'bg-green-500' : 'bg-green-500/30'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 flex justify-between items-center px-4">
                    <span className={`text-white font-medium ${votedOption === index ? 'font-bold' : ''}`}>
                      {optionText}
                    </span>
                    <span className="text-white text-sm font-semibold">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/50"
                  onClick={() => handleVote(index)}
                  disabled={isVoting}
                >
                  {optionText}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {votedOption !== null && (
        <p className="text-xs text-zinc-500 mt-3">
          {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'}
        </p>
      )}
    </div>
  );
}