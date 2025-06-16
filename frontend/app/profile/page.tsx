'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'sweetalert2/src/sweetalert2.scss';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon, Mail, LogOut, ChevronDown, Trash2, HelpCircle, FileText, Target, Calendar, BarChart2, Loader2, AlertCircle, Info
} from 'lucide-react';

// --- INITIALIZATION ---
const MySwal = withReactContent(Swal);

// --- TYPE DEFINITIONS ---
interface User {
  id: number;
  nama: string;
  email: string;
}
interface Recommendation {
  id: number;
  score: number;
  major: { name: string; };
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

// --- CONSTANTS ---
const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#f59e0b', '#10b981', '#0891b2'];

// --- API HELPER ---
const handleApiResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response:', text);
    throw new Error('Respons dari server bukan format JSON. Periksa kembali endpoint API.');
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return data;
};

// --- UI COMPONENTS ---

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      <p className="text-slate-600">Memuat profil Anda...</p>
    </div>
  </div>
);

const ErrorScreen = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
    <div className="w-full max-w-md text-center">
      <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
      <h1 className="mt-4 text-2xl font-bold text-slate-800">Gagal Memuat Data</h1>
      <p className="mt-2 text-slate-600">Terjadi kesalahan saat mengambil data profil. Ini mungkin karena server tidak aktif atau masalah jaringan.</p>
      <button onClick={onRetry} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
        Coba Lagi
      </button>
    </div>
  </div>
);

const ProfileHeader = React.memo(({ onGoToQuestionnaire, onLogout }: { onGoToQuestionnaire: () => void; onLogout: () => void; }) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">Profil & Riwayat</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGoToQuestionnaire} className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition text-sm">
            <FileText size={16} /> Prediksi Baru
          </button>
          <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  </header>
));
ProfileHeader.displayName = 'ProfileHeader';

const ProfileInfo = React.memo(({ user, historyCount }: { user: User | null; historyCount: number; }) => (
  <section aria-labelledby="profile-overview-title">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.nama?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h2 id="profile-overview-title" className="text-2xl font-bold text-slate-800">{user?.nama}</h2>
            <p className="text-slate-500">Selamat datang kembali!</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <UserIcon className="w-5 h-5 text-indigo-500" />
            <span className="text-slate-700 font-medium">{user?.nama}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="w-5 h-5 text-indigo-500" />
            <span className="text-slate-700 font-medium break-all">{user?.email}</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
        <p className="text-sm text-slate-500">Total Prediksi Dilakukan</p>
        <div className="flex items-baseline gap-2 mt-2">
           <p className="text-5xl font-bold text-indigo-600">{historyCount}</p>
           <span className="text-slate-600">Sesi</span>
        </div>
      </div>
    </div>
  </section>
));
ProfileInfo.displayName = 'ProfileInfo';

