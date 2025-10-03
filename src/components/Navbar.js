'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-bold text-[#F27500]">
            TrainBooker
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-600">
                  {user.user_metadata?.first_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-[#F27500] text-white px-6 py-2 rounded-lg hover:bg-[#d96600] transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-[#F27500] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#F27500] text-white px-6 py-2 rounded-lg hover:bg-[#d96600] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
