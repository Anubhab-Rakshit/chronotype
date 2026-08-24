import { useState, useEffect } from 'react';
import { X, Search, Trophy, Loader2 } from 'lucide-react';
import { apolloClient } from '../graphql/client';
import { LEADERBOARD_QUERY } from '../graphql/operations';
import { CornerAnchors } from './CornerAnchors';
import { audio } from '../services/AudioEngine';

interface LeaderboardViewProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  bestTime: number;
  accuracy: number;
  gamesPlayed: number;
}

export function LeaderboardView({ onClose }: LeaderboardViewProps) {
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const { data } = await apolloClient.query<{ leaderboard: LeaderboardEntry[] }>({
          query: LEADERBOARD_QUERY,
          variables: { limit: 50 },
          fetchPolicy: 'network-only'
        });
        if (isMounted && data?.leaderboard) {
          setEntries(data.leaderboard);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to fetch leaderboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="hairline-card w-full max-w-4xl h-[85vh] flex flex-col relative p-0 overflow-hidden">
        <CornerAnchors />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#222] bg-black/40 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-emerald-400" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                Global Network State
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif italic text-white">
              Hall of Velocity.
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input 
                type="text" 
                placeholder="FILTER ALIAS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs font-mono text-white outline-none focus:border-white/40 w-56 placeholder:text-[#555]"
              />
            </div>
            
            <button 
              onClick={() => {
                audio.playTick();
                onClose();
              }} 
              className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-[#888] hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[80px_1fr_120px_120px_120px] gap-4 px-8 py-3.5 border-b border-[#222] bg-black/60 font-mono text-[9px] uppercase tracking-widest text-[#888] relative z-10">
          <span>Rank</span>
          <span>Player Partition</span>
          <span className="text-right">Best Time</span>
          <span className="text-right">Precision</span>
          <span className="text-right">Runs</span>
        </div>

        {/* Scrollable Records */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="font-mono text-xs text-[#888] tracking-widest uppercase">
                Synchronizing on-chain records...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400 font-mono text-xs text-center">
              <span>LEADERBOARD // RUNTIME NOTICE</span>
              <span className="text-[#666] text-[10px]">Database connection pending or local mode</span>
            </div>
          ) : !entries.length ? (
            <div className="flex flex-col items-center justify-center h-full text-[#666] font-mono text-xs uppercase tracking-widest">
              <span>No Verified Settlements Found Yet</span>
            </div>
          ) : (
            <div className="space-y-2">
              {entries
                .filter((score) => !search || score.username?.toLowerCase().includes(search.toLowerCase()))
                .map((score, index) => (
                <div 
                  key={score.userId || index}
                  className="grid grid-cols-[80px_1fr_120px_120px_120px] gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all items-center"
                >
                  <div className="font-serif italic text-2xl text-white">
                    #{score.rank || index + 1}
                  </div>
                  <div className="font-mono text-sm text-white flex items-center gap-2">
                    <span>{score.username}</span>
                    {index === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>
                  <div className="font-mono text-base text-white text-right font-medium">
                    {score.bestTime?.toFixed(2)} <span className="text-[10px] text-[#666]">s</span>
                  </div>
                  <div className="font-mono text-sm text-emerald-400 text-right">
                    {score.accuracy}%
                  </div>
                  <div className="font-mono text-xs text-[#888] text-right">
                    {score.gamesPlayed} runs
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardView;
