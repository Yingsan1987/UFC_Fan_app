import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  MapPin,
  Check,
  Users,
  Share2,
  Download,
  X,
} from 'lucide-react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';

// Use localhost in development, production URL as fallback
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
    return new Date(parsed).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.warn('Unable to format event date:', dateString, error);
    return dateString;
  }
};

const formatGeneratedAt = (isoString) => {
  if (!isoString) return '';
  const parsed = Date.parse(isoString);
  if (!Number.isFinite(parsed)) return '';
  try {
    return new Date(parsed).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('Unable to format generated timestamp:', isoString, error);
    return '';
  }
};

const slugify = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'ufc-predictions';

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
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/upcoming-events`);
        console.log('📅 Loaded upcoming events for predictions:', response.data);
        setUpcomingEvents(response.data);

        if (response.data.length > 0) {
          setExpandedEvents({ 0: true });
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    try {
      const savedPredictions = localStorage.getItem(predictionsKey);
      setPredictions(savedPredictions ? JSON.parse(savedPredictions) : {});
    } catch (error) {
      console.warn('Unable to load saved predictions:', error);
      setPredictions({});
    }
  }, [predictionsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(predictionsKey, JSON.stringify(predictions));
    } catch (error) {
      console.warn('Unable to persist predictions:', error);
    }
  }, [predictions, predictionsKey]);

  useEffect(() => {
    if (!currentUser) {
      setPredictionHistory([]);
      setExpandedHistory({});
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_URL}/predictions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled) {
          const entries = Array.isArray(response.data)
            ? response.data.map((entry) => ({
                id: entry._id || entry.id,
                eventName: entry.eventName,
                eventDate: entry.eventDate,
                location: entry.location,
                savedAt: entry.savedAt,
                picks: Array.isArray(entry.picks)
                  ? entry.picks.map((pick) => ({
                      fightLabel: pick.fightLabel,
                      prediction: pick.prediction,
                      cardType: pick.cardType,
                      fighter1: pick.fighter1,
                      fighter2: pick.fighter2,
                      weightClass: pick.weightClass,
                      predictedCorner: pick.predictedCorner,
                    }))
                  : [],
              }))
            : [];

          setPredictionHistory(entries);
          setExpandedHistory({});

          try {
            localStorage.setItem(historyKey, JSON.stringify(entries));
          } catch (storageError) {
            console.warn('Unable to cache prediction history:', storageError);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load prediction history:', error);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [currentUser, getAuthToken, historyKey]);

  useEffect(() => {
    if (!currentUser) return;

    try {
      localStorage.setItem(historyKey, JSON.stringify(predictionHistory));
    } catch (error) {
      console.warn('Unable to persist prediction history:', error);
    }
  }, [predictionHistory, historyKey, currentUser]);
  const normalizeHistoryEntry = (entry) => ({
    id: entry._id || entry.id,
    eventName: entry.eventName,
    eventDate: entry.eventDate,
    location: entry.location,
    savedAt: entry.savedAt,
    picks: Array.isArray(entry.picks)
      ? entry.picks.map((pick) => ({
          fightLabel: pick.fightLabel,
          prediction: pick.prediction,
          cardType: pick.cardType,
          fighter1: pick.fighter1,
          fighter2: pick.fighter2,
          fighter1Image: pick.fighter1Image,
          fighter2Image: pick.fighter2Image,
          weightClass: pick.weightClass,
          predictedCorner: pick.predictedCorner,
        }))
      : [],
  });

  const saveHistoryEntryToServer = async (entry) => {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_URL}/predictions`,
      {
        eventName: entry.eventName,
        eventDate: entry.eventDate,
        location: entry.location,
        savedAt: entry.savedAt,
        picks: entry.picks,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return normalizeHistoryEntry(response.data || {});
  };


  useEffect(() => {
    if (!isShareModalOpen || !isGeneratingShareImage || !sharePayload) return;
    if (!shareCardRef.current) return;

    const timeout = setTimeout(async () => {
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const canvas = await html2canvas(shareCardRef.current, {
          backgroundColor: '#0f172a',
          scale: window.devicePixelRatio > 1 ? 2 : 1.5,
          useCORS: true,
        });
        setShareImage(canvas.toDataURL('image/png'));
        setShareError(null);
      } catch (error) {
        console.error('Error generating share image:', error);
        setShareError('We had trouble creating your share image. Please try again.');
      } finally {
        setIsGeneratingShareImage(false);
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [isShareModalOpen, isGeneratingShareImage, sharePayload]);

  const toggleEvent = (index) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePrediction = (eventIndex, fightIndex, winner) => {
    const key = `${eventIndex}-${fightIndex}`;
    setPredictions((prev) => ({
      ...prev,
      [key]: winner,
    }));
    console.log('✅ Prediction saved:', { fight: key, winner });
  };

  const getPrediction = (eventIndex, fightIndex) => {
    const key = `${eventIndex}-${fightIndex}`;
    return predictions[key];
  };

  const groupFights = (fights) => {
    if (!fights || fights.length === 0) return { mainCard: [], prelims: [] };

    const mainCard = [];
    const prelims = [];

    fights.forEach((fight, index) => {
      if (index < 6) {
        mainCard.push(fight);
      } else {
        prelims.push(fight);
      }
    });

    return { mainCard, prelims };
  };

  const getFighterInitial = (name) => {
    if (!name) return '?';
    return name[0].toUpperCase();
  };

  const handleSubmitPredictions = async (event, eventIndex) => {
    const fights = Array.isArray(event?.fights) ? event.fights : [];
    const { mainCard } = groupFights(fights);
    const mainCardLength = mainCard.length;

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
        cardType: idx < mainCardLength ? 'main' : 'prelims',
        predictedCorner:
          prediction === fight.fighter1 ? 'fighter1' : prediction === fight.fighter2 ? 'fighter2' : null,
        weightClass: fight.weightClass || fight.weight_class || '',
      };
    });

    const picksMade = eventPredictions.filter(
      (item) => item.prediction && item.prediction !== 'No prediction'
    );

    if (picksMade.length === 0) {
      alert('Select at least one fighter before sharing your predictions.');
      return;
    }

    const payload = {
      eventName: event.eventName,
      eventDate: event.eventDate,
      location: event.location,
      predictions: eventPredictions,
      picksMade: picksMade.length,
      totalFights: fights.length,
      generatedAt: new Date().toISOString(),
    };

    console.log(`Predictions for ${event.eventName}:`, eventPredictions);
    setSharePayload(payload);
    setShareImage(null);
    setShareError(null);
    setIsShareModalOpen(true);
    setIsGeneratingShareImage(true);

    if (currentUser) {
      const historyEntry = {
        eventName: payload.eventName,
        eventDate: payload.eventDate,
        location: payload.location,
        savedAt: payload.generatedAt,
        picks: picksMade.map((pick) => ({
          fightLabel: pick.fightLabel,
          prediction: pick.prediction,
          cardType: pick.cardType,
          fighter1: pick.fighter1,
          fighter2: pick.fighter2,
          fighter1Image: pick.fighter1Image ?? null,
          fighter2Image: pick.fighter2Image ?? null,
          weightClass: pick.weightClass,
          predictedCorner: pick.predictedCorner,
        })),
      };

      try {
        const savedEntry = await saveHistoryEntryToServer(historyEntry);
        setPredictionHistory((prev) => {
          const withoutDuplicate = prev.filter((item) => item.id !== savedEntry.id);
          return [savedEntry, ...withoutDuplicate].slice(0, 50);
        });
      } catch (error) {
        console.error('Failed to save prediction history:', error);
        alert('We could not save your prediction history. Please try again.');
      }
    } else {
      alert('Sign in to save your prediction history for later.');
    }
  };

  const handleDownloadShareImage = () => {
    if (!shareImage || !sharePayload) return;
    const link = document.createElement('a');
    link.href = shareImage;
    link.download = `${slugify(sharePayload.eventName)}-predictions.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setShareImage(null);
    setShareError(null);
    setIsGeneratingShareImage(false);
  };

  const dataUrlToFile = async (dataUrl, filename) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const handleNativeShare = async () => {
    if (!shareImage || !sharePayload) return;

    if (!navigator.share || !navigator.canShare) {
      handleDownloadShareImage();
      return;
    }

    try {
      const filename = `${slugify(sharePayload.eventName)}-predictions.png`;
      const file = await dataUrlToFile(shareImage, filename);

      if (!navigator.canShare({ files: [file] })) {
        handleDownloadShareImage();
        return;
      }

      await navigator.share({
        files: [file],
        title: `${sharePayload.eventName} Predictions`,
        text: `My picks for ${sharePayload.eventName}!`,
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      alert(
        'We could not share the image automatically. Try downloading and uploading it manually.'
      );
    }
  };

  const shareCardPicks = useMemo(() => {
    if (!sharePayload) return [];
    return sharePayload.predictions.filter(
      (item) => item.prediction && item.prediction !== 'No prediction'
    );
  }, [sharePayload]);

  const shareCardMainPicks = shareCardPicks.filter((pick) => pick.cardType === 'main');
  const shareCardPrelimPicks = shareCardPicks.filter((pick) => pick.cardType === 'prelims');

  const renderSharePickRow = (pick, index) => (
    <div
      key={`${pick.id}-${index}`}
      className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
    >
      {pick.weightClass && (
        <div className="text-[11px] uppercase tracking-[0.35em] text-red-300">{pick.weightClass}</div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`flex-1 rounded-2xl px-4 py-3 text-sm sm:text-base font-semibold transition ${
            pick.predictedCorner === 'fighter1'
              ? 'bg-yellow-300 text-slate-900 shadow-lg'
              : 'bg-white/10 text-white'
          }`}
        >
          {pick.fighter1}
        </div>
        <div className="text-[11px] uppercase tracking-[0.4em] text-white/60">vs</div>
        <div
          className={`flex-1 rounded-2xl px-4 py-3 text-sm sm:text-base font-semibold transition ${
            pick.predictedCorner === 'fighter2'
              ? 'bg-yellow-300 text-slate-900 shadow-lg'
              : 'bg-white/10 text-white'
          }`}
        >
          {pick.fighter2}
        </div>
      </div>
      <div className="text-xs uppercase tracking-[0.3em] text-white/60">
        My pick: <span className="text-white">{pick.prediction}</span>
      </div>
    </div>
  );

  const handleClearHistory = async () => {
    if (!currentUser) {
      alert('Sign in to manage your saved prediction history.');
      return;
    }

    const confirmed = window.confirm('Clear all saved prediction history for your account?');
    if (!confirmed) return;
    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPredictionHistory([]);
      try {
        localStorage.removeItem(historyKey);
      } catch (storageError) {
        console.warn('Unable to clear cached prediction history:', storageError);
      }
    } catch (error) {
      console.error('Failed to clear prediction history:', error);
      alert('We could not clear your history. Please try again.');
    }
  };

  const toggleHistoryEntry = (entryId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const handleDeleteHistoryEntry = async (entryId) => {
    if (!currentUser) {
      alert('Sign in to manage your saved prediction history.');
      return;
    }

    const confirmed = window.confirm('Remove this saved prediction entry?');
    if (!confirmed) return;
    try {
      const token = await getAuthToken();
      await axios.delete(`${API_URL}/predictions/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPredictionHistory((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (error) {
      console.error('Failed to delete prediction history entry:', error);
      alert('We could not remove that entry. Please try again.');
    }
  };

  const FighterCard = ({ fighter, fighterImage, onSelect, isSelected, corner }) => {
    const borderColor = corner === 'red' ? 'border-red-500' : 'border-blue-500';
    const bgColor = corner === 'red' ? 'bg-red-500' : 'bg-blue-500';
    const selectedBg = isSelected
      ? corner === 'red'
        ? 'bg-red-100 border-red-600'
        : 'bg-blue-100 border-blue-600'
      : '';

    return (
      <div
        onClick={onSelect}
        className={`cursor-pointer transition-all ${selectedBg} hover:shadow-lg rounded-lg p-2`}
      >
        <div className="flex flex-col items-center">
          {fighterImage ? (
            <img
              src={fighterImage}
              alt={fighter}
              className={`w-14 h-14 md:w-20 md:h-20 rounded-full object-cover border-3 md:border-4 ${borderColor} mb-1 md:mb-2`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-14 h-14 md:w-20 md:h-20 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xl md:text-2xl border-3 md:border-4 ${borderColor} mb-1 md:mb-2">
                    ${getFighterInitial(fighter)}
                  </div>`;
              }}
            />
          ) : (
            <div
              className={`w-14 h-14 md:w-20 md:h-20 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xl md:text-2xl border-3 md:border-4 ${borderColor} mb-1 md:mb-2`}
            >
              {getFighterInitial(fighter)}
            </div>
          )}

          <div className="text-xs md:text-sm font-bold text-gray-900 text-center break-words max-w-[80px] md:max-w-none leading-tight">
            {fighter}
          </div>

          {isSelected && (
            <div className="mt-1 md:mt-2">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const FightCard = ({ fight, eventIndex, fightIndex }) => {
    const prediction = getPrediction(eventIndex, fightIndex);

    return (
      <div className="bg-white rounded-lg p-2 sm:p-3 md:p-4 lg:p-5 border-2 border-gray-200 hover:border-red-400 transition-all shadow-md hover:shadow-xl w-full">
        {fight.weightClass && (
          <div className="text-center mb-1 sm:mb-2 md:mb-3">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1 rounded-full text-xs font-bold uppercase">
              {fight.weightClass}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
          <FighterCard
            fighter={fight.fighter1}
            fighterImage={fight.fighter1Image}
            onSelect={() => handlePrediction(eventIndex, fightIndex, fight.fighter1)}
            isSelected={prediction === fight.fighter1}
            corner="red"
          />

          <div className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-red-600 flex-shrink-0 px-1">
            VS
          </div>

          <FighterCard
            fighter={fight.fighter2}
            fighterImage={fight.fighter2Image}
            onSelect={() => handlePrediction(eventIndex, fightIndex, fight.fighter2)}
            isSelected={prediction === fight.fighter2}
            corner="blue"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl md:text-6xl mb-4">🔮</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Upcoming Fights</h3>
          <p className="text-sm md:text-base text-gray-500">
            Check back later for upcoming UFC events to make your predictions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {sharePayload && (
        <div
          ref={shareCardRef}
          className="w-[880px] rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-12 text-white shadow-[0_45px_120px_rgba(15,23,42,0.7)]"
          style={{
            position: 'absolute',
            top: 0,
            left: -10000,
            pointerEvents: 'none',
            opacity: 0,
            zIndex: -1,
          }}
        >
          <div className="flex flex-col gap-8 font-sans">
            <div className="flex items-center justify-between rounded-[28px] border border-white/10 bg-gradient-to-r from-red-700 to-red-500 px-6 py-5 shadow-[0_15px_45px_rgba(239,68,68,0.35)]">
              <div>
                <div className="text-xs uppercase tracking-[0.5em] text-white/80">UFC Fight Night</div>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-white">{sharePayload.eventName}</h2>
                <div className="mt-1 text-sm font-medium uppercase tracking-[0.35em] text-white/70">
                  {sharePayload.location || 'Location TBA'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.45em] text-white/70">Main Card</div>
                <div className="mt-1 text-2xl font-black">{formatEventDate(sharePayload.eventDate)}</div>
                <div className="text-[11px] uppercase tracking-[0.45em] text-white/60">
                  Generated {formatGeneratedAt(sharePayload.generatedAt)}
                </div>
              </div>
            </div>

            {shareCardPicks.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-white/70">
                Your fight picks will appear here. Select winners and submit to lock in your card.
              </div>
            )}

            {shareCardMainPicks.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-white/70">
                  <span>Main Card Picks</span>
                  <span>{shareCardMainPicks.length} fights</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{shareCardMainPicks.map(renderSharePickRow)}</div>
              </div>
            )}

            {shareCardPrelimPicks.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.45em] text-white/70">
                  <span>Prelims</span>
                  <span>{shareCardPrelimPicks.length} fights</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">{shareCardPrelimPicks.map(renderSharePickRow)}</div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-6 py-4 text-[11px] uppercase tracking-[0.35em] text-white/60">
              <span>
                {sharePayload.picksMade} picks • {sharePayload.totalFights} fights
              </span>
              <span>@ufc-fan-app</span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Fight Predictions</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Make your predictions for upcoming UFC fights
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {upcomingEvents.map((event, eventIndex) => {
            const isExpanded = expandedEvents[eventIndex];
            const { mainCard, prelims } = groupFights(event.fights);
            const totalPredictions = event.fights?.filter((_, idx) => getPrediction(eventIndex, idx)).length || 0;

            return (
              <div key={eventIndex} className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleEvent(eventIndex)}
                  className="w-full p-3 sm:p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 touch-manipulation"
                >
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-left flex-1 min-w-0 overflow-hidden">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold break-words">{event.eventName}</h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-red-100 mt-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{event.eventDate || 'TBD'}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0 ml-2">
                    <div className="text-right mr-1 sm:mr-2 md:mr-4">
                      <div className="text-xs sm:text-sm md:text-base font-semibold text-yellow-300 whitespace-nowrap">
                        {totalPredictions}/{event.fights?.length || 0}
                      </div>
                      <div className="text-xs text-red-100 hidden sm:block whitespace-nowrap">
                        {event.fights?.length || 0} fights
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white flex-shrink-0" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    {mainCard.length > 0 && (
                      <div className="mb-4 sm:mb-6 md:mb-8">
                        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-2 px-3 sm:px-4 md:py-3 md:px-6 rounded-lg mb-3 sm:mb-4 md:mb-6 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
                            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400 flex-shrink-0" />
                            <h3 className="text-base sm:text-lg md:text-2xl font-black uppercase">Main Card</h3>
                          </div>
                          <span className="bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1 rounded-full text-xs sm:text-sm font-bold flex-shrink-0">
                            {mainCard.filter((_, idx) => getPrediction(eventIndex, idx)).length}/{mainCard.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                          {mainCard.map((fight, fightIndex) => (
                            <FightCard
                              key={fightIndex}
                              fight={fight}
                              eventIndex={eventIndex}
                              fightIndex={fightIndex}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {prelims.length > 0 && (
                      <div>
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-3 sm:px-4 md:py-3 md:px-6 rounded-lg mb-3 sm:mb-4 md:mb-6 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                            <h3 className="text-base sm:text-lg md:text-2xl font-black uppercase">Prelims</h3>
                          </div>
                          <span className="bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1 rounded-full text-xs sm:text-sm font-bold flex-shrink-0">
                            {prelims.filter((_, idx) => getPrediction(eventIndex, idx + mainCard.length)).length}/
                            {prelims.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                          {prelims.map((fight, fightIndex) => (
                            <FightCard
                              key={fightIndex + mainCard.length}
                              fight={fight}
                              eventIndex={eventIndex}
                              fightIndex={fightIndex + mainCard.length}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-300">
                      <button
                        className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:from-red-700 hover:to-red-900 transition-all shadow-lg touch-manipulation min-h-[44px]"
                        onClick={() => handleSubmitPredictions(event, eventIndex)}
                      >
                        Submit Predictions for {event.eventName}
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        💡 Click on a fighter to select your prediction
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">📋 How to Make Predictions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Click on an event header to expand the fight card</li>
            <li>2. For each fight, click on the fighter you predict will win</li>
            <li>3. Selected fighters will be highlighted with a checkmark</li>
            <li>4. Click "Submit Predictions" to get a social-ready image of your picks</li>
            <li>5. Download or share your image, then come back after the event to see how you did!</li>
          </ul>
        </div>

        {(currentUser || predictionHistory.length > 0) && (
          <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">📁 Saved Prediction History</h3>
                <p className="text-sm text-gray-600">
                  {currentUser
                    ? 'History is synced to your UFC Fan App account. Review previous prediction cards or clean them up.'
                    : 'Sign in to start saving prediction cards across sessions.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="self-start inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-400 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!currentUser || predictionHistory.length === 0}
              >
                Clear All History
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                Loading your saved predictions...
              </div>
            ) : predictionHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-sm text-gray-500">
                {currentUser
                  ? 'You have not saved any prediction cards yet. Submit your picks to start building a history.'
                  : 'Sign in to start saving prediction cards.'}
              </div>
            ) : (
              <div className="space-y-4">
                {predictionHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{entry.eventName}</h4>
                        <div className="text-xs uppercase tracking-widest text-gray-500">
                          {entry.eventDate ? formatEventDate(entry.eventDate) : 'Date TBA'}
                          {entry.location ? ` • ${entry.location}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden md:block text-xs uppercase tracking-widest text-gray-500">
                          Saved {formatGeneratedAt(entry.savedAt)}
                        </div>
                        <div className="rounded-full bg-gray-900 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                          {entry.picks.length} picks
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryEntry(entry.id)}
                          className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="md:hidden text-xs uppercase tracking-widest text-gray-500">
                      Saved {formatGeneratedAt(entry.savedAt)}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(expandedHistory[entry.id] ? entry.picks : entry.picks.slice(0, 6)).map((pick, idx) => (
                        <div
                          key={`${entry.id}-pick-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                        >
                          <span className="truncate">{pick.fightLabel}</span>
                          <span className="ml-2 font-semibold text-gray-900">{pick.prediction}</span>
                        </div>
                      ))}
                    </div>
                    {entry.picks.length > 6 && (
                      <button
                        type="button"
                        onClick={() => toggleHistoryEntry(entry.id)}
                        className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {expandedHistory[entry.id]
                          ? 'Show fewer picks'
                          : `Show all ${entry.picks.length} picks`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-600">
              <div className="text-sm text-gray-600">Total Events</div>
              <div className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
              <div className="text-sm text-gray-600">Total Fights</div>
              <div className="text-3xl font-bold text-gray-900">
                {upcomingEvents.reduce((sum, event) => sum + (event.fights?.length || 0), 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
              <div className="text-sm text-gray-600">Your Predictions</div>
              <div className="text-3xl font-bold text-gray-900">{Object.keys(predictions).length}</div>
            </div>
          </div>
        )}
      </div>

      {isShareModalOpen && sharePayload && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-2 sm:px-4 py-4 sm:py-8 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl my-auto">
            <button
              type="button"
              onClick={handleCloseShareModal}
              className="absolute right-2 top-2 sm:right-4 sm:top-4 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900 touch-manipulation z-50"
              aria-label="Close share preview"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="grid gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 py-6 sm:py-8 md:py-10 md:grid-cols-[1.2fr_1fr] md:px-10">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Share your predictions</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Download or share this image on Instagram, X, Facebook, TikTok, or anywhere you rep your picks.
                  </p>
                </div>

                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">Tips</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>Tap Download to save the image to your camera roll.</li>
                    <li>Use Share if your device supports direct sharing to social apps.</li>
                    <li>Add your own caption and tag us @UFC Fan App!</li>
                  </ul>
                </div>

                {shareError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{shareError}</div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadShareImage}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-red-900"
                  >
                    <Download className="h-4 w-4" />
                    Download Image
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 bg-gray-100 p-5">
                {isGeneratingShareImage && (
                  <div className="flex h-64 w-full items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                  </div>
                )}

                {!isGeneratingShareImage && shareImage && (
                  <>
                    <div className="w-full overflow-hidden rounded-3xl shadow-xl">
                      <img src={shareImage} alt="Predictions ready to share" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Optimized for 4:5 portrait (1080×1350px) feeds. Perfect for Instagram, X, Facebook, and TikTok.
                    </p>
                  </>
                )}

                {!isGeneratingShareImage && !shareImage && !shareError && (
                  <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
                    Preparing your preview...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
