'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon } from '@heroicons/react/24/solid';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'sweetalert2/src/sweetalert2.scss';
import { verify } from "jsonwebtoken"

const MySwal = withReactContent(Swal);

export default function Home() {
  const [form, setForm] = useState({
    Gender: '',
    Minat_Teknologi: '',
    Minat_Seni: '',
    Minat_Bisnis: '',
    Minat_Hukum: '',
    Minat_Kesehatan: '',
    Minat_Sains: '',
    Problem_Solving: '',
    Kreativitas: '',
    Kepemimpinan: '',
    Kerja_Tim: '',
  });

  const [hasil, setHasil] = useState<string[][]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [selectedMajor, setSelectedMajor] = useState('');
  const [majorDetail, setMajorDetail] = useState<{ name: string, description: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleShowDetail = async (majorName: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/major/${majorName}`);
      if (!res.ok) throw new Error('Gagal mengambil deskripsi');
      const data = await res.json();
      setMajorDetail(data);
      setShowModal(true);
    } catch (error) {
      MySwal.fire('Error', 'Gagal memuat detail jurusan', 'error');
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      MySwal.fire({
        icon: 'warning',
        title: 'Login Diperlukan',
        text: 'Anda harus login terlebih dahulu!',
      });
      router.replace('/');
    } else {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (Object.values(form).some(value => !value)) {
      MySwal.fire('Peringatan', 'Harap isi semua pertanyaan!', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const userRes = await fetch('http://localhost:3001/api/user/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth');
          throw new Error('Sesi berakhir, login ulang');
        }
        throw new Error('Gagal mengambil data user');
      }

      const userData = await userRes.json();
      const userId = userData.id;

      const predictionRes = await fetch('http://localhost:3001/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!predictionRes.ok) {
        const err = await predictionRes.json();
        throw new Error(err.error || 'Gagal memproses prediksi');
      }

      const predictionData = await predictionRes.json();
      const top3 = predictionData.result || [];
      setHasil(Array.isArray(top3) ? top3 : []);

      const answers = Object.entries(form).map(([question, answer]) => ({ question, answer }));
      const recommendations = top3.map(([majorName, score]: [string, string]) => ({
        majorName,
        score: parseFloat(score) || 0
      }));

      const saveRes = await fetch('http://localhost:3001/api/predict/save-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, answers, recommendations })
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Gagal menyimpan hasil');
      }

      MySwal.fire('Sukses', 'Prediksi berhasil disimpan!', 'success');

    } catch (error: any) {
      MySwal.fire('Gagal', error.message || 'Terjadi kesalahan', 'error');
      if (error.message.includes('token') || error.message.includes('login')) {
        localStorage.removeItem('token');
        router.push('/auth');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToProfile = () => {
    router.push('/profile');
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setDropdownOpen(false);
    router.push('/');
  };

  const pilihanYaTidak = ['Ya', 'Tidak'];
  const pilihanLevel = ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];
  const pilihanGender = ['Laki-laki', 'Perempuan'];

  if (loading || isSubmitting) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="text-gray-600 text-lg">Memuat...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10 bg-gradient-to-br from-blue-50 to-blue-100 relative">
      {isLoggedIn && (
        <div className="absolute top-4 right-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-full shadow hover:bg-gray-100 transition"
          >
            <UserIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Akun</span>
          </button>

          {dropdownOpen && (
            <div className="mt-2 absolute right-0 bg-white border rounded-lg shadow w-40 z-10 overflow-hidden">
              <button
                onClick={handleGoToProfile}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
              >
                Profil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-blue-800 mb-10">Rekomendasi Jurusan Kuliah</h1>

        <div className="grid gap-6 bg-white p-6 rounded-xl shadow-md">
          {Object.keys(form).map((key) => (
            <div key={key}>
              <label className="block mb-1 text-sm font-medium text-gray-700">{key.replaceAll('_', ' ')}</label>
              <select
                name={key}
                onChange={handleChange}
                className="w-full p-2 border dark:text-gray-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              >
                <option value="" className=''>-- Pilih --</option>
                {(key === 'Gender'
                  ? pilihanGender
                  : ['Minat_Teknologi', 'Minat_Seni', 'Minat_Bisnis', 'Minat_Hukum', 'Minat_Kesehatan', 'Minat_Sains'].includes(key)
                    ? pilihanYaTidak
                    : pilihanLevel
                ).map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.values(form).some(value => !value)}
            className={`py-2 px-4 rounded-md font-semibold transition duration-200 ${isSubmitting || Object.values(form).some(value => !value)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {isSubmitting ? 'Memproses...' : 'Prediksi Jurusan'}
          </button>
        </div>

        {hasil.length > 0 && (
          <div className="mt-6 p-6 bg-green-50 border border-green-300 text-green-800 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-2">Top-3 Rekomendasi Jurusan:</h2>
            <ol className="list-decimal pl-5 space-y-1">
              {hasil.map(([jurusan]) => (
                <li key={jurusan} className="flex justify-between items-center">
                  <span>{jurusan}</span>
                  <button
                    onClick={() => handleShowDetail(jurusan)}
                    className="ml-4 text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    Lihat Detail
                  </button>
                </li>
              ))}
            </ol>
          </div>
          
        )}
      </div>
      {showModal && majorDetail && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h3 className="text-xl font-bold mb-2">{majorDetail.name}</h3>
      <p className="text-gray-700">{majorDetail.description}</p>
      <div className="mt-4 text-right">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}