// 'use client';

// import Navbar from '@/components/Navbar';
// import Link from 'next/link';
// import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
// import { useRouter } from 'next/navigation';

// const trains = [
//   {
//     id: 1,
//     name: 'Argo Semeru (6)',
//     departure: '06:20 Gambir (GMR)',
//     arrival: '12:45 Yogyakarta (YK)',
//     duration: '6j 25m',
//     price: 705000,
//     available: true,
//   },
//   {
//     id: 2,
//     name: 'Argo Semeru (6CS)',
//     departure: '06:20 Gambir (GMR)',
//     arrival: '12:45 Yogyakarta (YK)',
//     duration: '6j 25m',
//     price: 1680000,
//     available: true,
//   },
//   {
//     id: 3,
//     name: 'Taksaka (46)',
//     departure: '07:45 Gambir (GMR)',
//     arrival: '14:10 Yogyakarta (YK)',
//     duration: '6j 25m',
//     price: 650000,
//     available: false,
//   },
// ];

// export default function TrainList() {
//   const { executeRecaptcha } = useGoogleReCaptcha();
//   const router = useRouter();

//   const handleSelect = async (trainId) => {
//     if (!executeRecaptcha) {
//       console.error("Recaptcha belum siap");
//       return;
//     }

//     try {
//       // Ambil token dari Google
//       const token = await executeRecaptcha("select_train");

//       // Verifikasi ke backend
//       const res = await fetch("/api/verify-captcha", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token }),
//       });

//       const data = await res.json();

//       if (data.success && data.score > 0.5) {
//         // ✅ Kalau captcha valid → redirect ke waiting room
//         router.push(`/waiting-room?train=${trainId}`);
//       } else {
//         alert("Verifikasi Captcha gagal ❌");
//       }
//     } catch (err) {
//       console.error("Captcha error:", err);
//       alert("Terjadi kesalahan. Coba lagi.");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />

//       <section className="max-w-5xl mx-auto px-6 py-16">
//         <h1 className="text-2xl font-bold mb-6">Pilih Jadwal Kereta 🚄</h1>

//         <div className="grid gap-6">
//           {trains.map((train) => (
//             <div
//               key={train.id}
//               className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition flex justify-between items-center"
//             >
//               <div>
//                 <h2 className="text-lg font-semibold">{train.name}</h2>
//                 <p className="text-gray-600">
//                   {train.departure} → {train.arrival}
//                 </p>
//                 <p className="text-sm text-gray-500">{train.duration}</p>
//               </div>
//               <div className="text-right">
//                 <p className="font-bold text-brand text-lg">
//                   Rp{train.price.toLocaleString("id-ID")}
//                 </p>
//                 {train.available ? (
//                   <button
//                     onClick={() => handleSelect(train.id)}
//                     className="mt-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover transition"
//                   >
//                     Pilih
//                   </button>
//                 ) : (
//                   <span className="mt-2 inline-block bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm">
//                     Habis
//                   </span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         <Link
//           href="/dashboard"
//           className="mt-8 inline-block text-gray-600 hover:text-brand transition"
//         >
//           ← Kembali ke Dashboard
//         </Link>
//       </section>
//     </div>
//   );
// }



'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const trains = [
  { id: 1, name: 'Argo Semeru (6)', departure: '06:20 Gambir (GMR)', arrival: '12:45 Yogyakarta (YK)', duration: '6j 25m', price: 705000, available: true },
  { id: 2, name: 'Argo Semeru (6CS)', departure: '06:20 Gambir (GMR)', arrival: '12:45 Yogyakarta (YK)', duration: '6j 25m', price: 1680000, available: true },
  { id: 3, name: 'Taksaka (46)', departure: '07:45 Gambir (GMR)', arrival: '14:10 Yogyakarta (YK)', duration: '6j 25m', price: 650000, available: false },
];

export default function TrainList() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const router = useRouter();
  const [failedAttempts, setFailedAttempts] = useState(0); // 👈 tracking gagal

  const handleSelect = async (trainId) => {
    if (!executeRecaptcha) {
      console.error("Recaptcha belum siap");
      return;
    }

    try {
      const token = await executeRecaptcha("select_train");

      const res = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.success && data.score > 0.5) {
        // ✅ Kalau captcha valid → redirect ke waiting room
        router.push(`/waitingroom?train=${trainId}`);
      } else {
        // ❌ Gagal verifikasi
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);

        if (newFailed >= 5) {
          // Kalau sudah gagal >= 5 kali → redirect ke alert
          router.push("/alert");
        } else {
          alert(`Verifikasi Captcha gagal ❌ (Percobaan: ${newFailed}/5)`);
        }
      }
    } catch (err) {
      console.error("Captcha error:", err);
      alert("Terjadi kesalahan. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-6">Pilih Jadwal Kereta 🚄</h1>

        <div className="grid gap-6">
          {trains.map((train) => (
            <div
              key={train.id}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">{train.name}</h2>
                <p className="text-gray-600">
                  {train.departure} → {train.arrival}
                </p>
                <p className="text-sm text-gray-500">{train.duration}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand text-lg">
                  Rp{train.price.toLocaleString("id-ID")}
                </p>
                {train.available ? (
                  <button
                    onClick={() => handleSelect(train.id)}
                    className="mt-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover transition"
                  >
                    Pilih
                  </button>
                ) : (
                  <span className="mt-2 inline-block bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm">
                    Habis
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="mt-8 inline-block text-gray-600 hover:text-brand transition"
        >
          ← Kembali ke Dashboard
        </Link>
      </section>
    </div>
  );
}
