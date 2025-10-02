"use client";
import { useSearchParams } from "next/navigation";

export default function WaitingRoom() {
  const params = useSearchParams();
  const trainId = params.get("train");

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="p-8 bg-white rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Berhasil Masuk Waiting Room</h1>
        <p className="text-gray-700">Anda sedang menunggu antrian untuk kereta dengan ID: {trainId}</p>
      </div>
    </div>
  );
}
