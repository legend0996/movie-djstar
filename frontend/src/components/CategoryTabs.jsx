import { useRef } from 'react';
import { useFetch } from '../hooks/useApi';

export default function CategoryTabs({ selected, onSelect }) {
  const scrollRef = useRef(null);
  const { data } = useFetch('categories', '/movies/categories');
  const categories = data?.data || [];

  const tabs = [
    { slug: '', label: 'All' },
    ...categories.map((cat) => ({ slug: cat.slug, label: cat.name })),
  ];

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2"
      >
        {tabs.map((cat) => {
          const isActive = selected === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => onSelect(cat.slug)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
