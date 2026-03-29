import { EyeOff } from 'lucide-react';

export default function LockedSectionMessage({ label }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
        <EyeOff className="w-7 h-7 text-zinc-600" />
      </div>
      <h3 className="text-white font-bold mb-1">{label} sind privat</h3>
      <p className="text-zinc-500 text-sm">Dieser Bereich ist nicht öffentlich sichtbar.</p>
    </div>
  );
}