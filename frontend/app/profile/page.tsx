'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface User {
  id: number;
  nama: string;
  email: string;
}

interface Recommendation {
  id: number;
  score: number;
  major: {
    name: string;
  };
}

interface PredictionSession {
  id: number;
  createdAt: string;
  recommendations: Recommendation[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a29bfe', '#fd79a8'];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<PredictionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda harus login terlebih dahulu');
      router.push('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('http://localhost:3001/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mendapatkan profil');
        }

        setUser(data);

        if (data && data.id) {
          try {
            const historyRes = await fetch(`http://localhost:3001/api/predict/history/${data.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            const historyData = await historyRes.json();
            if (!historyRes.ok) {
              throw new Error(historyData.error || 'Gagal mengambil riwayat prediksi');
            }

            setHistory(Array.isArray(historyData) ? historyData : []);
          } catch (historyError) {
            console.error('Error fetching history:', historyError);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
        setError(errorMessage);
        console.error('Error in fetchData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleGoToQuestionnaire = () => {
    router.push('/kuesioner');
  };

  if (loading && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow max-w-md w-full text-center">
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Kembali ke Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-8">
      <div className="bg-white p-8 rounded shadow max-w-md w-full mb-6">
        <h1 className="text-xl font-bold text-blue-700 mb-4">Profil Pengguna</h1>
        {user ? (
          <div className="space-y-2 text-black">
            <p><strong>Nama:</strong> {user.nama}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p>Memuat profil...</p>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow max-w-md w-full mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Riwayat Prediksi</h2>
        {loading ? (
          <p className="text-center text-gray-500">Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <p>Belum ada riwayat prediksi.</p>
        ) : (
          history.map((session, index) => (
            <div key={session.id} className="mb-6 border p-4 rounded bg-white shadow">
              <p className="text-sm text-black mb-2">
                Tanggal: {new Date(session.createdAt).toLocaleString('id-ID')}
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
  <div className="w-full sm:w-1/2 h-52">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={session.recommendations.map((rec) => ({
            name: rec.major.name,
            value: rec.score,
          }))}
          cx="50%"
          cy="50%"
          outerRadius={60}
          dataKey="value"
          labelLine={false}
        >
          {session.recommendations.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

  <div className="flex-1">
    <ul className="space-y-1 text-sm text-gray-800">
      {session.recommendations.map((rec, i) => (
        <li key={i} className="flex items-center justify-between text-xs border-b pb-1">
          <span className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {rec.major.name}
          </span>
          <span>{(rec.score*100).toFixed(2)}%</span>
        </li>
      ))}
    </ul>
  </div>
</div>

            </div>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleGoToQuestionnaire}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded"
        >
          Kembali ke Kuesioner
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/auth');
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-4 rounded"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
