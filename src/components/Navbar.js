'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    showToast('Logged out successfully. See you soon!', 'success');
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo + Tagline */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Quikyu Logo" width={36} height={36} />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-brand">Quikyu</span>
              <span className="text-xs text-gray-500">
                Smart Queue System for PT KAI
              </span>
            </div>
          </Link>

          {/* System Status */}
          <div className="hidden md:flex items-center gap-6">
            {/* <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                System Normal
              </span>
            </div> */}

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-600 font-medium">
                  {user.user_metadata?.first_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-brand transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
