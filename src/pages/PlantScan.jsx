import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, Upload, Leaf, History, Zap,
  X, LayoutDashboard, Pencil, GitCompare, ChevronRight, Flame, Scan
} from 'lucide-react';
import { toast } from 'sonner';

import ScanCamera from '@/components/plantScan/ScanCamera.jsx';
import ScanAnalyzer from '@/components/plantScan/ScanAnalyzer.jsx';
import ScanResultDisplay from '@/components/plantScan/ScanResultDisplay.jsx';
import ScanHistoryTimeline from '@/components/plantScan/ScanHistoryTimeline.jsx';
import EnvironmentInputPanel from '@/components/plantScan/EnvironmentInputPanel.jsx';
import ScanDashboard from '@/components/plantScan/ScanDashboard.jsx';
import ScanComparison from '@/components/plantScan/ScanComparison.jsx';

const SCAN_MODES = [
  { id: 'health',    emoji: '🏥', label: 'Gesundheit',  desc: 'Vollständige Analyse' },
  { id: 'pest',      emoji: '🐛', label: 'Schädlinge',  desc: 'Pest & Krankheiten' },
  { id: 'nutrient',  emoji: '🧪', label: 'Nährstoffe',  desc: 'Mangel & Überschuss' },
  { id: 'identify',  emoji: '🔬', label: 'Identität',   desc: 'Was ist das?' },
];

