export default function Loader({ fullPage, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';

  const spinner = (
    <div className="flex items-center gap-3">
      <div className={`${sizeClass} border-[3px] border-white/10 border-t-brand-primary rounded-full animate-spin`} />
      {size === 'lg' && <span className="text-gray-500 text-sm">Loading...</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {spinner}
    </div>
  );
}
