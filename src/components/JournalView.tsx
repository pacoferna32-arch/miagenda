import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, JournalMood, TabVoiceNote, TabAttachment } from '../types';
import { JOURNAL_MOODS, JOURNAL_PROMPTS, toIsoDate, MESES, DIAS_COMPLETOS } from '../utils/constants';
import { DrawingPad } from './DrawingPad';
import {
  Keyboard,
  Edit3,
  Mic,
  MicOff,
  Paperclip,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Trash2,
  Play,
  Pause,
  Download,
  Eye,
  FileAudio,
  FileText,
  File,
  UploadCloud,
  Sparkles,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  Search,
  Check,
  Plus,
  X,
  Copy,
  PenLine,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface JournalViewProps {
  entries: JournalEntry[];
  onSaveEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onRequireAuth: () => void;
  isUnlocked: boolean;
  onLock: () => void;
  onRequestUnlock: () => void;
  onRequestChangePin: () => void;
  savedPin?: string;
  initialDate?: string;
  onReturnToCalendar?: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  onSaveEntry,
  onDeleteEntry,
  onRequireAuth,
  isUnlocked,
  onLock,
  onRequestUnlock,
  onRequestChangePin,
  savedPin,
  initialDate,
  onReturnToCalendar,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => initialDate || toIsoDate(new Date()));

  // Synchronize when an external date is selected (e.g. from Month Calendar)
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const [inputMode, setInputMode] = useState<'text' | 'pencil' | 'voice' | 'attachments' | 'timeline'>('text');

  // Entry fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalMood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [drawing, setDrawing] = useState<string | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<TabVoiceNote[]>([]);
  const [attachments, setAttachments] = useState<TabAttachment[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const [transcriptLive, setTranscriptLive] = useState('');
  const speechRecognitionRef = useRef<any>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Speech to text for text editor dictation
  const [isDictatingText, setIsDictatingText] = useState(false);
  const dictationRef = useRef<any>(null);

  // File upload input ref & preview modal
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<TabAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Search & Filter in timeline
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<JournalMood | 'all'>('all');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);

  // Load entry for selectedDate
  useEffect(() => {
    const existing = entries.find((e) => e.date === selectedDate);
    if (existing) {
      setTitle(existing.title || '');
      setContent(existing.content || '');
      setMood(existing.mood);
      setTags(existing.tags || []);
      setDrawing(existing.drawing || null);
      setVoiceNotes(existing.voiceNotes || []);
      setAttachments(existing.attachments || []);
      setIsFavorite(existing.favorite || false);
    } else {
      setTitle('');
      setContent('');
      setMood(undefined);
      setTags([]);
      setDrawing(null);
      setVoiceNotes([]);
      setAttachments([]);
      setIsFavorite(false);
    }
  }, [selectedDate, entries]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Day navigation
  const handlePrevDay = () => {
    const safeDate = typeof selectedDate === 'string' && selectedDate.includes('-') ? selectedDate : toIsoDate(new Date());
    const [y, m, d] = safeDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    setSelectedDate(toIsoDate(dateObj));
  };

  const handleNextDay = () => {
    const safeDate = typeof selectedDate === 'string' && selectedDate.includes('-') ? selectedDate : toIsoDate(new Date());
    const [y, m, d] = safeDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    setSelectedDate(toIsoDate(dateObj));
  };

  const handleGoToday = () => {
    setSelectedDate(toIsoDate(new Date()));
  };

  const getFormattedDateLong = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr || '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    return `${DIAS_COMPLETOS[dayOfWeek] || ''}, ${d} de ${MESES[m - 1] || MESES[0]} de ${y}`;
  };

  // Save current entry
  const handleSave = () => {
    const hasData =
      content.trim() ||
      title.trim() ||
      drawing ||
      voiceNotes.length > 0 ||
      attachments.length > 0;

    if (!hasData) {
      return;
    }

    const nowIso = new Date().toISOString();
    const existing = entries.find((e) => e.date === selectedDate);

    const updatedEntry: JournalEntry = {
      id: selectedDate,
      date: selectedDate,
      title: title.trim() || `Diario del ${selectedDate}`,
      content: content.trim(),
      mood,
      tags: tags.length > 0 ? tags : undefined,
      drawing: drawing || undefined,
      voiceNotes: voiceNotes.length > 0 ? voiceNotes : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      favorite: isFavorite,
      createdAt: existing ? existing.createdAt : nowIso,
      updatedAt: nowIso,
    };

    onSaveEntry(updatedEntry);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#8b5cf6', '#e8533a', '#10b981', '#f59e0b'],
    });
  };

  // Delete current entry
  const handleDeleteCurrent = () => {
    onDeleteEntry(selectedDate);
    setTitle('');
    setContent('');
    setMood(undefined);
    setTags([]);
    setDrawing(null);
    setVoiceNotes([]);
    setAttachments([]);
    setIsFavorite(false);
  };

  // Tags
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Prompts & Timestamps
  const handleInsertPrompt = (prompt: string) => {
    const formatted = `\n\n💭 ${prompt}\n`;
    setContent((prev) => (prev ? prev + formatted : formatted.trim()));
  };

  const handleInsertTimestamp = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stamp = `\n📌 [${timeStr}] `;
    setContent((prev) => (prev ? prev + stamp : stamp.trim()));
  };

  // Speech to text dictation into written notes
  const handleToggleDictationText = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    if (isDictatingText) {
      if (dictationRef.current) {
        try {
          dictationRef.current.stop();
        } catch {}
        dictationRef.current = null;
      }
      setIsDictatingText(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let textResult = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            textResult += event.results[i][0].transcript + ' ';
          }
        }
        if (textResult.trim()) {
          setContent((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + textResult.trim();
          });
        }
      };

      recognition.onerror = () => setIsDictatingText(false);
      recognition.onend = () => setIsDictatingText(false);

      recognition.start();
      dictationRef.current = recognition;
      setIsDictatingText(true);
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
      setIsDictatingText(false);
    }
  };

  // --- Voice Recorder for Standalone Voice Notes ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const newVoiceNote: TabVoiceNote = {
            id: String(Date.now()),
            audioUrl: base64Audio,
            duration: recordingSeconds,
            transcript: transcriptLive.trim() || undefined,
            createdAt: new Date().toISOString(),
          };
          setVoiceNotes((prev) => [newVoiceNote, ...prev]);
          setTranscriptLive('');
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start live transcription
      startLiveSpeech();
    } catch (err) {
      console.warn('No se pudo acceder al micrófono:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
    stopLiveSpeech();
  };

  const startLiveSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'es-ES';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscriptLive(currentText);
      };

      rec.start();
      speechRecognitionRef.current = rec;
    } catch {}
  };

  const stopLiveSpeech = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
  };

  const handleTogglePlayAudio = (note: TabVoiceNote) => {
    if (!note.audioUrl) return;

    if (playingAudioId === note.id) {
      currentAudioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    const audio = new Audio(note.audioUrl);
    currentAudioRef.current = audio;
    audio.onended = () => setPlayingAudioId(null);
    audio.play().catch(() => setPlayingAudioId(null));
    setPlayingAudioId(note.id);
  };

  const handleDeleteVoiceNote = (id: string) => {
    if (playingAudioId === id) {
      currentAudioRef.current?.pause();
      setPlayingAudioId(null);
    }
    setVoiceNotes((prev) => prev.filter((v) => v.id !== id));
  };

  // --- File Upload Processing ---
  const processFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const newAttachments: TabAttachment[] = [];

    for (const file of filesArray) {
      if (file.size > 5 * 1024 * 1024) {
        continue;
      }

      const fileType = file.type || '';
      const fileName = file.name || '';
      const isImage = fileType.startsWith('image/');
      const isAudio = fileType.startsWith('audio/');
      const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      const isDoc =
        fileType.includes('word') ||
        fileType.includes('document') ||
        fileType.includes('text') ||
        Boolean(fileName.match(/\.(docx?|xlsx?|txt|csv|json)$/i));

      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: String(Date.now() + Math.random()),
        name: file.name,
        type: isImage ? 'image' : isAudio ? 'audio' : isPdf ? 'pdf' : isDoc ? 'document' : 'file',
        mimeType: file.type,
        dataUrl,
        size: file.size,
        createdAt: new Date().toISOString(),
      });
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...newAttachments, ...prev]);
      setInputMode('attachments');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (previewAttachment?.id === id) setPreviewAttachment(null);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${title ? `${title}\n\n` : ''}${content}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Filtered timeline
  const filteredTimeline = entries
    .filter((entry) => {
      if (!entry || typeof entry.date !== 'string') return false;
      if (filterFavoritesOnly && !entry.favorite) return false;
      if (filterMood !== 'all' && entry.mood !== filterMood) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (entry.title || '').toLowerCase().includes(q);
        const matchesContent = (entry.content || '').toLowerCase().includes(q);
        const matchesTags = entry.tags?.some((t) => (t || '').toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }
      return true;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // ---------------- LOCKED SCREEN: REQUIRES 4-DIGIT PIN ----------------
  if (!isUnlocked) {
    return (
      <div className="py-12 sm:py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center text-3xl shadow-lg mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
              Diario Personal Protegido
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Esta categoría contiene tus pensamientos, notas íntimas, trazos de Apple Pencil, audios y archivos confidenciales.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/60 flex items-center gap-3 text-left">
            <ShieldCheck className="w-6 h-6 text-violet-600 shrink-0" />
            <p className="text-[11px] text-violet-900 dark:text-violet-200 leading-tight">
              {savedPin
                ? 'Protegido con clave de 4 dígitos. Pulsa el botón para desbloquear y acceder.'
                : 'Aún no has configurado una clave de 4 dígitos. Pulsa el botón para crear tu clave secreta.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestUnlock}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{savedPin ? 'Desbloquear con clave de 4 dígitos' : 'Configurar mi clave de 4 dígitos'}</span>
          </button>

          {onReturnToCalendar && (
            <button
              type="button"
              onClick={onReturnToCalendar}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Volver al calendario mes</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------- UNLOCKED: FULL PAGE PERSONAL DIARY ----------------
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="image/*,audio/*,application/pdf,text/*,.doc,.docx,.xls,.xlsx,.csv"
        className="hidden"
      />

      {/* Top Banner with Security Status & Lock Action */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-indigo-600/15 border border-violet-200/80 dark:border-violet-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
            📔
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                Diario Personal y Pensamientos
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-violet-600/20 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-violet-600" />
                Desbloqueado
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Página completa: teclado, trazo Pencil, notas de voz con transcripción y archivos adjuntos
            </p>
          </div>
        </div>

        {/* Security Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onReturnToCalendar && (
            <button
              type="button"
              onClick={onReturnToCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 text-xs font-semibold transition-colors shadow-2xs"
              title="Volver a la vista del calendario mensual"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>Volver al calendario</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRequestChangePin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-white/80 dark:bg-neutral-800/80 text-violet-700 dark:text-violet-300 hover:bg-violet-50 text-xs font-semibold transition-colors shadow-2xs"
            title="Cambiar tu clave de cuatro dígitos"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cambiar PIN</span>
          </button>

          <button
            type="button"
            onClick={onLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
            title="Bloquear de inmediato para proteger tu intimidad"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear ahora</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Actions Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleGoToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              selectedDate === toIsoDate(new Date())
                ? 'bg-violet-600/15 border-violet-400 text-violet-900 dark:text-violet-200'
                : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Display and Picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-serif font-bold text-neutral-900 dark:text-neutral-100">
            {getFormattedDateLong(selectedDate)}
          </span>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="opacity-0 absolute inset-0 cursor-pointer w-full"
              title="Cambiar fecha del diario"
            />
            <button
              type="button"
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 pointer-events-none"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Favorite & Delete */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-xl border transition-colors ${
              isFavorite
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-amber-500'
            }`}
            title={isFavorite ? 'Marcado como favorito' : 'Marcar como favorito'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleDeleteCurrent}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
            title="Eliminar entrada de este día"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Full Page Diary Workspace */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Estado de ánimo del día</span>
            {mood && (
              <button
                type="button"
                onClick={() => setMood(undefined)}
                className="text-[11px] text-neutral-400 hover:underline"
              >
                Borrar selección
              </button>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {(Object.entries(JOURNAL_MOODS) as [JournalMood, typeof JOURNAL_MOODS[JournalMood]][]).map(
              ([key, info]) => {
                const isSelected = mood === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-violet-500 shadow-xs'
                        : 'opacity-80 hover:opacity-100 hover:scale-102'
                    }`}
                    style={{
                      backgroundColor: info.bg,
                      color: info.color,
                    }}
                  >
                    <span className="text-base">{info.emoji}</span>
                    <span>{info.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del día (ej. Nuevos comienzos, Paseo reflexivo, Notas íntimas…)"
            className="w-full text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-2 focus:outline-none focus:border-violet-600"
          />
        </div>

        {/* Input Mode Switcher (Teclado, Pencil, Notas de Voz, Archivos, Historial) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#faf8f5] dark:bg-[#11131c] rounded-2xl border border-neutral-200 dark:border-neutral-800">
            {/* Mode 1: Teclado */}
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-blue-500" />
              <span>Teclado</span>
              {content.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            </button>

            {/* Mode 2: Apple Pencil */}
            <button
              type="button"
              onClick={() => setInputMode('pencil')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'pencil'
                  ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              <span>Apple Pencil / Trazo</span>
              {drawing && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>

            {/* Mode 3: Notas de voz */}
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'voice'
                  ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span>Notas de Voz</span>
              {voiceNotes.length > 0 && (
                <span className="text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.2 font-mono">
                  {voiceNotes.length}
                </span>
              )}
            </button>

            {/* Mode 4: Archivos adjuntos */}
            <button
              type="button"
              onClick={() => setInputMode('attachments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'attachments'
                  ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
              <span>Archivos Adjuntos</span>
              {attachments.length > 0 && (
                <span className="text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.2 font-mono">
                  {attachments.length}
                </span>
              )}
            </button>

            {/* Mode 5: Historial */}
            <button
              type="button"
              onClick={() => setInputMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                inputMode === 'timeline'
                  ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-violet-500" />
              <span>Recuerdos</span>
            </button>
          </div>

          {/* Quick upload trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] hover:bg-neutral-100 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Subir Archivo</span>
          </button>
        </div>

        {/* ---------------- MODE 1: TECLADO Y DICTADO DE VOZ ---------------- */}
        {inputMode === 'text' && (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleDictationText}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isDictatingText
                      ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200'
                  }`}
                  title="Dictar reflexiones con el micrófono"
                >
                  {isDictatingText ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{isDictatingText ? 'Escuchando…' : 'Dictar por voz'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertTimestamp}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-200"
                >
                  <Clock className="w-3 h-3" />
                  <span>Hora</span>
                </button>

                {content.trim() && (
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-200"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-neutral-400">
                {content.trim() ? content.trim().split(/\s+/).length : 0} palabras
              </div>
            </div>

            {/* Dictating alert */}
            {isDictatingText && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between animate-pulse">
                <span>🎙️ Dictado activo: habla con tranquilidad y tus pensamientos se escribirán en tu diario…</span>
                <button
                  type="button"
                  onClick={handleToggleDictationText}
                  className="underline font-bold text-rose-700 ml-2"
                >
                  Detener
                </button>
              </div>
            )}

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe aquí tus anotaciones íntimas, vivencias del día, lo que sientes o planes para mañana…"
                rows={9}
                className="w-full p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-y font-sans placeholder:text-neutral-400 shadow-inner"
              />
            </div>

            {/* Inspiration questions */}
            <div className="p-3.5 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/40 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>Inspiración para reflexionar hoy:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {JOURNAL_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertPrompt(prompt)}
                    className="text-left text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-violet-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-violet-900 transition-colors"
                  >
                    ＋ {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- MODE 2: APPLE PENCIL / TRAZO TÁCTIL ---------------- */}
        {inputMode === 'pencil' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                <span>Lienzo manuscrito con Apple Pencil o dedo táctil</span>
              </span>
              <span>Guardado con tu entrada</span>
            </div>
            <DrawingPad initialDataUrl={drawing} onChange={(dataUrl) => setDrawing(dataUrl)} />
          </div>
        )}

        {/* ---------------- MODE 3: NOTAS DE VOZ ---------------- */}
        {inputMode === 'voice' && (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mic className="w-4 h-4 text-rose-500" />
                  <span>Grabadora de Notas de Voz para el Diario</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Graba tus pensamientos en voz alta. Incluye audiodescripción automática en español.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isRecording ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
                      {Math.floor(recordingSeconds / 60)}:
                      {String(recordingSeconds % 60).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <MicOff className="w-4 h-4" /> Detener y Guardar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <Mic className="w-4 h-4 text-rose-500" />
                    <span>Grabar Nota de Voz</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live transcript */}
            {isRecording && transcriptLive && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  Transcripción en directo:
                </span>
                <p className="italic">{transcriptLive}</p>
              </div>
            )}

            {/* Saved voice notes list */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Notas de voz de esta jornada ({voiceNotes.length})
              </h5>

              {voiceNotes.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-400 bg-[#faf8f5] dark:bg-[#12141f]">
                  No has grabado notas de voz hoy. Pulsa «Grabar Nota de Voz».
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {voiceNotes.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePlayAudio(v)}
                          className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs"
                        >
                          {playingAudioId === v.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                            <span>Audio {v.duration ? `${v.duration}s` : ''}</span>
                            {playingAudioId === v.id && (
                              <span className="text-[10px] text-rose-500 font-bold animate-pulse">Reproduciendo…</span>
                            )}
                          </p>
                          {v.transcript && (
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate italic">"{v.transcript}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {v.audioUrl && (
                          <a
                            href={v.audioUrl}
                            download={`diario_audio_${v.id}.webm`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700"
                            title="Descargar audio"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteVoiceNote(v.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600"
                          title="Eliminar audio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- MODE 4: ARCHIVOS ADJUNTOS ---------------- */}
        {inputMode === 'attachments' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-violet-500 bg-[#faf8f5] dark:bg-[#12141f] text-center cursor-pointer transition-all group"
            >
              <UploadCloud className="w-10 h-10 text-neutral-400 group-hover:text-violet-500 mx-auto mb-2 transition-colors" />
              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-0.5">
                Haz clic aquí para seleccionar o arrastra archivos
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                Fotos, documentos, audios o PDFs para adjuntar a este día de tu diario
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white font-semibold text-xs shadow-xs group-hover:bg-violet-700 transition-colors">
                <UploadCloud className="w-3.5 h-3.5" /> Examinar Archivos
              </span>
            </div>

            {/* Attachments List */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Archivos adjuntados hoy ({attachments.length})
              </h5>

              {attachments.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  No hay archivos adjuntos en la entrada de este día.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] p-2.5 flex flex-col justify-between shadow-2xs"
                    >
                      {att.type === 'image' ? (
                        <div
                          onClick={() => setPreviewAttachment(att)}
                          className="w-full h-28 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-2 cursor-pointer relative"
                        >
                          <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 font-semibold">
                            <Eye className="w-4 h-4" />
                            <span>Ver</span>
                          </div>
                        </div>
                      ) : att.type === 'audio' ? (
                        <div className="w-full h-28 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex flex-col items-center justify-center p-2 text-rose-600 mb-2">
                          <FileAudio className="w-8 h-8 mb-1" />
                          <audio src={att.dataUrl} controls className="w-full h-7 mt-1" />
                        </div>
                      ) : att.type === 'pdf' ? (
                        <div
                          onClick={() => setPreviewAttachment(att)}
                          className="w-full h-28 rounded-xl bg-red-50 dark:bg-red-950/40 flex flex-col items-center justify-center p-2 text-red-600 mb-2 cursor-pointer"
                        >
                          <FileText className="w-8 h-8 mb-1" />
                          <span className="text-[11px] font-bold">PDF</span>
                        </div>
                      ) : (
                        <div className="w-full h-28 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex flex-col items-center justify-center p-2 text-blue-600 mb-2">
                          <File className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-semibold text-center line-clamp-2">{att.name}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400">
                          <a href={att.dataUrl} download={att.name} className="text-neutral-500 hover:text-neutral-900" title="Descargar">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="text-neutral-400 hover:text-rose-600"
                            title="Eliminar archivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- MODE 5: HISTORIAL / LÍNEA DE TIEMPO ---------------- */}
        {inputMode === 'timeline' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en tus recuerdos..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <select
                  value={filterMood}
                  onChange={(e) => setFilterMood(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] text-xs"
                >
                  <option value="all">Todos los estados de ánimo</option>
                  {Object.entries(JOURNAL_MOODS).map(([k, info]) => (
                    <option key={k} value={k}>
                      {info.emoji} {info.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    filterFavoritesOnly
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>Favoritos</span>
                </button>
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-6">
                No se encontraron entradas en el diario que coincidan con la búsqueda.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredTimeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200 dark:border-neutral-800 space-y-2 hover:border-neutral-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-500">
                          {getFormattedDateLong(entry.date)}
                        </span>
                        {entry.mood && (
                          <span className="text-xs">
                            {JOURNAL_MOODS[entry.mood]?.emoji} {JOURNAL_MOODS[entry.mood]?.label}
                          </span>
                        )}
                        {entry.favorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(entry.date);
                          setInputMode('text');
                        }}
                        className="px-3 py-1 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 flex items-center gap-1"
                      >
                        <PenLine className="w-3 h-3" />
                        <span>Abrir</span>
                      </button>
                    </div>

                    {entry.title && (
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-serif">
                        {entry.title}
                      </h4>
                    )}

                    {entry.content && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                        {entry.content}
                      </p>
                    )}

                    {/* Media indicator tags */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 pt-1">
                      {entry.drawing && <span>✏️ Trazo incluido</span>}
                      {entry.voiceNotes && entry.voiceNotes.length > 0 && (
                        <span>🎙️ {entry.voiceNotes.length} notas de voz</span>
                      )}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <span>📎 {entry.attachments.length} archivos</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <span>Etiquetas personales (#pensamientos, #gratitud, #ideas, #trabajo…)</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 text-xs font-medium border border-violet-200"
              >
                <span>#{tag}</span>
                <button type="button" onClick={() => handleRemoveTag(tag)} className="text-neutral-400 hover:text-rose-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nueva etiqueta..."
                className="px-3 py-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#12141f] text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-semibold hover:bg-neutral-300"
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {isSavedRecently && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check className="w-4 h-4" /> Guardado y protegido en tu diario
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onReturnToCalendar && (
              <button
                type="button"
                onClick={onReturnToCalendar}
                className="px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
                <span>Volver al calendario</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Guardar entrada en el diario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for previewing attachments */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white dark:bg-[#161824] border border-neutral-800 rounded-3xl max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[80%]">
                {previewAttachment.name}
              </span>
              <button type="button" onClick={() => setPreviewAttachment(null)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              {previewAttachment.type === 'image' ? (
                <img src={previewAttachment.dataUrl} alt={previewAttachment.name} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
              ) : previewAttachment.type === 'pdf' ? (
                <iframe src={previewAttachment.dataUrl} title={previewAttachment.name} className="w-[80vw] max-w-2xl h-[70vh] rounded-xl border-0" />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
