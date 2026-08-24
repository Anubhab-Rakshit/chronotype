import { useState, useEffect } from 'react';
import { X, History, Loader2 } from 'lucide-react';
import { apolloClient } from '../graphql/client';
import { USER_HISTORY_QUERY } from '../graphql/operations';
import { useAuth } from '../context/AuthContext';
import { CornerAnchors } from './CornerAnchors';
import { audio } from '../services/AudioEngine';

interface HistoryViewProps {
  onClose: () => void;
}

interface GameResult {
  id: string;
  userId: string;
  totalTime: number;
  rawTime: number;
  penaltyTime: number;
  wrongAttempts: number;
  correctCharacters: number;
  accuracy: number;
  completedAt: string;
  isBestScore: boolean;
}

export function HistoryView({ onClose }: HistoryViewProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data } = await apolloClient.query<{ userHistory: GameResult[] }>({
          query: USER_HISTORY_QUERY,
          variables: { limit: 50 },
          fetchPolicy: 'network-only'
        });
        if (isMounted && data?.userHistory) {
          setHistory(data.userHistory);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to fetch telemetry history');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [user]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="hairline-card w-full max-w-4xl h-[85vh] flex flex-col relative p-0 overflow-hidden">
        <CornerAnchors />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#222] bg-black/40 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <History size={16} className="text-emerald-400" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                Identity Telemetry Log
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif italic text-white">
              Partition History.
            </h2>
            <p className="font-mono text-xs text-[#888] tracking-widest uppercase mt-1">
              Verified sessions for {user?.username || 'Guest'}
            </p>
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

        {/* Column Headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-8 py-3.5 border-b border-[#222] bg-black/60 font-mono text-[9px] uppercase tracking-widest text-[#888] relative z-10">
          <span>Timestamp</span>
          <span className="text-right">Total Time</span>
          <span className="text-right">Precision</span>
          <span className="text-right">Penalty</span>
        </div>

        {/* Scrollable Records */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="font-mono text-xs text-[#888] tracking-widest uppercase">
                Loading telemetry logs...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400 font-mono text-xs text-center">
              <span>TELEMETRY // LOG NOTICE</span>
              <span className="text-[#666] text-[10px]">No active cloud sync session</span>
            </div>
          ) : !history.length ? (
            <div className="flex flex-col items-center justify-center h-full text-[#666] font-mono text-xs uppercase tracking-widest">
              <span>No Prior Session Runs Found</span>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((score) => (
                <div 
                  key={score.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all items-center"
                >
                  <div className="font-mono text-xs text-[#888]">
                    {new Date(score.completedAt).toLocaleString()}
                  </div>
                  <div className="font-mono text-base text-white text-right font-medium">
                    {score.totalTime?.toFixed(2)} <span className="text-[10px] text-[#666]">s</span>
                  </div>
                  <div className="font-mono text-sm text-emerald-400 text-right">
                    {score.accuracy}%
                  </div>
                  <div className="font-mono text-xs text-red-400 text-right">
                    +{score.penaltyTime?.toFixed(1)}s
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

export default HistoryView;
