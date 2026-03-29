import { Lock } from 'lucide-react';

export default function PrivateProfileMessage() {
  return (
    <div className="text-center py-20 px-6">
      <div className="w-20 h-20 mx-auto mb-5 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
        <Lock className="w-9 h-9 text-zinc-600" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Privates Konto</h3>
      <p className="text-zinc-500 text-sm max-w-xs mx-auto">
        Folge diesem Konto, um die Inhalte zu sehen.
      </p>
    </div>
  );
}