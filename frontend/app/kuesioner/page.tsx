'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    UserIcon, 
    XMarkIcon, 
    AcademicCapIcon, 
    ChartBarIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    ArrowRightIcon,
    ChevronDownIcon, // ikon baru
    ArrowLeftStartOnRectangleIcon, // ikon baru
    UserCircleIcon // ikon baru
} from '@heroicons/react/24/solid';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'sweetalert2/src/sweetalert2.scss';
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion

const MySwal = withReactContent(Swal);

// ... (Interface dan komponen lainnya tetap sama)
// Type definitions for better type safety
interface PredictionResult {
  majorName: string;
  score: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  prediction?: string;
  result: PredictionResult[];
  top3: [string, number][];
}

// --- KOMPONEN BARU & MODERN: UserMenu ---
const UserMenu = ({ onProfileClick, onLogoutClick }: { onProfileClick: () => void; onLogoutClick: () => void; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Menutup dropdown jika klik di luar area
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all duration-300 group"
            >
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                    <UserIcon className="h-5 w-5 text-white" />
                </div>
                {/* Teks hanya muncul di layar medium ke atas */}
                <span className="hidden md:inline text-sm font-semibold text-gray-700 pr-1">
                    Akun Saya
                </span>
                <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:text-blue-600 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={dropdownVariants}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="absolute right-0 mt-2 w-56 origin-top-right bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    >
                        <div className="py-2 px-2">
                            <button
                                onClick={onProfileClick}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                            >
                                <UserCircleIcon className="h-5 w-5" />
                                <span>Profil Saya</span>
                            </button>
                            <div className="h-px bg-gray-200 my-1 mx-2"></div>
                            <button
                                onClick={onLogoutClick}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                            >
                                <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


// Progress Bar Component
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">Progress Kuesioner</span>
        <span className="text-sm font-bold text-blue-600">{current}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full bg-white opacity-30 animate-pulse"></div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        {percentage.toFixed(0)}% Selesai
      </div>
    </div>
  );
};

