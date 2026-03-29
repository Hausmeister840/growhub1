import { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

export default function AgeVerification() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('growhub_age_verified');
    const verifiedDate = localStorage.getItem('growhub_age_verified_date');
    
    if (verified === 'true' && verifiedDate) {
      // Check if verification is still valid (30 days)
      const daysSince = (Date.now() - new Date(verifiedDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        return; // Still valid
      }
    }
    
    setShowModal(true);
  }, []);

  const handleVerify = (isOver18) => {
    if (isOver18) {
      localStorage.setItem('growhub_age_verified', 'true');
      localStorage.setItem('growhub_age_verified_date', new Date().toISOString());
      setShowModal(false);
    } else {
      window.location.href = 'https://www.google.com';
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-green-500/30">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Altersverifikation
        </h2>
        
        <p className="text-gray-400 mb-6">
          Diese App enthält Inhalte zum Thema Cannabis und ist nur für 
          Personen ab 18 Jahren bestimmt. Bitte bestätige dein Alter.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => handleVerify(false)}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            Unter 18
          </button>
          <button
            onClick={() => handleVerify(true)}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-semibold"
          >
            18 oder älter
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-yellow-500 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Gemäß deutschem Cannabisgesetz (CanG)</span>
        </div>
      </div>
    </div>
  );
}