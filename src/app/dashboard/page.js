'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[80vh] w-full">
        {/* Background Image */}
        <Image
          src="/hero-train.jpg" // ganti dengan path gambar kereta kamu
          alt="Kereta"
          fill
          className="object-cover"
          priority
        />

        {/* Overlay gelap tipis biar teks lebih jelas */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-center h-full">
          <h1 className="text-4xl font-bold text-white mb-2">
            Selamat Datang, {user?.user_metadata?.first_name || user?.email} 👋
          </h1>
          <p className="text-white/90 mb-8 text-lg">
            Siap untuk perjalanan berikutnya?
          </p>

          {/* Card Form Cari Kereta */}
          <div className="bg-white shadow-xl rounded-2xl p-6 max-w-lg">
            <h2 className="text-xl font-semibold mb-4 text-brand">Cari Kereta</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push('/trains'); // redirect ke page daftar kereta
              }}
              className="grid gap-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Dari</label>
                <input
                  type="text"
                  defaultValue="Bandung (BD)"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ke</label>
                <input
                  type="text"
                  defaultValue="Gambir (GMR)"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Berangkat</label>
                  <input type="date" className="w-full border rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Penumpang</label>
                  <input
                    type="number"
                    defaultValue={1}
                    min={1}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-brand text-white py-3 rounded-lg hover:bg-brand-hover transition-colors"
              >
                Cari Kereta
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