const SessionDetails = React.memo(({ session, onShowDetail }: { session: PredictionSession; onShowDetail: (majorName: string) => void; }) => {
    const pieData = useMemo(() => session.recommendations.map(rec => ({
        name: rec.major.name,
        value: rec.score,
    })), [session.recommendations]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-4">
            <div className="lg:col-span-2">
                 <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <BarChart2 size={18} /> Visualisasi Skor
                </h4>
                <div className="h-64 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                                {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                            </Pie>
                            <Tooltip
                              formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                              contentStyle={{
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  backdropFilter: 'blur(5px)',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '0.75rem',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                  color: '#334155'
                              }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="lg:col-span-3">
                 <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Target size={18} /> Peringkat Rekomendasi
                </h4>
                <div className="mt-3 space-y-3">
                    {session.recommendations.map((rec, i) => (
                        <div key={rec.id} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between gap-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-2 h-8 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}/>
                                 <div>
                                    <p className="font-semibold text-slate-800">{rec.major.name}</p>
                                    <p className="text-sm text-slate-500">Kesesuaian: <span className="font-bold text-indigo-600">{(rec.score * 100).toFixed(1)}%</span></p>
                                 </div>
                               </div>
                                <button onClick={() => onShowDetail(rec.major.name)} className="flex-shrink-0 items-center gap-1.5 text-xs px-3 py-1.5 bg-white text-indigo-700 font-semibold rounded-full shadow-sm border border-slate-200 hover:bg-slate-100 transition">
                                    <Info size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
});
SessionDetails.displayName = 'SessionDetails';

const SessionCard = React.memo(({ session, isActive, onToggle, onShowAnswers, onDelete, onShowDetail, isDeleting }: {
  session: PredictionSession;
  isActive: boolean;
  onToggle: () => void;
  onShowAnswers: () => void;
  onDelete: () => void;
  onShowDetail: (majorName: string) => void;
  isDeleting: boolean;
}) => {
  const formattedDate = useMemo(() => new Date(session.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }), [session.createdAt]);
  
  return (
    <motion.div
      layout
      initial={{ borderRadius: 16 }}
      className="bg-white p-4 border border-slate-200 shadow-sm"
    >
      <motion.div layout="position" className="flex justify-between items-center cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
                <p className="font-semibold text-slate-800">
                  Sesi Prediksi #{session.id}
                  <span className="ml-2 text-xs font-normal text-slate-500">{formattedDate}</span>
                </p>
                <p className="text-sm text-slate-500">Rekomendasi teratas: <span className="font-medium text-indigo-600">{session.recommendations[0]?.major.name}</span></p>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onShowAnswers(); }} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><FileText size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={isDeleting} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
              {isDeleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>}
            </button>
            <motion.div animate={{ rotate: isActive ? 180 : 0 }} className="ml-2">
                <ChevronDown className="w-5 h-5 text-slate-500" />
            </motion.div>
        </div>
      </motion.div>
      <AnimatePresence>
        {isActive && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-slate-200" />
            <SessionDetails session={session} onShowDetail={onShowDetail} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
SessionCard.displayName = 'SessionCard';

const PredictionHistory = React.memo(({ history, onShowAnswers, onDelete, onShowDetail, deletingSessionId, onGoToQuestionnaire }: {
  history: PredictionSession[];
  onShowAnswers: (session: PredictionSession) => void;
  onDelete: (sessionId: number) => void;
  onShowDetail: (majorName: string) => void;
  deletingSessionId: number | null;
  onGoToQuestionnaire: () => void;
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0); // Buka item pertama secara default

  const handleToggle = useCallback((index: number) => {
    setActiveIndex(prevIndex => (prevIndex === index ? null : index));
  }, []);
  
  if (history.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <HelpCircle className="w-16 h-16 mx-auto text-slate-400" />
        <h3 className="mt-4 text-xl font-bold text-slate-800">Belum Ada Riwayat</h3>
        <p className="mt-2 text-slate-500">Mulai prediksi pertama Anda untuk melihat rekomendasi jurusan di sini.</p>
        <button onClick={onGoToQuestionnaire} className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
          🚀 Mulai Prediksi
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="prediction-history-title">
        <h2 id="prediction-history-title" className="text-xl font-bold text-slate-800 mb-4">Riwayat Prediksi</h2>
        <motion.div layout className="space-y-4">
            {history.map((session, index) => (
                <SessionCard
                    key={session.id}
                    session={session}
                    isActive={activeIndex === index}
                    isDeleting={deletingSessionId === session.id}
                    onToggle={() => handleToggle(index)}
                    onShowAnswers={() => onShowAnswers(session)}
                    onDelete={() => onDelete(session.id)}
                    onShowDetail={onShowDetail}
                />
            ))}
        </motion.div>
    </section>
  );
});
PredictionHistory.displayName = 'PredictionHistory';


// --- MAIN PAGE COMPONENT ---
export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<PredictionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const profileRes = await fetch('http://localhost:3001/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      const userData = await handleApiResponse(profileRes);
      setUser(userData);
      
      if (userData?.id) {
        const historyRes = await fetch(`http://localhost:3001/api/predict/history/${userData.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const historyData = await handleApiResponse(historyRes);
        const sortedHistory = (historyData.success ? historyData.data : historyData) || [];
        setHistory(Array.isArray(sortedHistory) ? sortedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
      }
    } catch (err) {
      console.error('❌ Fetch Error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = useCallback(() => {
    MySwal.fire({
      title: 'Konfirmasi Logout', text: 'Apakah Anda yakin ingin keluar?', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Ya, Logout', cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        router.push('/auth');
      }
    });
  }, [router]);
  
  const handleShowDetail = useCallback(async (majorName: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/major/${encodeURIComponent(majorName)}`);
      const data = await handleApiResponse(res);
      MySwal.fire({
        title: `🎓 ${data.name}`,
        html: `<div style="padding: 0 1rem; text-align: left; line-height: 1.6; color: #475569;">${data.description}</div>`,
        icon: 'info',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#4f46e5',
        width: '600px',
      });
    } catch (error) {
      console.error('❌ Error fetching major details:', error);
      MySwal.fire({
        icon: 'error', title: 'Error',
        text: 'Gagal memuat detail jurusan. Pastikan server API berjalan dengan benar.',
        confirmButtonColor: '#dc2626',
      });
    }
  }, []);

  const handleShowAnswers = useCallback((session: PredictionSession) => {
     MySwal.fire({
        title: `Jawaban Sesi #${session.id}`,
        html: (
            <div className="text-left max-h-[50vh] overflow-y-auto p-1">
                {session.answers.map((a, i) => (
                    <div key={i} className="mb-3 p-3 bg-slate-100 rounded-lg">
                        <p className="font-semibold text-sm text-slate-800">{i+1}. {a.question.replace(/_/g, ' ')}</p>
                        <p className="text-slate-600 mt-1">{a.answer}</p>
                    </div>
                ))}
            </div>
        ),
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#4f46e5'
     });
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: number) => {
    const result = await MySwal.fire({
      title: 'Hapus Sesi Ini?', text: "Tindakan ini tidak dapat dibatalkan.", icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    });
    if (!result.isConfirmed) return;
    
    setDeletingSessionId(sessionId);
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3001/api/predict/history/${sessionId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      setHistory(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('❌ Delete Error:', error);
      MySwal.fire('Gagal', 'Gagal menghapus sesi riwayat.', 'error');
    } finally {
      setDeletingSessionId(null);
    }
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <ProfileHeader
        onGoToQuestionnaire={() => router.push('/kuesioner')}
        onLogout={handleLogout}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <ProfileInfo user={user} historyCount={history.length} />
          <PredictionHistory
            history={history}
            onShowAnswers={handleShowAnswers}
            onDelete={handleDeleteSession}
            onShowDetail={handleShowDetail}
            deletingSessionId={deletingSessionId}
            onGoToQuestionnaire={() => router.push('/kuesioner')}
          />
        </div>
      </main>
    </div>
  );
}