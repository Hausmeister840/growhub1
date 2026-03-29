import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle } from 'lucide-react';

const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
};

export default function AgeGate() {
  const navigate = useNavigate();

  useEffect(() => {
    const verified = safeStorage.getItem('growhub_age_verified');
    const verifiedDate = safeStorage.getItem('growhub_age_verified_date');
    
    if (verified === 'true' && verifiedDate) {
      try {
        const date = new Date(verifiedDate);
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince < 30) {
          navigate('/Feed', { replace: true });
          return;
        }
      } catch {
        // Invalid, continue showing gate
      }
    }
  }, [navigate]);

  const handleVerify = (isOver18) => {
    if (!isOver18) {
      window.location.href = 'https://www.google.com';
      return;
    }
    
    safeStorage.setItem('growhub_age_verified', 'true');
    safeStorage.setItem('growhub_age_verified_date', new Date().toISOString());
    
    setTimeout(() => {
      navigate('/Feed', { replace: true });
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6 z-[99999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800"
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-yellow-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Altersverifikation
          </h1>
          
          <p className="text-zinc-400 mb-2">
            Diese App enthält Inhalte zu Cannabis und richtet sich ausschließlich an Personen ab 18 Jahren.
          </p>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
            <p className="text-yellow-400 text-xs font-medium">
              ⚠️ Gemäß deutschem Cannabisgesetz (CanG)
            </p>
          </div>

          <div className="text-left mb-6">
            <p className="text-white font-semibold mb-2">
              Bist du 18 Jahre oder älter?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleVerify(false)}
              className="flex-1 px-6 py-4 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
            >
              Nein
            </button>
            <button
              onClick={() => handleVerify(true)}
              className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Ja, ich bin 18+
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}