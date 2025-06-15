'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'sweetalert2/src/sweetalert2.scss';

const MySwal = withReactContent(Swal);

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

interface Answer {
  question: string;
  answer: string;
}

interface PredictionSession {
  id: number;
  createdAt: string;
  recommendations: Recommendation[];
  answers: Answer[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
const GRADIENT_COLORS = [
  'from-violet-500 to-purple-600',
  'from-purple-500 to-pink-600', 
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600'
];

// Helper function untuk handle API response
const handleApiResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error('Server returned non-JSON response. Please check if the API endpoint exists.');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return data;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<PredictionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      MySwal.fire({
        icon: 'warning',
        title: 'Authentication Required',
        text: 'Anda harus login terlebih dahulu',
        confirmButtonColor: '#6366f1',
        background: '#ffffff',
        color: '#1f2937'
      }).then(() => {
        router.push('/auth');
      });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching user profile...');
        
        const res = await fetch('http://localhost:3001/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        const userData = await handleApiResponse(res);
        console.log('✅ User data received:', userData);
        setUser(userData);

        if (userData && userData.id) {
          try {
            console.log('🔄 Fetching prediction history for user ID:', userData.id);
            
            const historyRes = await fetch(`http://localhost:3001/api/predict/history/${userData.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });

            const historyData = await handleApiResponse(historyRes);
            console.log('✅ History data received:', historyData);

            if (historyData.success && historyData.data) {
              console.log('📊 Setting history data (success format):', historyData.data);
              setHistory(Array.isArray(historyData.data) ? historyData.data : []);
            } else if (Array.isArray(historyData)) {
              console.log('📊 Setting history data (array format):', historyData);
              setHistory(historyData);
            } else {
              console.log('⚠️ Unexpected history data format:', historyData);
              setHistory([]);
            }
          } catch (historyError) {
            console.error('❌ Error fetching history:', historyError);
            MySwal.fire({
              icon: 'warning',
              title: 'History Load Failed',
              text: 'Gagal memuat riwayat prediksi, namun profil tetap dapat diakses.',
              confirmButtonColor: '#f59e0b',
              background: '#ffffff',
              color: '#1f2937'
            });
          }
        }
      } catch (err) {
        console.error('❌ Error in fetchData:', err);
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
        setError(errorMessage);
        
        MySwal.fire({
          icon: 'error',
          title: 'Error Loading Profile',
          html: `
            <div style="text-align: left;">
              <p><strong>Error:</strong> ${errorMessage}</p>
              <hr style="margin: 12px 0;">
              <p style="font-size: 14px; color: #666;">
                <strong>Possible causes:</strong><br>
                • API server is not running on port 3001<br>
                • Network connection issues<br>
                • Invalid authentication token<br>
                • API endpoint doesn't exist
              </p>
            </div>
          `,
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#dc2626',
          background: '#ffffff',
          color: '#1f2937'
        }).then(() => {
          localStorage.removeItem('token');
          router.push('/auth');
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleGoToQuestionnaire = () => {
    router.push('/kuesioner');
  };

  const handleShowHistory = (session: PredictionSession) => {
    console.log('🔍 Session data clicked:', session);
    console.log('📝 Session answers:', session.answers);
    
    if (!session.answers || session.answers.length === 0) {
      MySwal.fire({
        icon: 'info',
        title: 'Data Jawaban Tidak Tersedia',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 16px;">Data jawaban untuk sesi ini tidak tersedia.</p>
            <div style="margin-top: 16px; padding: 12px; background: linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%); border-radius: 12px;">
              <p style="margin: 0; font-size: 14px; color: #4338ca;">
                <strong>💡 Saran:</strong> Coba lakukan prediksi baru untuk mendapatkan riwayat jawaban yang lengkap.
              </p>
            </div>
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#6366f1',
        background: '#ffffff',
        color: '#1f2937'
      });
      return;
    }

    showAnswersModal(session);
  };

  const showAnswersModal = (session: PredictionSession) => {
    const answersHtml = session.answers.map((answer, index) => 
      `<div style="margin-bottom: 12px; padding: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; text-align: left; border-left: 4px solid #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <strong style="color: #1e293b; display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          ${index + 1}. ${answer.question.replaceAll('_', ' ')}
        </strong>
        <span style="color: #475569; font-size: 14px; line-height: 1.5;">
          ${answer.answer}
        </span>
      </div>`
    ).join('');

    MySwal.fire({
      title: `📝 Jawaban Sesi - ${new Date(session.createdAt).toLocaleDateString('id-ID')}`,
      html: `
        <div style="max-height: 500px; overflow-y: auto; text-align: left; padding: 8px;">
          <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; text-align: center; color: white;">
            <span style="font-size: 16px; font-weight: 600;">
              ✨ Total ${session.answers.length} jawaban
            </span>
          </div>
          ${answersHtml}
        </div>
      `,
      width: '700px',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#6366f1',
      background: '#ffffff',
      color: '#1f2937'
    });
  };

  const handleShowDetail = async (majorName: string) => {
    try {
      console.log('🔄 Fetching major details for:', majorName);
      
      const res = await fetch(`http://localhost:3001/api/major/${encodeURIComponent(majorName)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await handleApiResponse(res);
      console.log('✅ Major details received:', data);
      
      MySwal.fire({
        title: `🎓 ${data.name}`,
        html: `<div style="padding: 16px; text-align: left; line-height: 1.7; color: #374151; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; margin: 8px 0;">${data.description}</div>`,
        icon: 'info',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#6366f1',
        width: '600px',
        background: '#ffffff',
        color: '#1f2937'
      });
    } catch (error) {
      console.error('❌ Error fetching major details:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat detail jurusan. Pastikan server API berjalan dengan benar.',
        confirmButtonColor: '#dc2626',
        background: '#ffffff',
        color: '#1f2937'
      });
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    const result = await MySwal.fire({
      title: '🗑️ Konfirmasi Hapus',
      text: 'Apakah Anda yakin ingin menghapus riwayat prediksi ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      color: '#1f2937'
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingSessionId(sessionId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/predict/history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        throw new Error('DELETE endpoint tidak ditemukan. Pastikan backend memiliki route DELETE /api/predict/history/:id');
      }

      if (response.status === 405) {
        throw new Error('DELETE method tidak diizinkan pada endpoint ini. Periksa route backend Anda.');
      }

      if (response.status === 204) {
        setHistory(prevHistory => prevHistory.filter(session => session.id !== sessionId));
        
        MySwal.fire({
          icon: 'success',
          title: '✅ Berhasil',
          text: 'Riwayat prediksi berhasil dihapus.',
          confirmButtonColor: '#10b981',
          background: '#ffffff',
          color: '#1f2937'
        });
        return;
      }

      const data = await handleApiResponse(response);
      setHistory(prevHistory => prevHistory.filter(session => session.id !== sessionId));
      
      MySwal.fire({
        icon: 'success',
        title: '✅ Berhasil',
        text: data.message || 'Riwayat prediksi berhasil dihapus.',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        color: '#1f2937'
      });
      
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      
      let errorMessage = 'Terjadi kesalahan saat menghapus riwayat prediksi.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      MySwal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        html: `
          <div style="text-align: left;">
            <p><strong>Error:</strong> ${errorMessage}</p>
            <hr style="margin: 12px 0;">
            <p style="font-size: 14px; color: #666;">
              <strong>Kemungkinan penyebab:</strong><br>
              • DELETE endpoint belum dibuat di backend<br>
              • Route /api/predict/history/:id tidak ada<br>
              • Method DELETE tidak diizinkan<br>
              • Server backend tidak berjalan
            </p>
          </div>
        `,
        confirmButtonColor: '#dc2626',
        width: '500px',
        background: '#ffffff',
        color: '#1f2937'
      });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleLogout = () => {
    MySwal.fire({
      title: '👋 Konfirmasi Logout',
      text: 'Apakah Anda yakin ingin keluar?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      color: '#1f2937'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        router.push('/auth');
      }
    });
  };

  if (loading && !user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/20">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-600 opacity-20 animate-pulse"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Memuat Profil</h3>
            <p className="text-gray-600">Tunggu sebentar...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops! Terjadi Kesalahan</h1>
              <p className="text-gray-600 mb-6">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth');
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                Kembali ke Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Modern Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Profil Saya
                </h1>
                <p className="text-gray-600 text-sm">Dashboard & Riwayat Prediksi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoToQuestionnaire}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                🎯 Mulai Prediksi Baru
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                👋 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* User Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-3xl font-bold">
                    {user?.nama?.charAt(0).toUpperCase() || '👤'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Informasi Akun</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto"></div>
              </div>
              
              {user ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
                    <label className="text-sm font-semibold text-indigo-600 block mb-1">Nama Lengkap</label>
                    <p className="text-gray-800 font-medium">{user.nama}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                    <label className="text-sm font-semibold text-purple-600 block mb-1">Email Address</label>
                    <p className="text-gray-800 font-medium break-all">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-gray-200 rounded-2xl"></div>
                  <div className="h-16 bg-gray-200 rounded-2xl"></div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Prediksi</p>
                    <p className="text-3xl font-bold text-indigo-600">{history.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Prediksi Terbaru</p>
                    <p className="text-lg font-bold text-purple-600">
                      {history.length > 0 
                        ? new Date(history[0].createdAt).toLocaleDateString('id-ID')
                        : 'Belum ada'
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">🕒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction History Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">📈 Riwayat Prediksi</h2>
                <p className="text-indigo-100">Lihat semua hasil prediksi jurusan Anda</p>
              </div>
              
              {history.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <span className="text-white font-semibold">{history.length} sesi tersimpan</span>
                  </div>
                  
                  <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-white text-indigo-600 font-semibold shadow-lg' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      🔲 Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-white text-indigo-600 font-semibold shadow-lg' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      📋 List
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 to-purple-600 opacity-20 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Memuat Riwayat</h3>
                <p className="text-gray-500">Mengambil data prediksi Anda...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-6xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">Belum Ada Riwayat Prediksi</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Mulai prediksi jurusan pertama Anda untuk melihat rekomendasi yang dipersonalisasi
                </p>
                <button
                  onClick={handleGoToQuestionnaire}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                >
                  🚀 Mulai Prediksi Pertama
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'space-y-8' : 'space-y-6'}>
                {history.map((session, sessionIndex) => (
                  <div 
                    key={session.id} 
                    className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                  >
                    {/* Session Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">#{session.id}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Sesi Prediksi #{session.id}</h3>
                            <p className="text-indigo-100 text-sm">
                              📅 {new Date(session.createdAt).toLocaleString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowHistory(session)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2"
                          >
                            📝 Lihat Jawaban
                            <span className="bg-white/30 text-xs px-2 py-1 rounded-full">
                              {session.answers?.length || 0}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            disabled={deletingSessionId === session.id}
                            className="bg-red-500/80 hover:bg-red-600/80 disabled:bg-red-400/60 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2"
                          >
                            {deletingSessionId === session.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Menghapus...
                              </>
                            ) : (
                              <>🗑️ Hapus</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Session Content */}
                    <div className="p-6">
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                          {/* Chart Section */}
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                              📊 Visualisasi Hasil
                            </h4>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={session.recommendations.map((rec) => ({
                                      name: rec.major.name,
                                      value: rec.score,
                                      fullName: rec.major.name
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={40}
                                    dataKey="value"
                                    labelLine={false}
                                    label={({value}) => `${(Number(value) * 100).toFixed(1)}%`}
                                  >
                                    {session.recommendations.map((_, i) => (
                                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    formatter={(value, name) => [
                                      `${(Number(value) * 100).toFixed(2)}%`, 
                                      'Tingkat Kesesuaian'
                                    ]}
                                    labelFormatter={(label) => `Jurusan: ${label}`}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Recommendations List */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                              🎯 Rekomendasi Jurusan
                            </h4>
                            <div className="space-y-3">
                              {session.recommendations.map((rec, i) => (
                                <div 
                                  key={i} 
                                  className="group bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-4 h-4 rounded-full shadow-lg"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                      />
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                          #{i + 1}
                                        </span>
                                        <span className="font-bold text-gray-800">
                                          {rec.major.name}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <div className="font-bold text-lg text-indigo-600">
                                          {(rec.score * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">kesesuaian</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  <div className="mb-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full bg-gradient-to-r ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} transition-all duration-1000 ease-out`}
                                        style={{ width: `${rec.score * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleShowDetail(rec.major.name)}
                                    className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200 text-sm group-hover:shadow-md"
                                  >
                                    📖 Lihat Detail Jurusan
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* List View */
                        <div className="space-y-6">
                          {/* Compact Chart */}
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-4">📊 Hasil Prediksi</h4>
                                <div className="h-48">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={session.recommendations.map((rec) => ({
                                      name: rec.major.name.length > 15 ? rec.major.name.substring(0, 15) + '...' : rec.major.name,
                                      fullName: rec.major.name,
                                      value: rec.score * 100
                                    }))}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" fontSize={12} />
                                      <YAxis fontSize={12} />
                                      <Tooltip 
                                        formatter={(value, name) => [`${Number(value).toFixed(2)}%`, 'Kesesuaian']}
                                        labelFormatter={(label) => `Jurusan: ${session.recommendations.find(r => r.major.name.startsWith(label.replace('...', '')))?.major.name || label}`}
                                      />
                                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg mb-4">🏆 Ranking Teratas</h4>
                                <div className="space-y-3">
                                  {session.recommendations.slice(0, 3).map((rec, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                        i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-500'
                                      }`}>
                                        {i + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-800">{rec.major.name}</div>
                                        <div className="text-sm text-gray-600">{(rec.score * 100).toFixed(1)}% kesesuaian</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Recommendations */}
                          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <h4 className="font-bold text-gray-800 text-lg mb-4">🎯 Detail Rekomendasi</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {session.recommendations.map((rec, i) => (
                                <div key={i} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                      />
                                      <span className="font-semibold text-gray-800">{rec.major.name}</span>
                                    </div>
                                    <span className="font-bold text-indigo-600">{(rec.score * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                    <div 
                                      className={`h-2 rounded-full bg-gradient-to-r ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]}`}
                                      style={{ width: `${rec.score * 100}%` }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleShowDetail(rec.major.name)}
                                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-3 rounded-lg transition-all duration-200 w-full"
                                  >
                                    📖 Detail
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}