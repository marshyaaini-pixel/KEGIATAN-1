
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeAnswersWithAI } from './services/geminiService';
import { Submission, StudentAnswers, SimulationState } from './types';
import ParticleBox from './components/ParticleBox';

const TEACHER_PASSWORD = 'guru123';

const App: React.FC = () => {
  // Refs
  const lksRef = useRef<HTMLDivElement>(null);

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [password, setPassword] = useState('');
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // Simulation State
  const [redInitial, setRedInitial] = useState(20);
  const [simData, setSimData] = useState<SimulationState>({
    t0: { red: 20, blue: 0 },
    t10: { red: 12, blue: 8 },
    t20: { red: 4, blue: 16 }
  });

  // Student Form State
  const [groupInfo, setGroupInfo] = useState({ groupName: '', members: '' });
  const [answers, setAnswers] = useState<StudentAnswers>({
    reduction: '',
    formation: '',
    negative: '',
    air: '',
    definition: ''
  });

  // Records
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('sim_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sim_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const updateSimulation = useCallback(() => {
    const val = Math.max(4, Math.min(30, redInitial));
    const consumed10 = Math.round(val * 0.4);
    const consumed20 = Math.round(val * 0.8);
    setSimData({
      t0: { red: val, blue: 0 },
      t10: { red: val - consumed10, blue: consumed10 },
      t20: { red: val - consumed20, blue: consumed20 }
    });
  }, [redInitial]);

  useEffect(() => {
    updateSimulation();
  }, [updateSimulation]);

  const handleToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    if (!groupInfo.groupName || !groupInfo.members) {
      handleToast('Mohon isi identitas kelompok!', 'warning');
      return;
    }
    const allFilled = Object.values(answers).every(a => a.trim().length > 0);
    if (!allFilled) {
      handleToast('Mohon jawab semua pertanyaan analisis!', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeAnswersWithAI(answers, simData);
      
      const newSubmission: Submission = {
        id: Date.now().toString(),
        groupName: groupInfo.groupName,
        members: groupInfo.members,
        redInitial: redInitial,
        answers: { ...answers },
        aiScore: result.score,
        aiFeedback: `${result.feedback}\n\nSummary: ${result.summary}`,
        submittedAt: new Date().toISOString()
      };

      setSubmissions(prev => [newSubmission, ...prev]);
      handleToast('Jawaban berhasil dikirim!', 'success');
      setAnswers({ reduction: '', formation: '', negative: '', air: '', definition: '' });
    } catch (err) {
      handleToast('Terjadi kesalahan saat menghubungi AI.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scrollToLKS = () => {
    lksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loginTeacher = () => {
    if (password === TEACHER_PASSWORD) {
      setShowModal(true);
      setPassword('');
    } else {
      handleToast('Password salah!', 'error');
    }
  };

  const downloadCSV = () => {
    if (submissions.length === 0) return;
    const headers = [
      "Kelompok", 
      "Anggota", 
      "Partikel Awal", 
      "Skor AI", 
      "Q1 (Reduksi)", 
      "Q2 (Formasi)", 
      "Q3 (Simbol)", 
      "Q4 (Karhutla)", 
      "Q5 (Definisi)", 
      "Waktu"
    ];
    
    const rows = submissions.map(s => [
      `"${s.groupName.replace(/"/g, '""')}"`,
      `"${s.members.replace(/"/g, '""')}"`,
      s.redInitial,
      s.aiScore,
      `"${s.answers.reduction.replace(/"/g, '""')}"`,
      `"${s.answers.formation.replace(/"/g, '""')}"`,
      `"${s.answers.negative.replace(/"/g, '""')}"`,
      `"${s.answers.air.replace(/"/g, '""')}"`,
      `"${s.answers.definition.replace(/"/g, '""')}"`,
      new Date(s.submittedAt).toLocaleString('id-ID')
    ]);
    
    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Laju_Reaksi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    setExpandedSub(expandedSub === id ? null : id);
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-2">🔬 Simulasi Laju Reaksi Partikel</h1>
        <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
          Amati perubahan jumlah partikel biomassa (merah) menjadi polutan (biru) pada proses pembakaran
        </p>
      </header>

      {/* Identity Section */}
      <section className="glass-card rounded-2xl p-6 shadow-sm border border-white/50">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">👥</span> Identitas Kelompok
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kelompok</label>
            <input 
              type="text" 
              value={groupInfo.groupName}
              onChange={e => setGroupInfo({...groupInfo, groupName: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 outline-none focus:border-blue-500 transition-all"
              placeholder="Contoh: Kelompok 1"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Anggota</label>
            <input 
              type="text" 
              value={groupInfo.members}
              onChange={e => setGroupInfo({...groupInfo, members: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 outline-none focus:border-blue-500 transition-all"
              placeholder="Contoh: Andi, Budi, Citra"
            />
          </div>
        </div>
      </section>

      {/* Setup Section */}
      <section className="glass-card rounded-2xl p-6 shadow-sm border border-white/50">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">⚙️</span> Pengaturan Simulasi
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Partikel Merah Awal</label>
            <input 
              type="number" 
              value={redInitial}
              onChange={e => setRedInitial(parseInt(e.target.value) || 0)}
              min="4" max="30"
              className="w-32 px-4 py-2 rounded-lg border-2 border-slate-200 outline-none text-center font-bold"
            />
          </div>
          <button 
            onClick={updateSimulation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg transition-all shadow-lg active:scale-95"
          >
            Perbarui Simulasi
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">*Minimal 4, maksimal 30 partikel</p>
      </section>

      {/* Simulation Viewports */}
      <section className="glass-card rounded-2xl p-6 shadow-md border border-white/50">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">🧪</span> Simulasi Pembakaran Biomassa
        </h2>
        
        <div className="flex flex-wrap gap-6 mb-8 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-700" />
            <span className="text-sm font-medium text-gray-700">Biomassa (Reaktan)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-700" />
            <span className="text-sm font-medium text-gray-700">Polutan Asap (Produk)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ParticleBox label="Kotak A" subLabel="t = 0 detik" redCount={simData.t0.red} blueCount={simData.t0.blue} />
          <ParticleBox label="Kotak B" subLabel="t = 10 detik" redCount={simData.t10.red} blueCount={simData.t10.blue} />
          <ParticleBox label="Kotak C" subLabel="t = 20 detik" redCount={simData.t20.red} blueCount={simData.t20.blue} />
        </div>

        <div className="text-center">
          <button 
            onClick={scrollToLKS}
            className="bg-slate-800 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            ✍️ Mulai Mengerjakan LKS
          </button>
        </div>
      </section>

      {/* Observation Table */}
      <section className="glass-card rounded-2xl p-6 shadow-sm border border-white/50">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span> Tabel Pengamatan Partikel
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="py-3 px-4 text-left">Waktu (t)</th>
                <th className="py-3 px-4 text-center">Jumlah Partikel Merah (Reaktan)</th>
                <th className="py-3 px-4 text-center">Jumlah Partikel Biru (Produk)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-white hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold">0 detik</td>
                <td className="py-3 px-4 text-center text-red-600 font-bold">{simData.t0.red}</td>
                <td className="py-3 px-4 text-center text-blue-600 font-bold">{simData.t0.blue}</td>
              </tr>
              <tr className="bg-slate-50 hover:bg-blue-50">
                <td className="py-3 px-4 font-semibold">10 detik</td>
                <td className="py-3 px-4 text-center text-red-600 font-bold">{simData.t10.red}</td>
                <td className="py-3 px-4 text-center text-blue-600 font-bold">{simData.t10.blue}</td>
              </tr>
              <tr className="bg-white hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold">20 detik</td>
                <td className="py-3 px-4 text-center text-red-600 font-bold">{simData.t20.red}</td>
                <td className="py-3 px-4 text-center text-blue-600 font-bold">{simData.t20.blue}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Lembar Kerja Siswa */}
      <section ref={lksRef} className="glass-card rounded-2xl p-6 shadow-lg border border-white/50 scroll-mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">❓</span> Lembar Kerja Siswa (Pertanyaan Analisis)
        </h2>
        
        <div className="space-y-6">
          {/* Question 1 */}
          <div className="p-5 bg-red-50 rounded-2xl border-l-4 border-red-500 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">1. Analisis Pengurangan (Laju Reaktan)</h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Berapa banyak partikel merah yang hilang dari detik ke-0 ke detik ke-10? Hitunglah laju pengurangannya dengan rumus: <strong>Δ[Reaktan]/Δt</strong>
            </p>
            <textarea 
              value={answers.reduction}
              onChange={e => setAnswers({...answers, reduction: e.target.value})}
              rows={3}
              placeholder="Tuliskan jawaban dan perhitunganmu di sini..."
              className="w-full bg-white p-3 rounded-lg border-2 border-slate-100 outline-none focus:border-red-300 transition-all text-sm"
            />
          </div>

          {/* Question 2 */}
          <div className="p-5 bg-blue-50 rounded-2xl border-l-4 border-blue-500 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">2. Analisis Penambahan (Laju Produk)</h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Berapa banyak partikel biru yang muncul dari detik ke-10 ke detik ke-20? Hitunglah laju pembentukannya dengan rumus: <strong>Δ[Produk]/Δt</strong>
            </p>
            <textarea 
              value={answers.formation}
              onChange={e => setAnswers({...answers, formation: e.target.value})}
              rows={3}
              placeholder="Tuliskan jawaban dan perhitunganmu di sini..."
              className="w-full bg-white p-3 rounded-lg border-2 border-slate-100 outline-none focus:border-blue-300 transition-all text-sm"
            />
          </div>

          {/* Question 3 */}
          <div className="p-5 bg-purple-50 rounded-2xl border-l-4 border-purple-500 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">3. Simbol Positif dan Negatif</h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Jika partikel merah adalah Reaktan dan partikel biru adalah Produk, mengapa laju reaktan selalu diberi tanda <strong>negatif (-)</strong> sedangkan produk bertanda <strong>positif (+)</strong>?
            </p>
            <textarea 
              value={answers.negative}
              onChange={e => setAnswers({...answers, negative: e.target.value})}
              rows={3}
              placeholder="Tuliskan jawaban dan penjelasanmu di sini..."
              className="w-full bg-white p-3 rounded-lg border-2 border-slate-100 outline-none focus:border-purple-300 transition-all text-sm"
            />
          </div>

          {/* Question 4 */}
          <div className="p-5 bg-green-50 rounded-2xl border-l-4 border-green-500 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">4. Kaitan dengan Kebakaran Hutan (Karhutla)</h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Jika bulatan merah adalah kayu hutan dan bulatan biru adalah gas polutan CO, apa yang terjadi pada kualitas udara jika laju perubahan partikel ini berlangsung sangat cepat?
            </p>
            <textarea 
              value={answers.air}
              onChange={e => setAnswers({...answers, air: e.target.value})}
              rows={3}
              placeholder="Tuliskan jawaban dan penjelasanmu di sini..."
              className="w-full bg-white p-3 rounded-lg border-2 border-slate-100 outline-none focus:border-green-300 transition-all text-sm"
            />
          </div>

          {/* Question 5 */}
          <div className="p-5 bg-yellow-50 rounded-2xl border-l-4 border-yellow-500 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-2">5. Generalisasi Simbolik - Definisi Laju Reaksi</h3>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Berdasarkan pengamatanmu, rumuskan definisi <strong>Laju Reaksi (v)</strong> dengan kata-katamu sendiri!
            </p>
            <textarea 
              value={answers.definition}
              onChange={e => setAnswers({...answers, definition: e.target.value})}
              rows={3}
              placeholder="Laju Reaksi adalah..."
              className="w-full bg-white p-3 rounded-lg border-2 border-slate-100 outline-none focus:border-yellow-300 transition-all text-sm"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className={`px-10 py-4 rounded-2xl font-extrabold text-white text-lg transition-all shadow-xl flex items-center justify-center gap-3 mx-auto ${loading ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.03] active:scale-95'}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengirim Jawaban...
              </>
            ) : (
              <>📤 Kirim Jawaban</>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-3">Pastikan semua jawaban sudah terisi sebelum mengirim</p>
        </div>
      </section>

      {/* Teacher Access Section */}
      <section className="glass-card rounded-2xl p-6 shadow-sm border-2 border-dashed border-gray-300 text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex justify-center items-center gap-2">
          <span className="text-2xl">🔐</span> Akses Guru
        </h2>
        <div className="flex flex-wrap justify-center gap-4 items-center">
          <input 
            type="password" 
            placeholder="Masukkan password guru"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-slate-200 outline-none focus:border-slate-400 transition-all w-full max-w-xs"
          />
          <button 
            onClick={loginTeacher}
            className="bg-slate-700 text-white font-bold px-6 py-2 rounded-lg hover:bg-slate-800 transition-all"
          >
            Buka Rekap Jawaban
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">*Password default: guru123</p>
      </section>

      {/* Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">📋 Rekap Jawaban Siswa</h2>
                <p className="text-xs opacity-80">Pantau dan beri feedback pada progres kelompok</p>
              </div>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 rounded-full p-2 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {submissions.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <span className="text-6xl mb-4 block">📭</span>
                  <p className="text-xl font-medium">Belum ada jawaban siswa.</p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="border border-gray-100 rounded-2xl bg-gray-50 overflow-hidden shadow-sm transition-all">
                    {/* Header Row */}
                    <div 
                      onClick={() => toggleExpand(sub.id)}
                      className="p-4 flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${sub.aiScore >= 80 ? 'bg-green-500' : sub.aiScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                          {sub.aiScore}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg leading-tight">{sub.groupName}</h4>
                          <p className="text-xs text-gray-500 font-medium">{sub.members}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div className="hidden sm:block">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(sub.submittedAt).toLocaleTimeString('id-ID')}</p>
                          <p className="text-xs font-bold text-blue-600">Partikel: {sub.redInitial}</p>
                        </div>
                        <svg className={`w-6 h-6 text-gray-400 transform transition-transform ${expandedSub === sub.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Detailed Content (Expandable) */}
                    {expandedSub === sub.id && (
                      <div className="p-6 bg-white border-t border-gray-200 animate-fadeIn">
                        <div className="grid gap-5">
                          {/* AI Feedback */}
                          <div className="p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 shadow-sm">
                            <p className="font-bold text-indigo-700 text-sm mb-2 flex items-center gap-2">
                              <span>🤖</span> Analisis & Feedback AI:
                            </p>
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                              {sub.aiFeedback}
                            </p>
                          </div>

                          {/* Student Answers Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                              <p className="font-bold text-red-700 text-[10px] uppercase mb-1">Q1. Laju Pengurangan</p>
                              <p className="text-xs text-gray-700">{sub.answers.reduction}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="font-bold text-blue-700 text-[10px] uppercase mb-1">Q2. Laju Pembentukan</p>
                              <p className="text-xs text-gray-700">{sub.answers.formation}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <p className="font-bold text-purple-700 text-[10px] uppercase mb-1">Q3. Tanda +/-</p>
                              <p className="text-xs text-gray-700">{sub.answers.negative}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                              <p className="font-bold text-green-700 text-[10px] uppercase mb-1">Q4. Karhutla & Udara</p>
                              <p className="text-xs text-gray-700">{sub.answers.air}</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 md:col-span-2">
                              <p className="font-bold text-yellow-700 text-[10px] uppercase mb-1">Q5. Definisi Laju Reaksi</p>
                              <p className="text-xs text-gray-700">{sub.answers.definition}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-600">Terangkum: {submissions.length} kelompok</p>
              <button 
                onClick={downloadCSV}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                📥 Download CSV Lengkap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {/* Fixed: toast.type === 'red-600' was an invalid comparison and assignment. Now uses 'bg-red-600' as default for error type. */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl text-white font-bold animate-bounce flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-amber-600' : 'bg-red-600'}`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;