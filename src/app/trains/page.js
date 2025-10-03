'use client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReCAPTCHA from 'react-google-recaptcha';

export const dynamic = 'force-dynamic';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const [recaptchaRef, setRecaptchaRef] = useState(null);

  const from = searchParams.get('from') || 'GMR';
  const to = searchParams.get('to') || 'YK';
  const date = searchParams.get('date') || '';

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    setSelectedDate(date);
    fetchTrains();
  }, [from, to]);

  const fetchTrains = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('trains')
        .select('*')
        .eq('departure_station_code', from)
        .eq('arrival_station_code', to)
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (error) throw error;
      setTrains(data || []);
    } catch (error) {
      console.error('Error fetching trains:', error);
      setError('Gagal memuat data kereta. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleRecaptchaVerify = async (token) => {
    if (!token) return;

    try {
      const verifyRes = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, user_id: user.id })
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setShowCaptcha(false);
        recaptchaRef.reset();
        router.push(`/book?train=${selectedTrainId}&date=${selectedDate}`);
      } else {
        alert("Verifikasi captcha gagal. Silakan coba lagi.");
        recaptchaRef.reset();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan. Coba lagi.");
      recaptchaRef.reset();
    }
  };

  const handleSelect = async (trainId) => {
    if (!user) {
      alert('User tidak ditemukan. Silakan login ulang.');
      return;
    }

    // 1️⃣ Precheck trust score dari Supabase
    const precheck = await fetch("/api/precheck-trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id })
    }).then(r => r.json());

    const userTrust = precheck.trust_score ?? 0;
    const blocked = precheck.blocked_until && new Date(precheck.blocked_until) > new Date();

    // 2️⃣ Trust score rendah → tampil captcha V2
    if (userTrust < 0.5 || blocked) {
      setSelectedTrainId(trainId);
      setShowCaptcha(true);
    } else {
      // 3️⃣ Trust score tinggi → langsung lanjut
      router.push(`/book?train=${trainId}&date=${selectedDate}`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <section className="max-w-6xl mx-auto px-4 py-8 mt-16">
          {/* Header Section */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </Link>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {trains[0]?.departure_station || 'Gambir'} → {trains[0]?.arrival_station || 'Yogyakarta'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {selectedDate ? formatDate(selectedDate) : 'Pilih tanggal'} • 1 Dewasa, 0 Bayi
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Urutkan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Date Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[-1, 0, 1, 2, 3].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={offset}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-6 py-3 rounded-xl whitespace-nowrap font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {formatDate(dateStr)}
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Mencari kereta tersedia...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl border border-red-200">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchTrains}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Trains List */}
          {!loading && !error && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Kereta Berangkat ({trains.length})
              </h2>

              {trains.map((train) => (
                <div
                  key={train.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Train Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-semibold mb-2">
                            {train.train_class}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {train.train_name} ({train.train_code})
                          </h3>
                        </div>
                        
                        {train.available_seats > 0 ? (
                          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            train.available_seats <= 10
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {train.available_seats <= 10
                              ? `${train.available_seats} Kursi Tersisa`
                              : 'Tersedia'}
                          </div>
                        ) : (
                          <div className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                            Habis
                          </div>
                        )}
                      </div>

                      {/* Journey Details */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {formatTime(train.departure_time)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {train.departure_station_code}
                          </div>
                        </div>

                        <div className="flex-1 flex items-center">
                          <div className="w-full border-t-2 border-gray-300 relative">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 whitespace-nowrap">
                              {train.duration}
                            </div>
                            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {formatTime(train.arrival_time)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {train.arrival_station_code}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="lg:text-right flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Mulai dari</div>
                        <div className="text-2xl font-bold text-blue-600">
                          Rp{train.base_price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">/ Penumpang</div>
                      </div>

                      {train.available_seats > 0 ? (
                        <button
                          onClick={() => handleSelect(train.id)}
                          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                        >
                          Pilih
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-200 text-gray-500 px-8 py-3 rounded-xl font-semibold cursor-not-allowed whitespace-nowrap"
                        >
                          Habis
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <details className="mt-4">
                    <summary className="text-blue-600 font-medium cursor-pointer hover:text-blue-700 text-sm">
                      Lihat Detail Subkelas
                    </summary>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Kelas</div>
                          <div className="font-semibold text-gray-800">{train.train_class}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Kursi</div>
                          <div className="font-semibold text-gray-800">{train.total_seats}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Tersedia</div>
                          <div className="font-semibold text-gray-800">{train.available_seats}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Fasilitas</div>
                          <div className="font-semibold text-gray-800">AC, Colokan, WiFi</div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              ))}

              {trains.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <div className="text-6xl mb-4">🚄</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Tidak Ada Kereta Tersedia
                  </h3>
                  <p className="text-gray-600">
                    Coba ubah tanggal atau rute perjalanan Anda
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Informasi Penting
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Harga yang tertera adalah harga dasar per penumpang</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Pastikan membawa identitas asli saat naik kereta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Check-in dibuka 90 menit sebelum keberangkatan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Pembatalan tiket dikenakan biaya sesuai ketentuan</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Captcha Modal */}
      {showCaptcha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Verifikasi Manusia</h3>
            <p className="text-gray-600 mb-6">Silakan lengkapi verifikasi untuk melanjutkan.</p>
            <ReCAPTCHA
              ref={(ref) => setRecaptchaRef(ref)}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={handleRecaptchaVerify}
            />
            <button
              onClick={() => {
                setShowCaptcha(false);
                if (recaptchaRef) recaptchaRef.reset();
              }}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </>
  );
}