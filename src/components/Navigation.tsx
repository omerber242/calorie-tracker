'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Today', icon: '🏠' },
  { href: '/log', label: 'Log', icon: '📋' },
  { href: '/recipes', label: 'Recipes', icon: '🍽️' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/auth');
  }

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <Link href="/" className="font-bold text-green-600 text-lg">🥗 CalTrack</Link>
        <div className="flex items-center gap-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === n.href
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 pb-safe">
        <div className="flex">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                pathname === n.href ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
