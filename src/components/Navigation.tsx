'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'בית', icon: '🏠' },
  { href: '/expenses', label: 'הוצאות', icon: '🧾' },
  { href: '/budget', label: 'תקציב', icon: '💰' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 sm:sticky sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="max-w-3xl mx-auto flex sm:justify-start sm:gap-1 sm:px-4 sm:py-2">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 sm:flex-none flex sm:inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-1.5 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                active ? 'text-rose-600 sm:bg-rose-50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg sm:text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
