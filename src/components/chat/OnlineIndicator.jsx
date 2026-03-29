
export default function OnlineIndicator({ isOnline, size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="relative inline-block">
      <div className={`
        ${sizeClasses[size]} 
        rounded-full 
        ${isOnline ? 'bg-green-500' : 'bg-gray-500'}
        ${isOnline ? 'ring-2 ring-black' : ''}
      `} />
      {isOnline && (
        <div className={`
          absolute inset-0 
          ${sizeClasses[size]} 
          rounded-full 
          bg-green-500 
          animate-ping 
          opacity-75
        `} />
      )}
    </div>
  );
}