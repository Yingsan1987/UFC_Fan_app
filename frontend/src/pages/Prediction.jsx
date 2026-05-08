import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Trophy, Calendar, MapPin, Check, Users, Share2, Download, X,
} from 'lucide-react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://ufc-fan-app-backend.onrender.com/api');

const formatEventDate = (dateString) => {
  if (!dateString) return 'TBD';
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) return dateString;
  try {
    return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateString; }
};

const formatGeneratedAt = (isoString) => {
  if (!isoString) return '';
  const parsed = Date.parse(isoString);
  if (!Number.isFinite(parsed)) return '';
  try {
    return new Date(parsed).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
};

const slugify = (value) =>
  (value || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').replace(/-+$/, '') || 'ufc-predictions';

export default function Prediction() {
  const { currentUser, getAuthToken } = useAuth();
  const predictionsKey = useMemo(
    () => (currentUser?.uid ? `ufc_predictions_${currentUser.uid}` : 'ufc_predictions_guest'),
    [currentUser]
  );
  const historyKey = useMemo(
    () => (currentUser?.uid ? `ufc_prediction_history_${currentUser.uid}` : 'ufc_prediction_history_guest'),
    [currentUser]
  );

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [predictions, setPredictions] = useState({});
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);
  const [shareImage, setShareImage] = useState(null);
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
  const [shareError, setShareError] = useState(null);
  const shareCardRef = useRef(null);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/upcoming-events`)
      .then(res => {
        setUpcomingEvents(res.data);
        if (res.data.length > 0) setExpandedEvents({ 0: true });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(predictionsKey);
      setPredictions(saved ? JSON.parse(saved) : {});
    } catch { setPredictions({}); }
  }, [predictionsKey]);

  useEffect(() => {
    try { localStorage.setItem(predictionsKey, JSON.stringify(predictions)); } catch {}
  }, [predictions, predictionsKey]);

  useEffect(() => {
    if (!currentUser) { setPredictionHistory([]); setExpandedHistory({}); return; }
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const token = await getAuthToken();
        const res = await axios.get(`${API_URL}/predictions`, { headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled) {
          const entries = Array.isArray(res.data) ? res.data.map(normalizeHistoryEntry) : [];
          setPredictionHistory(entries);
          setExpandedHistory({});
          try { localStorage.setItem(historyKey, JSON.stringify(entries)); } catch {}
        }
      } catch {} finally { if (!cancelled) setHistoryLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [currentUser, getAuthToken, historyKey]);

  useEffect(() => {
    if (!currentUser) return;
    try { localStorage.setItem(historyKey, JSON.stringify(predictionHistory)); } catch {}
  }, [predictionHistory, historyKey, currentUser]);

  const normalizeHistoryEntry = (entry) => ({
    id: entry._id || entry.id,
    eventName: entry.eventName,
    eventDate: entry.eventDate,
    location: entry.location,
    savedAt: entry.savedAt,
    picks: Array.isArray(entry.picks) ? entry.picks.map(pick => ({
      fightLabel: pick.fightLabel,
      prediction: pick.prediction,
      cardType: pick.cardType,
      fighter1: pick.fighter1,
      fighter2: pick.fighter2,
      fighter1Image: pick.fighter1Image,
      fighter2Image: pick.fighter2Image,
      weightClass: pick.weightClass,
      predictedCorner: pick.predictedCorner,
    })) : [],
  });

  const saveHistoryEntryToServer = async (entry) => {
    const token = await getAuthToken();
    const res = await axios.post(`${API_URL}/predictions`, {
      eventName: entry.eventName, eventDate: entry.eventDate, location: entry.location,
      savedAt: entry.savedAt, picks: entry.picks,
    }, { headers: { Authorization: `Bearer ${token}` } });
    return normalizeHistoryEntry(res.data || {});
  };

  useEffect(() => {
    if (!isShareModalOpen || !isGeneratingShareImage || !sharePayload || !shareCardRef.current) return;
    const timeout = setTimeout(async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise(r => requestAnimationFrame(r));
        const canvas = await html2canvas(shareCardRef.current, {
          backgroundColor: '#0f172a', scale: window.devicePixelRatio > 1 ? 2 : 1.5, useCORS: true,
        });
        setShareImage(canvas.toDataURL('image/png'));
        setShareError(null);
      } catch { setShareError('Trouble creating share image. Please try again.'); }
      finally { setIsGeneratingShareImage(false); }
    }, 150);
    return () => clearTimeout(timeout);
  }, [isShareModalOpen, isGeneratingShareImage, sharePayload]);

  const toggleEvent = idx => setExpandedEvents(prev => ({ ...prev, [idx]: !prev[idx] }));
  const handlePrediction = (eIdx, fIdx, winner) => setPredictions(prev => ({ ...prev, [`${eIdx}-${fIdx}`]: winner }));
  const getPrediction = (eIdx, fIdx) => predictions[`${eIdx}-${fIdx}`];

  const groupFights = (fights) => {
    if (!fights?.length) return { mainCard: [], prelims: [] };
    return { mainCard: fights.slice(0, 6), prelims: fights.slice(6) };
  };

  const handleSubmitPredictions = async (event, eventIndex) => {
    const fights = Array.isArray(event?.fights) ? event.fights : [];
    const { mainCard } = groupFights(fights);
    const eventPredictions = fights.map((fight, idx) => {
      const prediction = getPrediction(eventIndex, idx) || 'No prediction';
      return {
        id: `${fight.fighter1 ?? '?'}-vs-${fight.fighter2 ?? '?'}`,
        fightLabel: `${fight.fighter1 ?? 'TBD'} vs ${fight.fighter2 ?? 'TBD'}`,
        prediction,
        fighter1: fight.fighter1 ?? 'TBD',
        fighter2: fight.fighter2 ?? 'TBD',
        fighter1Image: fight.fighter1Image ?? null,
        fighter2Image: fight.fighter2Image ?? null,
        cardType: idx < mainCard.length ? 'main' : 'prelims',
        predictedCorner: prediction === fight.fighter1 ? 'fighter1' : prediction === fight.fighter2 ? 'fighter2' : null,
        weightClass: fight.weightClass || fight.weight_class || '',
      };
    });

    const picksMade = eventPredictions.filter(p => p.prediction && p.prediction !== 'No prediction');
    if (picksMade.length === 0) { alert('Select at least one fighter before sharing your predictions.'); return; }

    const payload = {
      eventName: event.eventName, eventDate: event.eventDate, location: event.location,
      predictions: eventPredictions, picksMade: picksMade.length,
      totalFights: fights.length, generatedAt: new Date().toISOString(),
    };

    setSharePayload(payload);
    setShareImage(null); setShareError(null);
    setIsShareModalOpen(true); setIsGeneratingShareImage(true);

    if (currentUser) {
      const historyEntry = {
        eventName: payload.eventName, eventDate: payload.eventDate, location: payload.location,
        savedAt: payload.generatedAt,
        picks: picksMade.map(pick => ({
          fightLabel: pick.fightLabel, prediction: pick.prediction, cardType: pick.cardType,
          fighter1: pick.fighter1, fighter2: pick.fighter2,
          fighter1Image: pick.fighter1Image ?? null, fighter2Image: pick.fighter2Image ?? null,
          weightClass: pick.weightClass, predictedCorner: pick.predictedCorner,
        })),
      };
      try {
        const savedEntry = await saveHistoryEntryToServer(historyEntry);
        setPredictionHistory(prev => [savedEntry, ...prev.filter(i => i.id !== savedEntry.id)].slice(0, 50));
      } catch { alert('Could not save prediction history. Please try again.'); }
    } else {
      alert('Sign in to save your prediction history for later.');
    }
  };

  const handleDownloadShareImage = () => {
    if (!shareImage || !sharePayload) return;
    const link = document.createElement('a');
    link.href = shareImage;
    link.download = `${slugify(sharePayload.eventName)}-predictions.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false); setShareImage(null); setShareError(null); setIsGeneratingShareImage(false);
  };

  const handleNativeShare = async () => {
    if (!shareImage || !sharePayload) return;
    if (!navigator.share || !navigator.canShare) { handleDownloadShareImage(); return; }
    try {
      const res = await fetch(shareImage);
      const blob = await res.blob();
      const filename = `${slugify(sharePayload.eventName)}-predictions.png`;
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      if (!navigator.canShare({ files: [file] })) { handleDownloadShareImage(); return; }
      await navigator.share({ files: [file], title: `${sharePayload.eventName} Predictions`, text: `My picks for ${sharePayload.eventName}!` });
    } catch { handleDownloadShareImage(); }
  };

  const handleClearHistory = async () => {
    if (!currentUser) { alert('Sign in to manage your prediction history.'); return; }
    if (!window.confirm('Clear all saved prediction history?')) return;
    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/predictions`, { headers: { Authorization: `Bearer ${token}` } });
      setPredictionHistory([]);
      try { localStorage.removeItem(historyKey); } catch {}
    } catch { alert('Could not clear history. Please try again.'); }
  };

  const handleDeleteHistoryEntry = async (entryId) => {
    if (!currentUser) { alert('Sign in to manage your prediction history.'); return; }
    if (!window.confirm('Remove this saved prediction entry?')) return;
    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/predictions/${entryId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPredictionHistory(prev => prev.filter(e => e.id !== entryId));
    } catch { alert('Could not remove that entry. Please try again.'); }
  };

  const shareCardPicks = useMemo(() => {
    if (!sharePayload) return [];
    return sharePayload.predictions.filter(p => p.prediction && p.prediction !== 'No prediction');
  }, [sharePayload]);

  const shareCardMainPicks = shareCardPicks.filter(p => p.cardType === 'main');
  const shareCardPrelimPicks = shareCardPicks.filter(p => p.cardType === 'prelims');

  const renderSharePickRow = (pick, index) => (
    <div key={`${pick.id}-${index}`} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      {pick.weightClass && <div className="text-[11px] uppercase tracking-[0.35em] text-red-300">{pick.weightClass}</div>}
      <div className="flex items-center gap-3">
        <div className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold ${pick.predictedCorner === 'fighter1' ? 'bg-yellow-300 text-slate-900 shadow-lg' : 'bg-white/10 text-white'}`}>
          {pick.fighter1}
        </div>
        <div className="text-[11px] uppercase tracking-[0.4em] text-white/60">vs</div>
        <div className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold ${pick.predictedCorner === 'fighter2' ? 'bg-yellow-300 text-slate-900 shadow-lg' : 'bg-white/10 text-white'}`}>
          {pick.fighter2}
        </div>
      </div>
      <div className="text-xs uppercase tracking-[0.3em] text-white/60">
        My pick: <span className="text-white">{pick.prediction}</span>
      </div>
    </div>
  );

  // Sub-components
  const FighterCard = ({ fighter, fighterImage, onSelect, isSelected, corner }) => {
    const [imgOk, setImgOk] = useState(true);
    const initials = (fighter || '?')[0].toUpperCase();
    const isRed = corner === 'red';

    return (
      <motion.div whileTap={{ scale: 0.95 }} onClick={onSelect}
        className={`cursor-pointer rounded-2xl p-3 flex flex-col items-center gap-2 transition-all border-2 ${
          isSelected
            ? isRed ? 'border-red-500 bg-red-50 shadow-lg' : 'border-blue-500 bg-blue-50 shadow-lg'
            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {fighterImage && imgOk ? (
          <img src={fighterImage} alt={fighter}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover object-top border-4 ${isRed ? 'border-red-500' : 'border-blue-500'} shadow-md`}
            onError={() => setImgOk(false)} />
        ) : (
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-2xl border-4 shadow-md ${isRed ? 'bg-gradient-to-br from-red-500 to-red-800 border-red-500' : 'bg-gradient-to-br from-blue-500 to-blue-800 border-blue-500'}`}>
            {initials}
          </div>
        )}
        <p className={`text-xs sm:text-sm font-black text-center leading-tight ${isSelected ? (isRed ? 'text-red-700' : 'text-blue-700') : 'text-gray-900'}`}>
          {fighter}
        </p>
        {isSelected && (
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isRed ? 'bg-red-600' : 'bg-blue-600'}`}>
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {!isSelected && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRed ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50'}`}>
            {isRed ? 'RED' : 'BLUE'}
          </span>
        )}
      </motion.div>
    );
  };

  const FightCard = ({ fight, eventIndex, fightIndex }) => {
    const prediction = getPrediction(eventIndex, fightIndex);
    return (
      <div className={`rounded-2xl border-2 overflow-hidden transition-all ${prediction ? 'border-green-300 shadow-md' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}>
        {fight.weightClass && (
          <div className="bg-gray-900 text-center py-1.5">
            <span className="text-xs font-black text-gray-300 uppercase tracking-wider">{fight.weightClass}</span>
          </div>
        )}
        <div className="bg-white p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FighterCard fighter={fight.fighter1} fighterImage={fight.fighter1Image}
                onSelect={() => handlePrediction(eventIndex, fightIndex, fight.fighter1)}
                isSelected={prediction === fight.fighter1} corner="red" />
            </div>
            <div className="flex-shrink-0 text-center">
              <span className="font-black text-red-600 text-base sm:text-xl">VS</span>
            </div>
            <div className="flex-1">
              <FighterCard fighter={fight.fighter2} fighterImage={fight.fighter2Image}
                onSelect={() => handlePrediction(eventIndex, fightIndex, fight.fighter2)}
                isSelected={prediction === fight.fighter2} corner="blue" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Loading upcoming events…</p>
      </div>
    </div>
  );

  if (upcomingEvents.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔮</div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Upcoming Fights</h3>
        <p className="text-gray-500 text-sm">Check back later for upcoming UFC events to predict!</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Hidden share card for html2canvas */}
      {sharePayload && (
        <div ref={shareCardRef}
          className="w-[880px] rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-12 text-white shadow-[0_45px_120px_rgba(15,23,42,0.7)]"
          style={{ position: 'absolute', top: 0, left: -10000, pointerEvents: 'none', opacity: 0, zIndex: -1 }}
        >
          <div className="flex flex-col gap-8 font-sans">
            <div className="flex items-center justify-between rounded-[28px] border border-white/10 bg-gradient-to-r from-red-700 to-red-500 px-6 py-5 shadow-[0_15px_45px_rgba(239,68,68,0.35)]">
              <div>
                <div className="text-xs uppercase tracking-[0.5em] text-white/80">UFC Fight Night</div>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-white">{sharePayload.eventName}</h2>
                <div className="mt-1 text-sm font-medium uppercase tracking-[0.35em] text-white/70">{sharePayload.location || 'Location TBA'}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.45em] text-white/70">Main Card</div>
                <div className="mt-1 text-2xl font-black">{formatEventDate(sharePayload.eventDate)}</div>
                <div className="text-[11px] uppercase tracking-[0.45em] text-white/60">Generated {formatGeneratedAt(sharePayload.generatedAt)}</div>
              </div>
            </div>
            {shareCardPicks.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-white/70">
                Your fight picks will appear here.
              </div>
            )}
            {shareCardMainPicks.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-white/70">
                  <span>Main Card Picks</span><span>{shareCardMainPicks.length} fights</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{shareCardMainPicks.map(renderSharePickRow)}</div>
              </div>
            )}
            {shareCardPrelimPicks.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-white/70">
                  <span>Prelims</span><span>{shareCardPrelimPicks.length} fights</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{shareCardPrelimPicks.map(renderSharePickRow)}</div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white/60">
              <span>{sharePayload.picksMade} picks · {sharePayload.totalFights} fights</span>
              <span>@ufc-fan-app</span>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 text-white px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl font-black tracking-tight">🔮 Fight Predictions</h1>
              <p className="text-gray-400 mt-1 text-sm">Pick your winners and share your fight card</p>
              {/* Stats */}
              <div className="flex gap-4 mt-5 flex-wrap">
                {[
                  { label: 'Events', value: upcomingEvents.length, color: 'text-red-400' },
                  { label: 'Total Fights', value: upcomingEvents.reduce((s, e) => s + (e.fights?.length || 0), 0), color: 'text-yellow-400' },
                  { label: 'Your Picks', value: Object.keys(predictions).length, color: 'text-green-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/10 rounded-xl px-4 py-2 text-center">
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <p className="text-sm text-blue-800">Click on a fighter to select your pick. When you're done, hit Submit to generate a shareable image of your predictions.</p>
          </div>

          {/* Event accordions */}
          {upcomingEvents.map((event, eventIndex) => {
            const isExpanded = expandedEvents[eventIndex];
            const { mainCard, prelims } = groupFights(event.fights);
            const totalPreds = event.fights?.filter((_, idx) => getPrediction(eventIndex, idx)).length || 0;
            const totalFights = event.fights?.length || 0;
            const progress = totalFights > 0 ? (totalPreds / totalFights) * 100 : 0;

            return (
              <motion.div key={eventIndex} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: eventIndex * 0.06 }}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <button onClick={() => toggleEvent(eventIndex)}
                  className="w-full bg-gradient-to-r from-red-700 to-red-900 text-white p-4 sm:p-6 text-left hover:brightness-105 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Trophy className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-black text-lg sm:text-xl truncate">{event.eventName}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-red-200 text-xs mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.eventDate || 'TBD'}</span>
                          {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate max-w-[120px]">{event.location}</span></span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-yellow-300 font-black text-sm">{totalPreds}/{totalFights}</div>
                        <div className="text-red-200 text-xs">picked</div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 bg-red-900/50 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-yellow-400 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </button>

                {/* Fight grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-6 bg-gray-50 space-y-6">
                        {mainCard.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex items-center gap-2 bg-red-700 text-white px-4 py-1.5 rounded-full">
                                <Trophy className="w-4 h-4 text-yellow-300" />
                                <span className="font-black text-sm uppercase">Main Card</span>
                              </div>
                              <span className="text-sm text-gray-400 font-medium">
                                {mainCard.filter((_, i) => getPrediction(eventIndex, i)).length}/{mainCard.length} picked
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {mainCard.map((fight, fIdx) => (
                                <FightCard key={fIdx} fight={fight} eventIndex={eventIndex} fightIndex={fIdx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {prelims.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex items-center gap-2 bg-blue-700 text-white px-4 py-1.5 rounded-full">
                                <Users className="w-4 h-4" />
                                <span className="font-black text-sm uppercase">Prelims</span>
                              </div>
                              <span className="text-sm text-gray-400 font-medium">
                                {prelims.filter((_, i) => getPrediction(eventIndex, i + mainCard.length)).length}/{prelims.length} picked
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {prelims.map((fight, fIdx) => (
                                <FightCard key={fIdx + mainCard.length} fight={fight} eventIndex={eventIndex} fightIndex={fIdx + mainCard.length} />
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleSubmitPredictions(event, eventIndex)}
                          className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-4 rounded-2xl font-black text-base hover:from-red-700 hover:to-red-900 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-5 h-5" /> Share My Predictions
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Prediction history */}
          {(currentUser || predictionHistory.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-black text-gray-900 text-lg">📁 Prediction History</h3>
                  <p className="text-gray-500 text-sm">
                    {currentUser ? 'Synced to your account' : 'Sign in to save history across sessions'}
                  </p>
                </div>
                <button onClick={handleClearHistory}
                  disabled={!currentUser || predictionHistory.length === 0}
                  className="text-sm font-semibold text-gray-500 border border-gray-200 px-4 py-1.5 rounded-xl hover:border-gray-300 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Clear All
                </button>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : predictionHistory.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-400">
                  {currentUser ? 'No saved predictions yet. Submit picks to start building history.' : 'Sign in to save prediction cards.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {predictionHistory.map(entry => (
                    <div key={entry.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{entry.eventName}</h4>
                          <p className="text-xs text-gray-400">
                            {entry.eventDate ? formatEventDate(entry.eventDate) : 'TBD'}
                            {entry.location ? ` · ${entry.location}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-900 text-white text-xs font-black px-2.5 py-0.5 rounded-full">{entry.picks.length} picks</span>
                          <button onClick={() => handleDeleteHistoryEntry(entry.id)}
                            className="text-xs text-red-500 border border-red-200 px-2.5 py-0.5 rounded-full hover:border-red-300 font-semibold transition-all">
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {(expandedHistory[entry.id] ? entry.picks : entry.picks.slice(0, 6)).map((pick, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100 text-xs">
                            <span className="text-gray-500 truncate">{pick.fightLabel}</span>
                            <span className="font-bold text-gray-900 ml-2 flex-shrink-0">{pick.prediction}</span>
                          </div>
                        ))}
                      </div>
                      {entry.picks.length > 6 && (
                        <button onClick={() => setExpandedHistory(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800">
                          {expandedHistory[entry.id] ? 'Show less' : `Show all ${entry.picks.length} picks`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {isShareModalOpen && sharePayload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto">
              <button onClick={handleCloseShareModal}
                className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors z-50">
                <X className="w-4 h-4" />
              </button>

              <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Share Your Picks</h3>
                  <p className="text-gray-500 text-sm mb-6">Download or share this image to Instagram, X, or anywhere.</p>

                  <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 mb-6 space-y-1">
                    <p className="font-bold text-gray-800 mb-2">Tips</p>
                    <p>• Tap Download to save to camera roll</p>
                    <p>• Use Share if your device supports it</p>
                    <p>• Tag us @UFC Fan App!</p>
                  </div>

                  {shareError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{shareError}</div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleDownloadShareImage}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-5 py-3 rounded-2xl font-black hover:from-red-700 hover:to-red-900 transition-all shadow-lg">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button onClick={handleNativeShare}
                      className="flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-semibold hover:border-gray-300 transition-all">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>

                <div className="bg-gray-100 flex items-center justify-center p-6 min-h-[300px]">
                  {isGeneratingShareImage ? (
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                  ) : shareImage ? (
                    <img src={shareImage} alt="Predictions preview" className="rounded-2xl shadow-xl max-w-full" />
                  ) : (
                    <div className="text-center text-gray-400 text-sm">Preparing preview…</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
