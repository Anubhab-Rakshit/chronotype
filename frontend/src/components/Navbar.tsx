import { Volume2, VolumeX, Trophy, History, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { audio } from '../services/AudioEngine';

interface NavbarProps {
  onOpenLeaderboard: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function Navbar({ onOpenLeaderboard, onOpenHistory, onOpenAuth, isMuted, onToggleMute }: NavbarProps) {
  const { user, logout } = useAuth();

  const handleAudioToggle = () => {
    onToggleMute();
    audio.playTick();
  };

  return (
    <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[820px] px-2 sm:px-4">
      <div 
        className="flex items-center justify-between p-2 pl-4 sm:pl-6 pr-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl transition-all duration-500 shadow-[0_8px_32px_rgba(255,255,255,0.02)]"
        style={{ backgroundColor: 'rgba(5,5,5,0.5)' }}
      >
        {/* Left: Brand + Live System Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <span className="font-serif italic text-xl text-white tracking-tight">
              CT.
            </span>
          </div>

          {/* Live System Indicator from SplitStellar */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-500">
              SYS.ONLINE
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex items-center gap-6 px-4">
          <button
            onClick={() => {
              audio.playTick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#888] hover:text-white transition-colors cursor-pointer"
          >
            <Trophy size={13} />
            <span>Leaderboard</span>
          </button>

          {user && (
            <button
              onClick={() => {
                audio.playTick();
                onOpenHistory();
              }}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#888] hover:text-white transition-colors cursor-pointer"
            >
              <History size={13} />
              <span>Telemetry</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[#666] font-mono text-[10px]">
            <Sparkles size={11} className="text-emerald-500" />
            <span className="tracking-widest">1000Hz ENGINE</span>
          </div>
        </div>

        {/* Right: Sound Control + Auth Connect */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleAudioToggle}
            aria-label="Toggle Sound"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 transition-colors text-white cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} className="text-[#666]" /> : <Volume2 size={14} className="text-emerald-400" />}
          </button>

          {/* User Profile / Connect */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white px-3 py-1.5 rounded-full border border-white/15 bg-white/5">
                <User size={12} className="text-emerald-400" />
                <span>{user.username}</span>
              </div>
              <button
                onClick={() => {
                  audio.playTick();
                  logout();
                }}
                title="Disconnect Identity"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-[#888] hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                audio.playTick();
                onOpenAuth();
              }}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white px-4 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
            >
              <span>Connect</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