// --- KOMPONEN BARU: ModernRadio untuk "Ya/Tidak" ---
const ModernRadio = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: string[];
  required?: boolean;
}) => {
  const isCompleted = value !== '';

  return (
    <div className="group">
      <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-xl">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(name, option)}
            className={`w-full text-center px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
              value === option
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- KOMPONEN BARU: ModernSegmentedControl untuk "Sangat Rendah - Sangat Tinggi" ---
const ModernSegmentedControl = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: string[];
  required?: boolean;
}) => {
  return (
    <div className="group">
        <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
            <span>{label}</span>
            {required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-5 gap-1 p-1.5 bg-gray-100 rounded-xl">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onChange(name, option)}
                    className={`text-center px-2 py-3 rounded-lg transition-all duration-300 font-medium text-xs sm:text-sm ${
                        value === option
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
  );
};


// Enhanced Input Component
const ModernSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  icon,
  required = true 
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  options: string[];
  icon?: React.ReactNode;
  required?: boolean;
}) => {
  const isCompleted = value !== '';
  
  return (
    <div className="group">
      <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
        {icon}
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full p-4 pr-12 border-2 rounded-xl transition-all duration-300 text-gray-700 bg-white shadow-sm hover:shadow-md focus:shadow-lg focus:outline-none ${
            isCompleted
              ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-100'
              : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
          }`}
          required={required}
        >
          <option value="" className="text-gray-400">-- Pilih jawaban --</option>
          {options.map((option, index) => (
            <option key={index} value={option} className="text-gray-900 py-2">
              {option}
            </option>
          ))}
        </select>
        {isCompleted && (
          <CheckCircleIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
        {!isCompleted && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernNumberInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  icon,
  required = true 
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
  required?: boolean;
}) => {
  const isCompleted = value !== '';
  const numValue = parseFloat(value);
  const isValid = !isNaN(numValue) && numValue >= min && numValue <= max;
  
  return (
    <div className="group">
      <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 group-focus-within:text-blue-600 transition-colors">
        {icon}
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step="0.01"
          placeholder={`Masukkan nilai (${min}-${max})`}
          className={`w-full p-4 pr-12 border-2 rounded-xl transition-all duration-300 text-gray-700 bg-white shadow-sm hover:shadow-md focus:shadow-lg focus:outline-none ${
            isCompleted && isValid
              ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-100'
              : isCompleted && !isValid
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
          }`}
          required={required}
        />
        {isCompleted && isValid && (
          <CheckCircleIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
        {isCompleted && !isValid && (
          <XMarkIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
        )}
      </div>
      {isCompleted && !isValid && (
        <p className="text-red-500 text-xs mt-1">Nilai harus antara {min}-{max}</p>
      )}
    </div>
  );
};

// Modal Component untuk Hasil Prediksi (Enhanced)
const ResultModal = ({ isOpen, onClose, hasil, onShowDetail }: {
  isOpen: boolean;
  onClose: () => void;
  hasil: PredictionResult[];
  onShowDetail: (majorName: string) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Enhanced Backdrop */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-md transition-all"
        onClick={onClose}
      ></div>
      
      {/* Modal with enhanced animations */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all w-full max-w-3xl animate-in slide-in-from-bottom duration-500">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 px-8 py-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <AcademicCapIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    🎓 Rekomendasi Jurusan
                  </h3>
                  <p className="text-blue-100 text-sm">Berdasarkan analisis mendalam</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
              >
                <XMarkIcon className="h-6 w-6 text-white group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="px-8 py-8">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-4">
                <SparklesIcon className="h-5 w-5 text-blue-600" />
                <span className="text-blue-700 font-medium">Hasil Analisis Selesai</span>
              </div>
              <p className="text-gray-600 text-lg">
                Berdasarkan jawaban Anda, berikut adalah 3 jurusan yang paling cocok:
              </p>
            </div>

            <div className="space-y-6">
              {hasil.map((item, index) => (
                <div
                  key={item.majorName}
                  className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-gradient-to-r from-white via-gray-50 to-white p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-500 hover:-translate-y-1"
                >
                  {/* Enhanced Ranking Badge */}
                  <div className="absolute -top-2 -left-2">
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg shadow-lg border-4 border-white
                      ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 
                        'bg-gradient-to-br from-orange-400 to-red-500'}
                    `}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="ml-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {item.majorName}
                      </h4>
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                        <ChartBarIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700 font-bold">{(item.score * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`
                            h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden
                            ${index === 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                              index === 1 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' : 
                              'bg-gradient-to-r from-purple-400 to-pink-500'}
                          `}
                          style={{ width: `${(item.score * 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onShowDetail(item.majorName)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-all duration-200 hover:scale-105 group/btn"
                    >
                      <span>Lihat Detail Jurusan</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Enhanced Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 via-purple-50 to-transparent rounded-bl-full opacity-60"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-50 to-transparent rounded-tr-full opacity-40"></div>
                </div>
              ))}
            </div>

            {/* Enhanced Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  <span className="font-semibold text-blue-700">💡 Catatan:</span> Rekomendasi berdasarkan analisis minat dan kemampuan Anda. <br />
                  Hasil rekomendasi ini akan tersimpan di menu profil untuk referensi masa depan.
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="bg-gray-50 px-8 py-6 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-8 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


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
    'nilai akhir SMA/SMK': ''
  });

  const [hasil, setHasil] = useState<PredictionResult[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [dropdownOpen, setDropdownOpen] = useState(false); // Dihapus, sekarang diatur oleh UserMenu
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  // const dropdownRef = useRef<HTMLDivElement>(null); // Dihapus, sekarang diatur oleh UserMenu
  const router = useRouter();

  // Get completion status
  const completedFields = Object.values(form).filter(value => value !== '').length;
  const totalFields = Object.keys(form).length;
  const isFormComplete = completedFields === totalFields;

  const handleShowDetail = async (majorName: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/predict/major/${encodeURIComponent(majorName)}`);
      if (!res.ok) {
        throw new Error('Gagal mengambil detail jurusan');
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengambil detail jurusan');
      }
      
      MySwal.fire({
        title: data.name,
        html: `<p style="text-align: left; line-height: 1.6; color: #374151;">${data.description || 'Deskripsi tidak tersedia'}</p>`,
        icon: 'info',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#2563eb',
        width: '500px',
        customClass: {
          popup: 'rounded-lg',
          title: 'text-xl font-bold text-gray-800',
          confirmButton: 'px-6 py-2 rounded-md'
        }
      });
    } catch (error) {
      console.error('Error fetching major detail:', error);
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

  // useEffect untuk klik di luar dropdown sekarang ada di dalam komponen UserMenu
  
  // --- FUNGSI HANDLECHANGE YANG DIPERBARUI ---
  const handleChange = (eOrName: React.ChangeEvent<HTMLSelectElement | HTMLInputElement> | string, value?: string) => {
    if (typeof eOrName === 'string') {
        // Handle custom components (ModernRadio, ModernSegmentedControl)
        setForm({ ...form, [eOrName]: value! });
    } else {
        // Handle native inputs (ModernSelect, ModernNumberInput)
        setForm({ ...form, [eOrName.target.name]: eOrName.target.value });
    }
  };


  const handleSubmit = async () => {
    // Validate all fields are filled
    if (Object.values(form).some(value => !value)) {
      MySwal.fire({
        icon: 'warning',
        title: 'Kuesioner Belum Lengkap',
        text: 'Harap isi semua pertanyaan untuk mendapatkan rekomendasi yang akurat!',
        confirmButtonText: 'OK, Saya Mengerti',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate nilai akhir SMA/SMK
    const nilaiAkhir = parseFloat(form['nilai akhir SMA/SMK']);
    if (isNaN(nilaiAkhir) || nilaiAkhir < 0 || nilaiAkhir > 100) {
      MySwal.fire({
        icon: 'warning',
        title: 'Nilai Tidak Valid',
        text: 'Nilai akhir SMA/SMK harus berupa angka antara 0-100!',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      // Get user data
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

      // Send prediction request
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

      const predictionData: ApiResponse = await predictionRes.json();
      
      if (!predictionData.success) {
        throw new Error(predictionData.message || 'Prediksi gagal');
      }

      // Process the results - use the formatted result from backend
      const results = predictionData.result || [];
      setHasil(results);

      // Prepare data for saving
      const answers = Object.entries(form).map(([question, answer]) => ({ question, answer }));
      const recommendations = results.map(item => ({
        majorName: item.majorName,
        score: item.score
      }));

      // Save results
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
        console.error('Save error:', err);
        // Don't throw error here, just log it as save is secondary
        console.warn('Gagal menyimpan hasil, tapi prediksi berhasil');
      }

      // Show success message and then open modal
      MySwal.fire({
        icon: 'success',
        title: '🎉 Prediksi Berhasil!',
        text: 'Hasil rekomendasi jurusan telah diperoleh.',
        timer: 2000,
        showConfirmButton: false,
        backdrop: 'rgba(59, 130, 246, 0.4)'
      }).then(() => {
        setShowResultModal(true);
      });

    } catch (error: any) {
      console.error('Prediction error:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: error.message || 'Gagal memproses prediksi. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
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
    // setDropdownOpen(false); // Tidak perlu lagi
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    // setDropdownOpen(false); // Tidak perlu lagi
    router.push('/');
  };

  const pilihanYaTidak = ['Ya', 'Tidak'];
  const pilihanLevel = ['Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi'];
  const pilihanGender = ['Laki-laki', 'Perempuan'];

  // Function to get label for display
  const getFieldLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      'Gender': '👤 Gender',
      'Minat_Teknologi': '💻 Minat Teknologi',
      'Minat_Seni': '🎨 Minat Seni',
      'Minat_Bisnis': '💼 Minat Bisnis',
      'Minat_Hukum': '⚖️ Minat Hukum',
      'Minat_Kesehatan': '🏥 Minat Kesehatan',
      'Minat_Sains': '🔬 Minat Sains',
      'Problem_Solving': '🧩 Kemampuan Problem Solving',
      'Kreativitas': '✨ Tingkat Kreativitas',
      'Kepemimpinan': '👨‍💼 Kemampuan Kepemimpinan',
      'Kerja_Tim': '🤝 Kemampuan Kerja Tim',
      'nilai akhir SMA/SMK': '📊 Nilai Akhir SMA/SMK'
    };
    return labels[key] || key.replaceAll('_', ' ');
  };

  if (loading || isSubmitting) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-6 p-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-dashed rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin animation-delay-150"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 text-xl font-semibold mb-2">
              {isSubmitting ? '🔮 Menganalisis Jawaban Anda...' : '⏳ Memuat Kuesioner...'}
            </p>
            <p className="text-gray-500 text-sm">
              {isSubmitting ? 'Proses prediksi sedang berlangsung, mohon tunggu sebentar' : 'Menyiapkan pengalaman terbaik untuk Anda'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
        {/* --- PENGGUNAAN KOMPONEN UserMenu BARU --- */}
        {isLoggedIn && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
            <UserMenu 
                onProfileClick={handleGoToProfile} 
                onLogoutClick={handleLogout} 
            />
          </div>
        )}

        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <SparklesIcon className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 font-medium">Smart Career Prediction</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              Temukan Jurusan Impianmu
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Dapatkan rekomendasi jurusan kuliah yang tepat berdasarkan minat, kemampuan, dan prestasi akademik Anda
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <ProgressBar current={completedFields} total={totalFields} />

            {/* Main Form Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                    <AcademicCapIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Kuesioner Penjurusan</h2>
                    <p className="text-blue-100 text-sm">Jawab semua pertanyaan dengan jujur untuk hasil terbaik</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 lg:p-10">
                {/* Demographics Section */}
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                    Informasi Demografis
                  </h3>
                  <div className="grid gap-6">
                    <ModernSelect
                      label={getFieldLabel('Gender')}
                      name="Gender"
                      value={form.Gender}
                      onChange={handleChange}
                      options={pilihanGender}
                    />
                    <ModernNumberInput
                      label={getFieldLabel('nilai akhir SMA/SMK')}
                      name="nilai akhir SMA/SMK"
                      value={form['nilai akhir SMA/SMK']}
                      onChange={handleChange}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                {/* --- BAGIAN MINAT DENGAN MODERNRADIO --- */}
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                    Bidang Minat
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {['Minat_Teknologi', 'Minat_Seni', 'Minat_Bisnis', 'Minat_Hukum', 'Minat_Kesehatan', 'Minat_Sains'].map((key) => (
                      <ModernRadio
                        key={key}
                        label={getFieldLabel(key)}
                        name={key}
                        value={form[key as keyof typeof form]}
                        onChange={handleChange}
                        options={pilihanYaTidak}
                      />
                    ))}
                  </div>
                </div>
                
                {/* --- BAGIAN KEMAMPUAN DENGAN MODERNSEGMENTEDCONTROL --- */}
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-teal-600 rounded-full"></div>
                    Kemampuan Personal
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {['Problem_Solving', 'Kreativitas', 'Kepemimpinan', 'Kerja_Tim'].map((key) => (
                      <ModernSegmentedControl
                        key={key}
                        label={getFieldLabel(key)}
                        name={key}
                        value={form[key as keyof typeof form]}
                        onChange={handleChange}
                        options={pilihanLevel}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit Section */}
                <div className="text-center">
                  <div className="mb-6">
                    {!isFormComplete && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-4">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-orange-700 text-sm font-medium">
                          Lengkapi {totalFields - completedFields} pertanyaan lagi
                        </span>
                      </div>
                    )}
                    
                    {isFormComplete && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-4">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 text-sm font-medium">
                          Semua pertanyaan telah dijawab!
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isFormComplete}
                    className={`relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform ${
                      isSubmitting || !isFormComplete
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500 scale-95'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-dashed rounded-full animate-spin"></div>
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5" />
                        <span>Dapatkan Rekomendasi Jurusan</span>
                        <ArrowRightIcon className="h-5 w-5" />
                      </>
                    )}
                    
                    {/* Animated background for enabled state */}
                    {!isSubmitting && isFormComplete && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                    )}
                  </button>

                  {/* Help Text */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                      Prediksi menggunakan algoritma machine learning untuk memberikan rekomendasi yang akurat berdasarkan data Anda
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Akurasi Tinggi</h4>
                </div>
                <p className="text-sm text-gray-600">Sistem prediksi dengan tingkat akurasi tinggi berdasarkan data historis mahasiswa</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <SparklesIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Rekomendasi Personal</h4>
                </div>
                <p className="text-sm text-gray-600">Setiap rekomendasi disesuaikan dengan profil unik minat dan kemampuan Anda</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Tersimpan Otomatis</h4>
                </div>
                <p className="text-sm text-gray-600">Hasil rekomendasi tersimpan di profil Anda untuk referensi masa depan</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        hasil={hasil}
        onShowDetail={handleShowDetail}
      />
    </>
  );
}