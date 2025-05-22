'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setMounted(true);
  }, []);

  const handleStart = () => {
    router.push('/auth');
  };

  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="bg-blue-50 py-20 px-6 md:px-12 overflow-hidden">
        <div
          className={`max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 transform transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-700 leading-tight mb-6">
              Temukan Jurusan Kuliah <br className="hidden md:block" /> yang Tepat untuk Masa Depanmu
            </h1>
            <p className="text-lg mb-6 text-gray-700">
              Sistem ini membantumu menentukan jurusan berdasarkan minat, kepribadian, dan kemampuan.
              Ditenagai oleh algoritma <strong>Decision Tree</strong> untuk hasil rekomendasi yang akurat.
            </p>
            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              Mulai Kuesioner
            </button>
          </div>

          <div className="md:w-1/2 animate-fade-in">
            <img
              src="https://img.freepik.com/free-vector/online-test-concept-illustration_114360-4666.jpg?w=826&t=st=1685730000~exp=1685730600~hmac=7fce2b1731f76c6bd4ea234db8ff3e6b9476f3dbab07cb5e0285e9d9f34a50f5"
              alt="Ilustrasi kuisioner"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-12">Kenapa Menggunakan Sistem Ini?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-6 rounded-lg shadow hover:shadow-lg transition transform hover:-translate-y-1 bg-blue-50">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Akurat & Terbukti</h3>
              <p className="text-gray-600">
                Menggunakan dataset besar dan algoritma Machine Learning untuk hasil rekomendasi yang tepat.
              </p>
            </div>
            <div className="p-6 rounded-lg shadow hover:shadow-lg transition transform hover:-translate-y-1 bg-blue-50">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Personalisasi</h3>
              <p className="text-gray-600">
                Setiap rekomendasi disesuaikan dengan minat, kepribadian, dan jawaban kamu secara menyeluruh.
              </p>
            </div>
            <div className="p-6 rounded-lg shadow hover:shadow-lg transition transform hover:-translate-y-1 bg-blue-50">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Mudah Digunakan</h3>
              <p className="text-gray-600">
                Proses cepat dan antarmuka yang ramah pengguna — siapa pun bisa menggunakannya dengan mudah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Siap Memulai Menentukan Masa Depanmu?</h2>
          <p className="text-lg mb-6">
            Yuk, mulai kuisioner dan temukan jurusan kuliah yang paling sesuai dengan potensimu!
          </p>
          <button
            onClick={handleStart}
            className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            Mulai Sekarang
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-600 text-white text-center py-6">
        <p>&copy; {new Date().getFullYear()} Sistem Rekomendasi Jurusan - Made by Muhammad Rizky</p>
      </footer>
    </main>
  );
}
