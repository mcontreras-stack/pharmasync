'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTab } from '@/context/TabContext';
import { getMockDb, saveMockDb, Profile, ProfessionalDoc, MotherDoc } from '@/lib/mockDb';

// Import dashboards & tabs
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import BottomNav from '@/components/dashboard/BottomNav';
import MotherDashboard from '@/components/mother/MotherDashboard';
import ObstetricianDashboard from '@/components/obstetrician/ObstetricianDashboard';
import PediatricianDashboard from '@/components/pediatrician/PediatricianDashboard';
import AppointmentsTab from '@/components/dashboard/AppointmentsTab';
import ChatTab from '@/components/dashboard/ChatTab';
import ProfileTab from '@/components/mother/ProfileTab';
import AdminDashboard from '@/components/admin/AdminDashboard';
import DoctorSettingsTab from '@/components/dashboard/DoctorSettingsTab';
import PrescriptionsTab from '@/components/dashboard/PrescriptionsTab';

import { 
  Heart, 
  Baby, 
  Shield, 
  Activity, 
  Lock, 
  ArrowRight, 
  UserCheck,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function RootPage() {
  const { user, loading, signIn, signUp, signOut, updateUserStatus, isMockMode } = useAuth();
  const { activeTab } = useTab();
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Auth layout tabs
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Input states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [registerRole, setRegisterRole] = useState<'mother' | 'obstetrician' | 'pediatrician'>('mother');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP states
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email');

  // Onboarding Wizard states
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [exequaturNum, setExequaturNum] = useState('');
  const [colegiaturaNum, setColegiaturaNum] = useState('');
  const [experienceYears, setExperienceYears] = useState('2');
  const [clinicAddress, setClinicAddress] = useState('');
  
  // File Upload states (simulated metadata)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: { name: string; size: string } }>({});
  const [onboardingError, setOnboardingError] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsImpersonating(!!localStorage.getItem('pharmasync_admin_impersonator'));
    }
  }, [user]);

  const handleExitImpersonation = () => {
    if (typeof window === 'undefined') return;
    const adminSession = localStorage.getItem('pharmasync_admin_impersonator');
    if (adminSession) {
      localStorage.setItem('pharmasync_user', adminSession);
      localStorage.removeItem('pharmasync_admin_impersonator');
      window.location.reload();
    }
  };

  const handleDemoLogin = async (role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => {
    setErrorMsg('');
    let demoEmail = 'maria@gmail.com';
    if (role === 'obstetrician') demoEmail = 'dra.ana@pharmasync.com';
    if (role === 'pediatrician') demoEmail = 'dr.andres@pharmasync.com';
    if (role === 'admin') demoEmail = 'admin@pharmasync.com';

    try {
      await signIn(demoEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión demo.');
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) return;

    try {
      // Login uses standard signin without creating account
      await signIn(email);
    } catch (err: any) {
      setErrorMsg(err.message || 'El usuario no existe. Regístrate en la pestaña de registro.');
    }
  };

  const handleCustomRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !fullName || !phone) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    try {
      await signUp(email, fullName, registerRole, phone);
      setSuccessMsg('Registro inicial exitoso. Por favor verifica tu cuenta.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrarse.');
    }
  };

  // OTP Verification Action
  const handleOTPVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    const code = otpDigits.join('');
    if (code.length < 6) {
      setOtpError('Por favor ingresa los 6 dígitos.');
      return;
    }

    // Accept any code for this SaaS simulator
    updateUserStatus('pending_documents');
  };

  const handleOtpDigitChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newDigits = [...otpDigits];
      newDigits[index] = value;
      setOtpDigits(newDigits);
      
      // Auto focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // File Upload Selection Simulator
  const simulateFileUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        }
      }));
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  // Document Submission Action
  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');

    if (!nationalId) {
      setOnboardingError('La cédula de identidad es requerida.');
      return;
    }

    // Verify files
    const requiredFiles = user?.role === 'mother' 
      ? ['idFront', 'idBack'] 
      : ['idFront', 'idBack', 'degree', 'exequaturDoc'];

    for (const key of requiredFiles) {
      if (!uploadedFiles[key]) {
        setOnboardingError('Por favor sube todos los documentos obligatorios requeridos.');
        return;
      }
    }

    const db = getMockDb();

    // Update user profile fields in db
    db.profiles = db.profiles.map(p => {
      if (p.id === user?.id) {
        return {
          ...p,
          national_id: nationalId,
          birth_date: birthDate || p.birth_date
        };
      }
      return p;
    });

    if (user?.role === 'mother') {
      db.mothers = db.mothers.map(m => {
        if (m.id === user.id) {
          return {
            ...m,
            phone: user.phone || '',
            birth_date: birthDate,
            blood_type: bloodType
          };
        }
        return m;
      });

      // Save simulated mother docs
      const motherDocs: MotherDoc[] = [
        {
          id: `mdoc-${Date.now()}-1`,
          mother_id: user.id,
          type: 'id_front',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/id-front.jpg',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: `mdoc-${Date.now()}-2`,
          mother_id: user.id,
          type: 'id_back',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/id-back.jpg',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];

      if (uploadedFiles['pregnancyCert']) {
        motherDocs.push({
          id: `mdoc-${Date.now()}-3`,
          mother_id: user.id,
          type: 'pregnancy_cert',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/pregnancy-cert.pdf',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }

      db.mother_documents = [...(db.mother_documents || []), ...motherDocs];
    } else if (user && (user.role === 'obstetrician' || user.role === 'pediatrician')) {
      db.doctors = db.doctors.map(d => {
        if (d.id === user.id) {
          return {
            ...d,
            exequatur: exequaturNum,
            colegiatura: colegiaturaNum,
            experience_years: parseInt(experienceYears) || 2,
            clinic_address: clinicAddress,
            national_id: nationalId,
            phone: user.phone || ''
          };
        }
        return d;
      });

      // Save simulated professional docs
      const profDocs: ProfessionalDoc[] = [
        {
          id: `pdoc-${Date.now()}-1`,
          doctor_id: user.id,
          type: 'id_front',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/id-front.jpg',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: `pdoc-${Date.now()}-2`,
          doctor_id: user.id,
          type: 'id_back',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/id-back.jpg',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: `pdoc-${Date.now()}-3`,
          doctor_id: user.id,
          type: 'degree',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/degree.pdf',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: `pdoc-${Date.now()}-4`,
          doctor_id: user.id,
          type: 'exequatur',
          file_url: 'https://pharmasync-demo.s3.amazonaws.com/docs/exequatur-cert.pdf',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];

      db.professional_documents = [...(db.professional_documents || []), ...profDocs];
    }

    saveMockDb(db);

    // Call update status to update user context in App State
    updateUserStatus('under_review');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-xs text-slate-400 font-semibold mt-4">Cargando PharmaSync...</p>
      </div>
    );
  }

  // --- 1. RENDER PORTAL / LOGIN & REGISTRATION ---
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden min-h-[550px] relative">
          {/* Decorative backdrop glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>

          {/* Brand/Hero Panel */}
          <div className="bg-gradient-to-br from-pink-650 via-rose-700 to-indigo-900 p-8 text-white flex flex-col justify-between relative overflow-hidden select-none">
            <div className="absolute right-[-10%] top-[-10%] h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute left-[-20%] bottom-[-20%] h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-black">PS</span>
              <span>PharmaSync Mom & Baby</span>
            </div>

            <div className="space-y-4 my-8 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-pink-200">
                <Sparkles className="h-3 w-3" />
                SaaS de Telemedicina y Receta Digital
              </span>
              <h1 className="text-3xl font-black leading-tight">
                El control médico de tu embarazo y tu bebé.
              </h1>
              <p className="text-xs font-semibold text-pink-100/80 leading-relaxed max-w-sm">
                Conectamos de forma regulada el expediente clínico con las recetas farmacológicas para Obstetras, Pediatras y Madres en la República Dominicana.
              </p>
            </div>

            <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Cumplimiento Legal SNS & Ley de Salud 87-01</span>
            </div>
          </div>

          {/* Form Panel */}
          <div className="p-8 flex flex-col justify-center space-y-6 relative z-10">
            <div>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setErrorMsg(''); }}
                  className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all ${authTab === 'login' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setErrorMsg(''); }}
                  className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all ${authTab === 'register' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Registrarse
                </button>
              </div>

              {authTab === 'login' ? (
                <>
                  <h2 className="text-xl font-black text-white">Ingresar al Portal</h2>
                  <p className="text-[10px] text-slate-400 mt-1">Ingresa tus credenciales o selecciona un perfil pre-aprobado para demostración.</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black text-white">Crear Nueva Cuenta</h2>
                  <p className="text-[10px] text-slate-400 mt-1">Completa el formulario inicial. Recibirás un código OTP de verificación.</p>
                </>
              )}
            </div>

            {authTab === 'login' ? (
              <>
                {/* Custom login form */}
                <form onSubmit={handleCustomLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-white focus:outline-none focus:border-pink-500 transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors shadow-lg"
                  >
                    Ingresar con mi cuenta
                  </button>
                </form>

                {/* Quick Demo Selectors */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block mb-1">Acceso Rápido (Pre-Aprobados):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDemoLogin('mother')}
                      className="flex items-center gap-2 p-2.5 bg-pink-950/20 border border-pink-500/20 rounded-xl hover:bg-pink-950/30 text-left transition-all"
                    >
                      <Heart className="h-4 w-4 text-pink-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-pink-300">Madre Demo</p>
                        <p className="text-[8px] text-pink-400/70 truncate">María López</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('obstetrician')}
                      className="flex items-center gap-2 p-2.5 bg-purple-950/20 border border-purple-500/20 rounded-xl hover:bg-purple-950/30 text-left transition-all"
                    >
                      <Shield className="h-4 w-4 text-purple-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-purple-300">Obstetra Demo</p>
                        <p className="text-[8px] text-purple-400/70 truncate">Dra. Ana R.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('pediatrician')}
                      className="flex items-center gap-2 p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl hover:bg-emerald-950/30 text-left transition-all"
                    >
                      <Baby className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-emerald-300">Pediatra Demo</p>
                        <p className="text-[8px] text-emerald-400/70 truncate">Dr. Andrés P.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDemoLogin('admin')}
                      className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 text-left transition-all"
                    >
                      <UserCheck className="h-4 w-4 text-slate-300 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-200">Administrador</p>
                        <p className="text-[8px] text-slate-400 truncate">Admin Juan</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Custom Registration */
              <form onSubmit={handleCustomRegister} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej. Ana Santos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ana.santos@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="809-555-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Tipo de Cuenta</label>
                  <select
                    value={registerRole}
                    onChange={(e: any) => setRegisterRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-pink-500"
                  >
                    <option value="mother">Madre / Familia</option>
                    <option value="obstetrician">Médico Obstetra</option>
                    <option value="pediatrician">Médico Pediatra</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-lg mt-2"
                >
                  Registrarse y Verificar
                </button>
              </form>
            )}

            {errorMsg && (
              <p className="text-[11px] text-rose-450 font-bold text-center bg-rose-950/20 border border-rose-500/10 p-2.5 rounded-xl">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-[11px] text-emerald-450 font-bold text-center bg-emerald-950/20 border border-emerald-500/10 p-2.5 rounded-xl">{successMsg}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // --- 2. INTERCEPT AND RENDER OTP VERIFICATION IF PENDING EMAIL ---
  if (user && user.status === 'email_pending') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-[32px] p-8 shadow-2xl relative space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-white">Verificación en Dos Pasos</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hemos enviado un código OTP de 6 dígitos a <strong className="text-slate-200">{user.email}</strong> y por mensaje de texto.
            </p>
          </div>

          <form onSubmit={handleOTPVerify} className="space-y-6">
            {/* Verification type picker */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setOtpMethod('email')}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${otpMethod === 'email' ? 'bg-slate-850 text-white' : 'text-slate-400'}`}
              >
                Verificar por Email
              </button>
              <button
                type="button"
                onClick={() => setOtpMethod('sms')}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${otpMethod === 'sms' ? 'bg-slate-850 text-white' : 'text-slate-400'}`}
              >
                Verificar por SMS / WhatsApp
              </button>
            </div>

            {/* OTP Digits boxes */}
            <div className="flex justify-between gap-2.5">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-lg font-bold focus:outline-none focus:border-pink-500 text-white"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-[11px] text-rose-500 font-bold text-center">{otpError}</p>
            )}

            <div className="space-y-2">
              <button
                type="submit"
                className="w-full py-3 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors shadow-md"
              >
                Confirmar Código
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setOtpDigits(['1', '2', '3', '4', '5', '6']);
                  setOtpError('');
                }}
                className="w-full py-2 bg-slate-950 text-slate-400 border border-slate-850 hover:text-white rounded-xl text-[10px] font-bold transition-colors"
              >
                Autocompletar Código Demo (123456)
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={signOut}
                className="text-[10px] text-slate-400 hover:text-slate-200 hover:underline"
              >
                Volver a Iniciar Sesión / Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // --- 3. INTERCEPT AND RENDER DOCUMENT UPLOAD WIZARD ---
  if (user && (user.status === 'pending_documents' || user.status === 'rejected')) {
    const isMother = user.role === 'mother';

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-850 rounded-[32px] p-8 shadow-2xl relative space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-white">Validación de Credenciales</h2>
            
            {user.status === 'rejected' ? (
              <div className="bg-rose-950/40 border border-rose-500/20 text-rose-200 p-3 rounded-2xl text-[11px] font-semibold mt-2">
                ⚠️ Tu solicitud anterior fue rechazada. Por favor revisa y vuelve a cargar tus documentos legibles para revisión.
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Para cumplir con la legislación sanitaria y proteger el expediente médico, requerimos validar tu identidad y exequátur profesional.
              </p>
            )}
          </div>

          <form onSubmit={handleDocumentSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Common field: Identity Card */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Número de Cédula de Identidad</label>
                <input
                  type="text"
                  placeholder="001-0000000-0"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Common field: Date of birth */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {isMother ? (
              /* Mother specific fields */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Grupo Sanguíneo</label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Doctor specific fields */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Número de Exequátur Oficial</label>
                    <input
                      type="text"
                      placeholder="EQ-12345"
                      value={exequaturNum}
                      onChange={(e) => setExequaturNum(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Colegiatura Médica (CMD)</label>
                    <input
                      type="text"
                      placeholder="CMD-5544"
                      value={colegiaturaNum}
                      onChange={(e) => setColegiaturaNum(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Años de Experiencia</label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                      min={0}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Dirección del Consultorio</label>
                    <input
                      type="text"
                      placeholder="Ej. Clínica Unión Médica, Consultorio 302, Santiago"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Document upload fields */}
            <div className="space-y-3 pt-2">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Documentos Obligatorios (PDF o Imagen)</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID Front */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[11px] font-bold text-white">Cédula (Frente)</h4>
                      <p className="text-[8px] text-slate-500 mt-0.5">Suba una foto nítida de la parte frontal</p>
                    </div>
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  {uploadedFiles['idFront'] ? (
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-[9px] mt-2">
                      <span className="font-bold text-slate-300 truncate max-w-[130px]">{uploadedFiles['idFront'].name}</span>
                      <button type="button" onClick={() => handleRemoveFile('idFront')} className="p-1 hover:bg-slate-850 rounded-lg text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition-colors mt-2">
                      <UploadCloud className="h-4 w-4 text-slate-400" />
                      Seleccionar Archivo
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => simulateFileUpload('idFront', e)} />
                    </label>
                  )}
                </div>

                {/* ID Back */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[11px] font-bold text-white">Cédula (Reverso)</h4>
                      <p className="text-[8px] text-slate-500 mt-0.5">Suba una foto nítida de la parte posterior</p>
                    </div>
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  {uploadedFiles['idBack'] ? (
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-[9px] mt-2">
                      <span className="font-bold text-slate-300 truncate max-w-[130px]">{uploadedFiles['idBack'].name}</span>
                      <button type="button" onClick={() => handleRemoveFile('idBack')} className="p-1 hover:bg-slate-850 rounded-lg text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition-colors mt-2">
                      <UploadCloud className="h-4 w-4 text-slate-400" />
                      Seleccionar Archivo
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => simulateFileUpload('idBack', e)} />
                    </label>
                  )}
                </div>

                {!isMother && (
                  <>
                    {/* Doctor Degree */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[11px] font-bold text-white">Título Académico</h4>
                          <p className="text-[8px] text-slate-500 mt-0.5">Copia digitalizada del título médico</p>
                        </div>
                        <FileText className="h-4 w-4 text-slate-500" />
                      </div>
                      {uploadedFiles['degree'] ? (
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-[9px] mt-2">
                          <span className="font-bold text-slate-300 truncate max-w-[130px]">{uploadedFiles['degree'].name}</span>
                          <button type="button" onClick={() => handleRemoveFile('degree')} className="p-1 hover:bg-slate-850 rounded-lg text-rose-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition-colors mt-2">
                          <UploadCloud className="h-4 w-4 text-slate-400" />
                          Seleccionar Archivo
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => simulateFileUpload('degree', e)} />
                        </label>
                      )}
                    </div>

                    {/* Exequatur document */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[11px] font-bold text-white">Certificado Exequátur</h4>
                          <p className="text-[8px] text-slate-500 mt-0.5">Documento de autorización del Poder Ejecutivo</p>
                        </div>
                        <FileText className="h-4 w-4 text-slate-500" />
                      </div>
                      {uploadedFiles['exequaturDoc'] ? (
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-[9px] mt-2">
                          <span className="font-bold text-slate-300 truncate max-w-[130px]">{uploadedFiles['exequaturDoc'].name}</span>
                          <button type="button" onClick={() => handleRemoveFile('exequaturDoc')} className="p-1 hover:bg-slate-850 rounded-lg text-rose-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition-colors mt-2">
                          <UploadCloud className="h-4 w-4 text-slate-400" />
                          Seleccionar Archivo
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => simulateFileUpload('exequaturDoc', e)} />
                        </label>
                      )}
                    </div>
                  </>
                )}

                {isMother && (
                  /* Optional pregnancy certificate */
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-[11px] font-bold text-white">Certificado Médico (Opcional)</h4>
                        <p className="text-[8px] text-slate-500 mt-0.5">Certificado de embarazo o nacimiento</p>
                      </div>
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    {uploadedFiles['pregnancyCert'] ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-[9px] mt-2">
                        <span className="font-bold text-slate-300 truncate max-w-[130px]">{uploadedFiles['pregnancyCert'].name}</span>
                        <button type="button" onClick={() => handleRemoveFile('pregnancyCert')} className="p-1 hover:bg-slate-850 rounded-lg text-rose-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition-colors mt-2">
                        <UploadCloud className="h-4 w-4 text-slate-400" />
                        Seleccionar Archivo
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => simulateFileUpload('pregnancyCert', e)} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            {onboardingError && (
              <p className="text-[11px] text-rose-550 font-bold bg-rose-950/20 border border-rose-500/10 p-2.5 rounded-xl text-center">{onboardingError}</p>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={signOut}
                className="flex-1 py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cerrar Sesión
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
              >
                Enviar para Revisión
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setNationalId('001-1938201-9');
                setBirthDate('1992-06-15');
                if (!isMother) {
                  setExequaturNum('EQ-9481');
                  setColegiaturaNum('CMD-8291');
                  setClinicAddress('Av. Independencia 505, Santo Domingo');
                  setUploadedFiles({
                    idFront: { name: 'cedula_front.png', size: '1.2 MB' },
                    idBack: { name: 'cedula_back.png', size: '1.1 MB' },
                    degree: { name: 'titulo_medico.pdf', size: '3.4 MB' },
                    exequaturDoc: { name: 'decreto_exequatur.pdf', size: '0.8 MB' }
                  });
                } else {
                  setUploadedFiles({
                    idFront: { name: 'cedula_front.png', size: '1.2 MB' },
                    idBack: { name: 'cedula_back.png', size: '1.1 MB' }
                  });
                }
                setOnboardingError('');
              }}
              className="w-full text-center py-2 text-[9px] font-black text-slate-500 hover:text-slate-400 tracking-wider uppercase bg-slate-950 rounded-xl"
            >
              Autocompletar Formulario & Documentos Demo
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- 4. RENDER APP IN REGULAR DASHBOARD VIEW ---
  const renderTabContent = () => {
    // Mother Tab content
    if (user.role === 'mother') {
      switch (activeTab) {
        case 'home':
          return <MotherDashboard />;
        case 'citas':
          return <AppointmentsTab />;
        case 'hijos':
          return <MotherDashboard />; // switches dynamically internal states inside component
        case 'prescriptions':
          return <PrescriptionsTab />;
        case 'chat':
          return <ChatTab />;
        case 'perfil':
          return <ProfileTab />;
        default:
          return <MotherDashboard />;
      }
    }

    // Obstetrician Tab content
    if (user.role === 'obstetrician') {
      switch (activeTab) {
        case 'home':
          return <ObstetricianDashboard />;
        case 'citas':
          return <AppointmentsTab />;
        case 'chat':
          return <ChatTab />;
        case 'prescriptions':
          return <PrescriptionsTab />;
        case 'settings':
          return <DoctorSettingsTab />;
        default:
          return <ObstetricianDashboard />;
      }
    }

    // Pediatrician Tab content
    if (user.role === 'pediatrician') {
      switch (activeTab) {
        case 'home':
          return <PediatricianDashboard />;
        case 'citas':
          return <AppointmentsTab />;
        case 'chat':
          return <ChatTab />;
        case 'prescriptions':
          return <PrescriptionsTab />;
        case 'settings':
          return <DoctorSettingsTab />;
        default:
          return <PediatricianDashboard />;
      }
    }

    // Admin Tab content
    if (user.role === 'admin') {
      return <AdminDashboard />;
    }

    return <div>Perfil no reconocido.</div>;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50/50">
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-3 z-50 shadow-xs shrink-0 select-none">
          <span>⚠️ Modo Impersonación Activo: Visualizando la plataforma como {user.full_name} ({user.email})</span>
          <button
            onClick={handleExitImpersonation}
            className="bg-slate-950 text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors text-[9px] font-black uppercase tracking-wider"
          >
            Volver a Admin
          </button>
        </div>
      )}
      
      <Header />
      
      {/* Orange Banner block for accounts under_review */}
      {user.status === 'under_review' && (
        <div className="bg-amber-500 border-b border-amber-600 text-slate-950 px-4 py-2.5 text-center text-[11px] font-extrabold flex items-center justify-center gap-2 z-40 shadow-xs shrink-0 select-none">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping"></span>
          <span>⚠️ Tu cuenta se encuentra en revisión. La validación de credenciales médicas y documentos puede tardar hasta 24 horas hábiles. Las funciones principales están temporalmente limitadas.</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          {renderTabContent()}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
