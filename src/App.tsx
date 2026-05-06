/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Users, 
  MapPin, 
  GraduationCap, 
  ChevronDown, 
  Save, 
  SkipForward, 
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { bankPertanyaan } from './questions';

interface Candidate {
  candidate_id: string;
  nama: string;
  kelas: string;
  divisi: string;
  ruangan?: string;
  foto: string;
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbwMqFdsMWmo03OUC6HA0mLw2ih6gHw3VQrmfQ71FbTqXcr-a3vnBICcld4_t4k5Cr-qhw/exec";

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [view, setView] = useState<'divisions' | 'candidates' | 'form'>('divisions');

  // Form State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<string>('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GAS_URL}?action=getCandidates`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCandidates(data);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setMessage({ type: 'error', text: 'Gagal memuat data dari Spreadsheet.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCandidate(null);
    setAnswers({});
    setNotes('');
    setRating('');
    setMessage(null);
    setView('candidates');
  };

  const handleSkip = () => {
    if (confirm("Ingin melewati kandidat ini? Data yang belum disimpan akan hilang.")) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !rating) {
      setMessage({ type: 'error', text: 'Pilih rating akhir.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        action: 'saveInterview',
        data: {
          candidate_id: selectedCandidate.candidate_id,
          nama: selectedCandidate.nama,
          divisi: selectedCandidate.divisi,
          jawaban: answers,
          catatan: notes,
          rating: rating,
        }
      };

      if (GAS_URL) {
        await fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload)
        });
      }

      setMessage({ type: 'success', text: 'Data disimpan!' });
      setTimeout(() => resetForm(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengirim data.' });
    } finally {
      setSubmitting(false);
    }
  };

  const divisions = Object.keys(bankPertanyaan);
  const filteredCandidates = candidates.filter(c => c.divisi === selectedDivision);
  const currentQuestions = selectedCandidate ? bankPertanyaan[selectedCandidate.divisi] || [] : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-rose-500 selection:text-white pb-10">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-900 py-4 px-6 md:px-12 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">SHC RECRUIT 2026</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Interview Management System</p>
        </div>
        {view !== 'divisions' && (
          <button 
            onClick={() => view === 'candidates' ? setView('divisions') : setView('candidates')}
            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
          >
            ← Kembali
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          {/* SCREEN 1: PILIH DIVISI */}
          {view === 'divisions' && (
            <motion.div 
              key="divisions"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-3xl font-bold">Pilih Divisi</h2>
                <p className="text-gray-500">Pilih divisi yang sedang Anda wawancarai saat ini.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {divisions.map((div) => (
                  <button
                    key={div}
                    onClick={() => { setSelectedDivision(div); setView('candidates'); }}
                    className="flex items-center gap-3 p-5 bg-[#141414] border border-gray-800 rounded-2xl hover:border-gray-500 hover:bg-[#1a1a1a] transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ClipboardList size={18} className="text-gray-400" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wide leading-tight">{div}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: DAFTAR KANDIDAT DIPILIH */}
          {view === 'candidates' && (
            <motion.div 
              key="candidates"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-500 font-bold uppercase tracking-widest text-[10px]">
                  <CheckCircle2 size={12} /> {selectedDivision}
                </div>
                <h2 className="text-3xl font-bold">Kandidat</h2>
                <p className="text-gray-500">Klik nama untuk memulai wawancara.</p>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-700" size={32} /></div>
              ) : filteredCandidates.length > 0 ? (
                <div className="space-y-3">
                  {filteredCandidates.map((cand, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedCandidate(cand); setView('form'); }}
                      className="w-full flex items-center gap-4 p-4 bg-[#141414] border border-gray-800 rounded-2xl hover:border-gray-600 transition-all text-left"
                    >
                      <img src={cand.foto} className="w-12 h-12 rounded-full object-cover border border-gray-800" alt="" />
                      <div>
                        <div className="font-bold leading-tight">{cand.nama}</div>
                        <div className="text-xs text-gray-500">{cand.kelas} • {cand.ruangan || 'No Room'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-600 border border-dashed border-gray-800 rounded-3xl">
                  Belum ada kandidat terdaftar di divisi ini.
                </div>
              )}
            </motion.div>
          )}

          {/* SCREEN 3: FORM WAWANCARA */}
          {view === 'form' && selectedCandidate && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8 max-w-2xl mx-auto"
            >
              {/* Header Profile */}
              <div className="flex items-center gap-6 p-6 bg-[#111] rounded-3xl border border-gray-800">
                <img src={selectedCandidate.foto} className="w-24 h-24 rounded-full object-cover border-4 border-[#1e1e1e]" alt="" />
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic">{selectedCandidate.nama}</h2>
                  <div className="text-gray-500 text-sm">{selectedCandidate.kelas}</div>
                  <div className="inline-block px-3 py-1 mt-2 bg-rose-500 text-white text-[10px] font-bold uppercase rounded-full">
                    Divisi: {selectedCandidate.divisi}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-10">
                  {currentQuestions.map((q, i) => (
                    <div key={i} className="space-y-4">
                      <label className="block text-lg font-medium text-gray-200">{i + 1}. {q}</label>
                      <textarea 
                        required
                        value={answers[q] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                        className="w-full bg-[#161616] border border-gray-800 rounded-2xl p-5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 min-h-[120px]"
                        placeholder="Berikan jawaban/ponit-point penting..."
                      />
                    </div>
                  ))}

                  <div className="space-y-4 pt-6 border-t border-gray-900">
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest">Catatan Umum</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#161616] border border-gray-800 rounded-2xl p-5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 min-h-[100px]"
                    />
                  </div>

                  {/* Rating */}
                  <div className="bg-[#111] p-8 rounded-3xl border border-gray-800 space-y-6">
                    <h3 className="text-center font-black italic uppercase tracking-widest text-xs text-gray-500">Rekomendasi Akhir</h3>
                    <div className="flex gap-4">
                      {[
                        { id: 'S', label: 'SETUJU', color: 'peer-checked:bg-emerald-500 peer-checked:text-black border-emerald-900/30' },
                        { id: 'RR', label: 'RAGU-RAGU', color: 'peer-checked:bg-yellow-500 peer-checked:text-black border-yellow-900/30' },
                        { id: 'TS', label: 'TDK SETUJU', color: 'peer-checked:bg-red-500 peer-checked:text-black border-red-900/30' }
                      ].map((item) => (
                        <label key={item.id} className="flex-1 cursor-pointer">
                          <input type="radio" name="rating" value={item.id} checked={rating === item.id} onChange={(e) => setRating(e.target.value)} className="sr-only peer" />
                          <div className={`h-16 flex items-center justify-center font-black text-[10px] tracking-tighter border rounded-2xl transition-all ${item.color} bg-[#1a1a1a]`}>
                            {item.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    <AlertCircle size={20} /> <span className="font-bold">{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pb-12">
                  <button type="button" onClick={handleSkip} disabled={submitting} className="p-6 bg-[#181818] rounded-3xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-800 transition-colors">SKIP / BATAL</button>
                  <button type="submit" disabled={submitting} className="p-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'SIMPAN & SUBMIT'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Lighting Decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 blur-[150px] pointer-events-none -z-10 rounded-full" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] pointer-events-none -z-10 rounded-full" />
    </div>
  );
}