export default function PlantScan() {
  const location = useLocation();
  const navigate = useNavigate();
  const diaryId = new URLSearchParams(location.search).get('diary');

  const [phase, setPhase] = useState('capture');
  const [capturedImage, setCapturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanMode, setScanMode] = useState('health');
  const [scanResult, setScanResult] = useState(null);
  const [linkedDiary, setLinkedDiary] = useState(null);
  const [previousScans, setPreviousScans] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [envData, setEnvData] = useState({});
  const [plantName, setPlantName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [quickScan, setQuickScan] = useState(false);

  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      let diary = null;
      if (diaryId) {
        const diaries = await base44.entities.GrowDiary.list('-created_date', 100).catch(() => []);
        diary = diaries.find(d => d.id === diaryId) || null;
      }
      const scans = await base44.entities.PlantScan.list('-created_date', 30).catch(() => []);
      setPreviousScans(scans || []);
      if (diary) {
        setLinkedDiary(diary);
        setPlantName(diary.strain_name || diary.name || '');
        setEnvData(prev => ({
          ...prev,
          current_stage: diary.current_stage || prev.current_stage,
          grow_medium: diary.grow_method === 'soil' ? 'Erde' : diary.grow_method === 'coco' ? 'Coco' : diary.grow_method === 'hydro' ? 'Hydro' : prev.grow_medium,
        }));
      }
    };
    load();
  }, [diaryId]);

  const handleCapture = useCallback((file, preview) => {
    setCapturedImage(file);
    setImagePreview(preview);
    setPhase(quickScan ? 'analyzing' : 'env');
  }, [quickScan]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCapturedImage(file);
    setImagePreview(preview);
    setPhase(quickScan ? 'analyzing' : 'env');
  }, [quickScan]);

  const startAnalysis = useCallback(() => {
    if (!capturedImage) return;
    setPhase('analyzing');
  }, [capturedImage]);

  const handleAnalysisComplete = useCallback((result) => {
    setScanResult(result);
    setPhase('result');
    base44.entities.PlantScan.list('-created_date', 30).then(s => setPreviousScans(s || [])).catch(() => {});
  }, []);

  const resetScan = useCallback(() => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setCapturedImage(null);
    setImagePreview(null);
    setScanResult(null);
    setPhase('capture');
    setShowHistory(false);
    setShowDashboard(false);
    setShowComparison(false);
  }, [imagePreview]);

  const handleSelectHistoryScan = useCallback((scan) => {
    if (!scan.analysis_result) { toast.error('Keine Analyse-Daten'); return; }
    setScanResult(scan.analysis_result);
    setImagePreview(scan.image_url);
    setPhase('result');
    setShowHistory(false);
    setShowDashboard(false);
    setShowComparison(false);
  }, []);

  const refreshScans = useCallback(() => {
    base44.entities.PlantScan.list('-created_date', 30).then(s => setPreviousScans(s || [])).catch(() => {});
  }, []);

  const overlay = showDashboard || showHistory || showComparison;
  const currentMode = SCAN_MODES.find(m => m.id === scanMode);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-zinc-800/60 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Plant name */}
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            <Leaf className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            {editingName ? (
              <input
                ref={nameInputRef}
                value={plantName}
                onChange={e => setPlantName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                placeholder="Pflanzenname..."
                className="bg-transparent text-white text-sm font-bold outline-none border-b border-green-500/40 w-36 text-center"
                autoFocus
              />
            ) : (
              <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 group">
                <span className="text-sm font-bold text-white">{plantName || 'Plant Scanner'}</span>
                <span className="text-[9px] font-black text-black bg-green-500 px-1.5 py-0.5 rounded-md">AI</span>
                <Pencil className="w-2.5 h-2.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">
            {previousScans.length >= 2 && (
              <button
                onClick={() => { setShowComparison(!showComparison); setShowDashboard(false); setShowHistory(false); }}
                className={`p-2 rounded-xl transition-all ${showComparison ? 'bg-blue-500/15 text-blue-400' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'}`}
              >
                <GitCompare className="w-[18px] h-[18px]" />
              </button>
            )}
            {previousScans.length > 0 && (
              <>
                <button
                  onClick={() => { setShowDashboard(!showDashboard); setShowHistory(false); setShowComparison(false); }}
                  className={`p-2 rounded-xl transition-all ${showDashboard ? 'bg-green-500/15 text-green-400' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'}`}
                >
                  <LayoutDashboard className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => { setShowHistory(!showHistory); setShowDashboard(false); setShowComparison(false); }}
                  className={`p-2 rounded-xl relative transition-all ${showHistory ? 'bg-green-500/15 text-green-400' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'}`}
                >
                  <History className="w-[18px] h-[18px]" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                    {previousScans.length > 9 ? '9+' : previousScans.length}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Linked Diary Pill */}
        {linkedDiary && phase === 'capture' && !overlay && (
          <div className="px-4 pb-2.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/[0.08] border border-green-500/[0.15] rounded-xl">
              <span className="text-sm">📔</span>
              <span className="text-xs text-green-400 font-semibold truncate flex-1">{linkedDiary.name}</span>
              <span className="text-[10px] text-green-500/60 font-medium flex-shrink-0">{linkedDiary.current_stage}</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto pb-28">
        <AnimatePresence mode="wait">

          {/* COMPARISON */}
          {showComparison && (
            <motion.div key="comparison" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-4 px-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-lg">Scan-Vergleich</h2>
                <button onClick={() => setShowComparison(false)} className="text-zinc-500 text-sm font-medium hover:text-white transition-colors">Zurück</button>
              </div>
              <ScanComparison scans={previousScans} />
            </motion.div>
          )}

          {/* DASHBOARD */}
          {showDashboard && !showComparison && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-4 px-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-black text-lg">KI-Dashboard</h2>
                <button onClick={() => setShowDashboard(false)} className="text-zinc-500 text-sm font-medium hover:text-white transition-colors">Zurück</button>
              </div>
              <ScanDashboard scans={previousScans} linkedDiary={linkedDiary} onRefreshDiary={d => setLinkedDiary(d)} />
            </motion.div>
          )}

          {/* CAPTURE */}
          {phase === 'capture' && !overlay && (
            <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 space-y-4">

              {/* Quick Scan Toggle */}
              <div className="px-4">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Quick-Scan</p>
                      <p className="text-[10px] text-zinc-600">Ohne Umgebungsdaten</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuickScan(!quickScan)}
                    className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${quickScan ? 'bg-orange-500' : 'bg-white/[0.08]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${quickScan ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Scan Mode */}
              <div className="px-4">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-2.5">Scan-Modus</p>
                <div className="grid grid-cols-4 gap-2">
                  {SCAN_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setScanMode(mode.id)}
                      className={`p-3 rounded-2xl text-center transition-all ${
                        scanMode === mode.id
                          ? 'bg-green-500/15 border border-green-500/30'
                          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="text-xl block mb-1">{mode.emoji}</span>
                      <span className={`text-[10px] font-bold block leading-tight ${scanMode === mode.id ? 'text-green-400' : 'text-zinc-600'}`}>
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <ScanCamera onCapture={handleCapture} />

              <div className="px-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-zinc-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/[0.06] hover:text-white transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Foto aus Galerie
                </button>
              </div>

              {/* Last scan preview */}
              {previousScans.length > 0 && (
                <div className="px-4">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="w-full flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-white/[0.05] transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08]">
                      <img src={previousScans[0].image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] text-zinc-600 font-medium">Letzter Scan</p>
                      <p className={`text-base font-black ${
                        previousScans[0].health_score >= 75 ? 'text-green-400' :
                        previousScans[0].health_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{previousScans[0].health_score}/100</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <span>Alle {previousScans.length}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ENV */}
          {phase === 'env' && !overlay && (
            <motion.div key="env" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-4 px-4 space-y-4">
              {imagePreview && (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.08]">
                  <img src={imagePreview} alt="Captured" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <button onClick={resetScan} className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg">
                    <span className="text-xs text-green-400 font-bold">{currentMode?.emoji} {currentMode?.label}</span>
                  </div>
                </div>
              )}
              <EnvironmentInputPanel data={envData} onChange={setEnvData} />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={startAnalysis}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black text-base rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                KI-Analyse starten
              </motion.button>
              <button onClick={resetScan} className="w-full py-2.5 text-zinc-600 text-sm font-medium hover:text-zinc-400 transition-colors">
                Abbrechen
              </button>
            </motion.div>
          )}

          {/* ANALYZING */}
          {phase === 'analyzing' && !overlay && (
            <ScanAnalyzer
              key="analyzing"
              image={capturedImage}
              imagePreview={imagePreview}
              envData={envData}
              scanMode={scanMode}
              linkedDiary={linkedDiary}
              previousScans={previousScans}
              plantName={plantName}
              onComplete={handleAnalysisComplete}
              onError={resetScan}
            />
          )}

          {/* RESULT */}
          {phase === 'result' && scanResult && !overlay && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 px-4 space-y-4">
              {imagePreview && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/[0.08]">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {plantName && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/70 backdrop-blur-md rounded-xl">
                      <Leaf className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-white font-bold">{plantName}</span>
                    </div>
                  )}
                  {linkedDiary && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg">
                      <span className="text-[10px] text-green-400 font-semibold">📔 {linkedDiary.name}</span>
                    </div>
                  )}
                </div>
              )}

              <ScanResultDisplay result={scanResult} previousScans={previousScans} />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetScan}
                  className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <Scan className="w-4 h-4" />
                  Neuer Scan
                </button>
                <button
                  onClick={() => { setShowDashboard(true); setShowHistory(false); }}
                  className="py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white rounded-2xl flex items-center justify-center transition-all"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setShowHistory(true); setShowDashboard(false); }}
                  className="py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white rounded-2xl flex items-center justify-center transition-all"
                  title="Verlauf"
                >
                  <History className="w-4 h-4" />
                </button>
                {linkedDiary && (
                  <button
                    onClick={() => navigate(`/GrowDiaryDetail?id=${linkedDiary.id}`)}
                    className="py-3.5 px-4 bg-green-500/[0.08] border border-green-500/[0.15] text-green-400 hover:bg-green-500/[0.15] rounded-2xl flex items-center justify-center transition-all"
                    title="Tagebuch öffnen"
                  >
                    <span className="text-base">📔</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORY */}
          {showHistory && !showDashboard && !showComparison && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-4 px-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-black text-lg">Scan-Verlauf</h2>
                  <p className="text-xs text-zinc-600">{previousScans.length} Scans</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="text-zinc-500 text-sm font-medium hover:text-white transition-colors">Zurück</button>
              </div>
              {previousScans.length === 0 ? (
                <div className="text-center py-16">
                  <Camera className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Noch keine Scans vorhanden</p>
                </div>
              ) : (
                <ScanHistoryTimeline scans={previousScans} onSelectScan={handleSelectHistoryScan} onScansChanged={refreshScans} />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}