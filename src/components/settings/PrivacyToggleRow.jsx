import { Switch } from '@/components/ui/switch';

export default function PrivacyToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-[14px] font-medium text-white">{label}</p>
        <p className="text-[12px] text-zinc-500 mt-0.5">{description}</p>
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-green-600"
      />
    </div>
  );
}