export default function AlertPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="p-8 bg-white rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Akses Diblokir</h1>
        <p className="text-gray-700">Kami mendeteksi aktivitas mencurigakan. Silakan coba lagi nanti.</p>
      </div>
    </div>
  );
}
