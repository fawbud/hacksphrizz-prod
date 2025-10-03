'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import QueueStatusWidget from '@/components/QueueStatusWidget';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ✅ Auto redirect kalau sudah login
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-brand text-xl">Loading...</div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand to-brand-hover text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Perjalanan Nyaman, <br /> Indonesia Maju 🇮🇩
            </h1>
            <p className="text-lg mb-8 max-w-xl">
              Quikyu hadir untuk membuat pemesanan tiket kereta lebih cepat, mudah, 
              dan adil bagi semua penumpang Indonesia.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="bg-white text-brand px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Pesan Sekarang
              </Link>
              <Link
                href="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white hover:text-brand transition-colors"
              >
                Masuk
              </Link>
            </div>
          </div>

          {/* Card Gambar Hero */}
          <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
            <div className="max-w-lg rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <Image
                src="/hero-train.jpg"
                alt="Kereta Api Indonesia"
                width={600}
                height={400}
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Kenapa Memilih <span className="text-brand">Quikyu</span>?
        </h2>

        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🚄</div>
            <h3 className="text-xl font-semibold mb-2">Cepat</h3>
            <p className="text-gray-600">Pesan tiket kurang dari 2 menit</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Mudah</h3>
            <p className="text-gray-600">Akses dari mana saja, kapan saja</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Aman</h3>
            <p className="text-gray-600">Sistem cerdas anti-bot & scalper</p>
          </div>
          <div className="p-6 rounded-lg bg-gray-50 shadow hover:shadow-lg transition">
            <div className="text-5xl mb-4">💺</div>
            <h3 className="text-xl font-semibold mb-2">Nyaman</h3>
            <p className="text-gray-600">Pilih kursi sesuai keinginan</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-red-600 to-brand text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ayo, Jelajahi Indonesia dengan Kereta Api 🚄
        </h2>
        <p className="mb-8 text-lg">
          Pesan tiketmu sekarang, rasakan perjalanan cepat dan nyaman bersama Quikyu
        </p>
        <Link
          href="/register"
          className="bg-white text-brand px-10 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Mulai Pesan
        </Link>
      </section>
    </div>
  );
}
