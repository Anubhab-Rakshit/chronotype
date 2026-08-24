import { useState } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CornerAnchors } from './CornerAnchors';
import { audio } from '../services/AudioEngine';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, register, isLoading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    audio.playTick();
    
    try {
      if (isLogin) {
        const res = await login(email || username, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Authentication rejected');
        } else {
          audio.playSuccess();
          onClose();
        }
      } else {
        const res = await register(username, email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration rejected');
        } else {
          audio.playSuccess();
          onClose();
        }
      }
    } catch {
      setErrorMsg('Unexpected network anomaly');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="hairline-card w-full max-w-lg p-8 sm:p-12 relative flex flex-col">
        <CornerAnchors />
        
        <button 
          onClick={() => {
            audio.playTick();
            onClose();
          }}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/10 text-[#888] hover:text-white transition-colors cursor-pointer z-20"
        >
          <X size={16} />
        </button>

        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-2 px-3 py-1 border border-emerald-500/20 bg-emerald-500/10 rounded-full w-fit mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-400">
              Identity Layer
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif italic text-white mb-2">
            {isLogin ? 'Authenticate.' : 'Initialize.'}
          </h2>
          <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-8">
            {isLogin ? 'Verify cryptographic identity alias' : 'Mint verified local player partition'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {!isLogin && (
              <div className="flex flex-col gap-1.5 border-b border-[#222] pb-2 focus-within:border-white transition-colors">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#888]">
                  Alias Handle
                </span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent border-none outline-none font-serif italic text-2xl text-white placeholder:text-[#444]"
                  placeholder="ENTER ALIAS..."
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 border-b border-[#222] pb-2 focus-within:border-white transition-colors">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#888]">
                {isLogin ? 'Alias / Email' : 'Email Address'}
              </span>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none font-serif italic text-2xl text-white placeholder:text-[#444]"
                placeholder="ENTER IDENTIFIER..."
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 border-b border-[#222] pb-2 focus-within:border-white transition-colors">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#888]">
                Passkey Code
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-xl text-white placeholder:text-[#444]"
                placeholder="••••••••"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 border border-red-500/30 bg-red-500/10 font-mono text-[10px] text-red-400 tracking-wider">
                ERROR // {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Access Engine' : 'Mint Identity'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                audio.playTick();
                setIsLogin(!isLogin);
                setErrorMsg(null);
              }}
              className="font-mono text-[10px] uppercase tracking-widest text-[#888] hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white pb-0.5"
            >
              {isLogin ? 'No alias yet? Initialize identity →' : 'Already registered? Authenticate here →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
