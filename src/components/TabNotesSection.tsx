import React, { useState, useEffect, useRef } from 'react';
import { TabNoteData, TabVoiceNote, TabAttachment, TabLink } from '../types';
import { DrawingPad } from './DrawingPad';
import {
  Keyboard,
  Edit3,
  Mic,
  MicOff,
  Paperclip,
  Link2,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileAudio,
  FileImage,
  FileText,
  File,
  Sparkles,
  Check,
  UploadCloud,
  Download,
  Eye,
  Copy,
  Clock,
  X,
  ListPlus,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface TabNotesSectionProps {
  tabKey: string;
  tabTitle: string;
}

const DEFAULT_NOTE_DATA: TabNoteData = {
  tabKey: '',
  text: '',
  drawing: null,
  voiceNotes: [],
  attachments: [],
  links: [],
  updatedAt: new Date().toISOString(),
};

// Helper: Format file sizes
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper: Resize high-res images to keep under Firestore limit
const compressImage = async (file: File, maxDimension = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const TabNotesSection: React.FC<TabNotesSectionProps> = ({ tabKey, tabTitle }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeInputMode, setActiveInputMode] = useState<
    'text' | 'voice' | 'attachments' | 'pencil' | 'links'
  >('text');

  const [noteData, setNoteData] = useState<TabNoteData>({
    ...DEFAULT_NOTE_DATA,
    tabKey,
  });

  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isCopyingText, setIsCopyingText] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TabAttachment | null>(null);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  // Link dialog state
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Speech Recognition for live voice dictation (Audiodescription)
  const [isDictatingToText, setIsDictatingToText] = useState(false);
  const [transcriptLive, setTranscriptLive] = useState('');
  const dictationRecognitionRef = useRef<any>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load and listen to notes on tab change (Real-time Firestore Multi-Device Sync)
  useEffect(() => {
    let isMounted = true;
    const storageKey = `tab_note_${tabKey}`;

    // 1. Initial local fallback for fast loading
    try {
      const localStr = localStorage.getItem(storageKey);
      if (localStr && isMounted) {
        setNoteData({
          ...DEFAULT_NOTE_DATA,
          ...JSON.parse(localStr),
          tabKey,
        });
      }
    } catch {}

    // 2. Real-time Firestore sync across all user devices
    let unsubscribeFirestore: (() => void) | undefined;
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'tab_notes', tabKey);
        unsubscribeFirestore = onSnapshot(docRef, (snap) => {
          if (!isMounted) return;
          if (snap.exists()) {
            const remoteData = snap.data() as TabNoteData;
            setNoteData({
              ...DEFAULT_NOTE_DATA,
              ...remoteData,
              tabKey,
            });
            try {
              localStorage.setItem(storageKey, JSON.stringify(remoteData));
            } catch {}
          }
        });
      } catch (err) {
        console.warn('Could not listen to tab notes in Firestore:', err);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [tabKey, user]);

  // Save changes
  const saveNoteData = async (updated: TabNoteData) => {
    const dataWithTime = {
      ...updated,
      tabKey,
      updatedAt: new Date().toISOString(),
    };
    setNoteData(dataWithTime);

    // Save to localStorage
    try {
      localStorage.setItem(`tab_note_${tabKey}`, JSON.stringify(dataWithTime));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Save to Firestore if user logged in
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tab_notes', tabKey), dataWithTime);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tab_notes/${tabKey}`);
      }
    }

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  // Keyboard text change
  const handleTextChange = (newText: string) => {
    saveNoteData({
      ...noteData,
      text: newText,
    });
  };

  // Add Timestamp to written text
  const handleInsertTimestamp = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stamp = `\n📌 [${dateStr} ${timeStr}] `;
    const updated = (noteData.text ? noteData.text + stamp : stamp.trim());
    handleTextChange(updated);
  };

  // Add Bullet Point to written text
  const handleInsertBullet = () => {
    const updated = noteData.text ? `${noteData.text}\n• ` : '• ';
    handleTextChange(updated);
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    if (!noteData.text) return;
    navigator.clipboard.writeText(noteData.text).then(() => {
      setIsCopyingText(true);
      setTimeout(() => setIsCopyingText(false), 2000);
    });
  };

  // Pencil drawing change
  const handleDrawingChange = (drawingUrl: string | null) => {
    saveNoteData({
      ...noteData,
      drawing: drawingUrl,
    });
  };

  // --- Speech-to-Text: Dictate directly into Written Text ---
  const handleToggleDictationToText = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz continuo.');
      return;
    }

    if (isDictatingToText) {
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.stop();
        } catch {}
        dictationRecognitionRef.current = null;
      }
      setIsDictatingToText(false);
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
          setNoteData((prev) => {
            const separator = prev.text && !prev.text.endsWith(' ') ? ' ' : '';
            const updated = prev.text + separator + textResult.trim();
            saveNoteData({ ...prev, text: updated });
            return { ...prev, text: updated };
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Dictation error:', e);
        setIsDictatingToText(false);
      };

      recognition.onend = () => {
        setIsDictatingToText(false);
      };

      recognition.start();
      dictationRecognitionRef.current = recognition;
      setIsDictatingToText(true);
    } catch (err) {
      console.warn('Could not start dictation:', err);
      setIsDictatingToText(false);
    }
  };

  // --- Voice Recorder: Standalone Voice Notes with Live Audiodescription ---
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
          saveNoteData({
            ...noteData,
            voiceNotes: [newVoiceNote, ...noteData.voiceNotes],
          });
          setTranscriptLive('');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start audiodescription transcription
      startSpeechRecognition();
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('No se pudo acceder al micrófono. Por favor revisa los permisos de tu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
    stopSpeechRecognition();
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscriptLive(currentText);
      };

      recognition.onerror = () => {};
      recognition.onend = () => {};

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition not supported:', e);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const recognitionRef = useRef<any>(null);

  // Play audio note
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

  // Delete voice note
  const handleDeleteVoiceNote = (id: string) => {
    if (playingAudioId === id) {
      currentAudioRef.current?.pause();
      setPlayingAudioId(null);
    }
    saveNoteData({
      ...noteData,
      voiceNotes: noteData.voiceNotes.filter((v) => v.id !== id),
    });
  };

  // --- File Upload Processing (Images, Audio, PDF, Documents) ---
  const processFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const newAttachments: TabAttachment[] = [];

    for (const file of filesArray) {
      // 5MB limit check
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo "${file.name}" supera el límite de 5 MB.`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isDoc =
        file.type.includes('word') ||
        file.type.includes('document') ||
        file.type.includes('text') ||
        file.type.includes('sheet') ||
        file.type.includes('excel') ||
        file.name.match(/\.(docx?|xlsx?|txt|csv|rtf|json)$/i);

      let dataUrl: string;
      if (isImage) {
        try {
          dataUrl = await compressImage(file);
        } catch {
          dataUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
      } else {
        dataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

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
      saveNoteData({
        ...noteData,
        attachments: [...newAttachments, ...noteData.attachments],
      });
      setActiveInputMode('attachments');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteAttachment = (id: string) => {
    saveNoteData({
      ...noteData,
      attachments: noteData.attachments.filter((a) => a.id !== id),
    });
    if (previewAttachment?.id === id) {
      setPreviewAttachment(null);
    }
  };

  // --- Links Handling ---
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const newLink: TabLink = {
      id: String(Date.now()),
      title: linkTitle.trim() || finalUrl,
      url: finalUrl,
      createdAt: new Date().toISOString(),
    };

    saveNoteData({
      ...noteData,
      links: [newLink, ...noteData.links],
    });

    setLinkTitle('');
    setLinkUrl('');
    setShowAddLinkForm(false);
  };

  const handleDeleteLink = (id: string) => {
    saveNoteData({
      ...noteData,
      links: noteData.links.filter((l) => l.id !== id),
    });
  };

  const totalItemsCount =
    (noteData.text.trim() ? 1 : 0) +
    (noteData.drawing ? 1 : 0) +
    noteData.voiceNotes.length +
    noteData.attachments.length +
    noteData.links.length;

  return (
    <div
      id="tab-notes-section"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-3xl bg-white dark:bg-[#151722] border transition-all duration-200 overflow-hidden shadow-sm ${
        isDragging
          ? 'border-dashed border-2 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-4 ring-amber-500/20'
          : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      {/* Hidden file input supporting multiple files of all common formats */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="image/*,audio/*,application/pdf,text/*,.doc,.docx,.xls,.xlsx,.csv"
        className="hidden"
      />

      {/* Drag overlay notice */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-amber-500/10 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <UploadCloud className="w-12 h-12 text-amber-500 animate-bounce mb-2" />
          <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">
            Suelta los archivos aquí para subirlos a esta pestaña
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Fotos, notas de audio, PDFs y documentos
          </p>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-neutral-50 via-amber-50/20 to-neutral-50 dark:from-[#181a26] dark:via-[#1c1d2e] dark:to-[#181a26] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shadow-2xs border border-amber-500/20">
            📂
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                Notas y Archivos de la Pestaña
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/60">
                {tabTitle}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Subida de archivos, notas escritas con teclado y notas de voz con transcripción
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSavedRecently && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" /> Guardado
            </span>
          )}

          {totalItemsCount > 0 && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border border-neutral-200 dark:border-neutral-700">
              {totalItemsCount} {totalItemsCount === 1 ? 'elemento' : 'elementos'}
            </span>
          )}

          {/* Quick Upload Button directly in header */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 text-xs font-semibold transition-colors shadow-2xs"
            title="Subir archivo o foto a esta pestaña"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Subir Archivo</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={isOpen ? 'Plegar notas' : 'Desplegar notas'}
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Navigation Bar / Mode Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#faf8f5] dark:bg-[#11131c] rounded-2xl border border-neutral-200 dark:border-neutral-800">
              {/* Tab 1: Written Notes */}
              <button
                type="button"
                onClick={() => setActiveInputMode('text')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInputMode === 'text'
                    ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                <span>Notas Escritas</span>
                {noteData.text.trim() && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>

              {/* Tab 2: Voice Notes */}
              <button
                type="button"
                onClick={() => setActiveInputMode('voice')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInputMode === 'voice'
                    ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>Notas de Voz</span>
                {noteData.voiceNotes.length > 0 && (
                  <span className="text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.2 font-mono">
                    {noteData.voiceNotes.length}
                  </span>
                )}
              </button>

              {/* Tab 3: Uploaded Files & Attachments */}
              <button
                type="button"
                onClick={() => setActiveInputMode('attachments')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInputMode === 'attachments'
                    ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                <span>Archivos Subidos</span>
                {noteData.attachments.length > 0 && (
                  <span className="text-[10px] bg-emerald-500 text-white rounded-full px-1.5 py-0.2 font-mono">
                    {noteData.attachments.length}
                  </span>
                )}
              </button>

              {/* Tab 4: Pencil / Apple Pencil */}
              <button
                type="button"
                onClick={() => setActiveInputMode('pencil')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInputMode === 'pencil'
                    ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                <span>Apple Pencil</span>
                {noteData.drawing && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>

              {/* Tab 5: Links */}
              <button
                type="button"
                onClick={() => setActiveInputMode('links')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInputMode === 'links'
                    ? 'bg-white dark:bg-[#1a1c29] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Enlaces</span>
                {noteData.links.length > 0 && (
                  <span className="text-[10px] bg-indigo-500 text-white rounded-full px-1.5 py-0.2 font-mono">
                    {noteData.links.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Upload Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] hover:bg-neutral-100 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Subir Archivo / Foto</span>
            </button>
          </div>

          {/* ---------------- MODE 1: NOTAS ESCRITAS CON TECLADO O DICTADO ---------------- */}
          {activeInputMode === 'text' && (
            <div className="space-y-3">
              {/* Textarea Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-blue-500" />
                  <span>Editor de notas escritas para «{tabTitle}»</span>
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Dictate into Text Button (Speech-to-text) */}
                  <button
                    type="button"
                    onClick={handleToggleDictationToText}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isDictatingToText
                        ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
                    }`}
                    title="Habla por el micrófono y tus palabras se escribirán automáticamente en este texto"
                  >
                    {isDictatingToText ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isDictatingToText ? 'Escuchando… (Toca para parar)' : 'Dictar por voz'}</span>
                  </button>

                  {/* Add Timestamp */}
                  <button
                    type="button"
                    onClick={handleInsertTimestamp}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 text-xs font-medium transition-colors"
                    title="Insertar fecha y hora actual en la nota"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Fecha y hora</span>
                  </button>

                  {/* Bullet item */}
                  <button
                    type="button"
                    onClick={handleInsertBullet}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 text-xs font-medium transition-colors"
                    title="Insertar viñeta de lista"
                  >
                    <ListPlus className="w-3 h-3" />
                    <span>Viñeta</span>
                  </button>

                  {/* Copy note */}
                  {noteData.text.trim() && (
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 text-xs font-medium transition-colors"
                      title="Copiar texto de la nota al portapapeles"
                    >
                      {isCopyingText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopyingText ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dictation active banner */}
              {isDictatingToText && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" />
                    <span>Dictado de voz activo: habla con claridad en español y el texto se transcribirá aquí…</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleDictationToText}
                    className="underline font-bold text-rose-700 dark:text-rose-300 ml-2"
                  >
                    Finalizar
                  </button>
                </div>
              )}

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={noteData.text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={`Escribe aquí notas, apuntes, ideas o recordatorios para la pestaña "${tabTitle}" usando el teclado o el botón "Dictar por voz"…`}
                  rows={5}
                  className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/30 resize-y leading-relaxed font-sans placeholder:text-neutral-400 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
                <span>Guardado automático y sincronizado con tu cuenta.</span>
                <span className="font-mono">
                  {noteData.text.length} caracteres ·{' '}
                  {noteData.text.trim() ? noteData.text.trim().split(/\s+/).length : 0} palabras
                </span>
              </div>
            </div>
          )}

          {/* ---------------- MODE 2: NOTAS DE VOZ (GRABADORA & AUDIO) ---------------- */}
          {activeInputMode === 'voice' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 flex items-center justify-center sm:justify-start gap-1.5">
                    <Mic className="w-4 h-4 text-rose-500" />
                    <span>Grabadora de Notas de Voz para «{tabTitle}»</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Graba notas de voz con el micrófono. Incluye audiodescripción automática transcrita en español.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isRecording ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold animate-pulse border border-rose-200">
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

              {/* Live transcript banner if recording */}
              {isRecording && transcriptLive && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    Audiodescripción en directo:
                  </span>
                  <p className="italic">{transcriptLive}</p>
                </div>
              )}

              {/* List of saved voice notes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Notas de voz grabadas en esta pestaña ({noteData.voiceNotes.length})
                  </h5>
                </div>

                {noteData.voiceNotes.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-1 bg-[#faf8f5] dark:bg-[#12141f]">
                    <Mic className="w-8 h-8 text-neutral-400 mx-auto opacity-40 mb-1" />
                    <p className="text-xs text-neutral-500">
                      No hay notas de voz grabadas en esta pestaña todavía.
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Pulsa «Grabar Nota de Voz» para grabar tus ideas o recordatorios.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {noteData.voiceNotes.map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 shadow-2xs hover:border-neutral-300 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayAudio(v)}
                            className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-90"
                            title={playingAudioId === v.id ? 'Pausar audio' : 'Reproducir audio'}
                          >
                            {playingAudioId === v.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <span>Audio {v.duration ? `${v.duration}s` : ''}</span>
                              {playingAudioId === v.id && (
                                <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                                  Reproduciendo…
                                </span>
                              )}
                            </p>
                            {v.transcript && (
                              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate italic">
                                "{v.transcript}"
                              </p>
                            )}
                            <p className="text-[10px] text-neutral-400">
                              {new Date(v.createdAt).toLocaleDateString([], {
                                day: '2-digit',
                                month: '2-digit',
                              })}{' '}
                              ·{' '}
                              {new Date(v.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Download audio */}
                          {v.audioUrl && (
                            <a
                              href={v.audioUrl}
                              download={`nota_voz_${v.id}.webm`}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                              title="Descargar audio"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteVoiceNote(v.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 transition-colors"
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

          {/* ---------------- MODE 3: SUBIDA DE ARCHIVOS (FOTOS, AUDIOS, PDFS, DOCUMENTOS) ---------------- */}
          {activeInputMode === 'attachments' && (
            <div className="space-y-4">
              {/* Dropzone & Browse Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 bg-[#faf8f5] dark:bg-[#12141f] text-center cursor-pointer transition-all group"
              >
                <UploadCloud className="w-10 h-10 text-neutral-400 group-hover:text-amber-500 mx-auto mb-2 transition-colors" />
                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-0.5">
                  Haz clic aquí para seleccionar o arrastra tus archivos
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                  Permite subir fotos (PNG, JPG, WebP), clips de audio (MP3, WAV), PDFs y documentos de texto
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-xs group-hover:bg-amber-600 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" /> Examinar Archivos
                </span>
              </div>

              {/* Attachments List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Archivos en esta pestaña ({noteData.attachments.length})
                  </h5>
                </div>

                {noteData.attachments.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">
                    No has subido ningún archivo a esta pestaña todavía.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {noteData.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[#faf8f5] dark:bg-[#12141f] p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
                      >
                        {/* File Preview Thumbnail */}
                        {att.type === 'image' ? (
                          <div
                            onClick={() => setPreviewAttachment(att)}
                            className="w-full h-28 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-2 cursor-pointer relative"
                          >
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-semibold">
                              <Eye className="w-4 h-4" />
                              <span>Ver</span>
                            </div>
                          </div>
                        ) : att.type === 'audio' ? (
                          <div className="w-full h-28 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 flex flex-col items-center justify-center p-2 text-rose-600 mb-2">
                            <FileAudio className="w-8 h-8 mb-1" />
                            <audio src={att.dataUrl} controls className="w-full h-7 mt-1" />
                          </div>
                        ) : att.type === 'pdf' ? (
                          <div
                            onClick={() => {
                              const w = window.open();
                              w?.document.write(
                                `<iframe src="${att.dataUrl}" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                              );
                            }}
                            className="w-full h-28 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 flex flex-col items-center justify-center p-2 text-red-600 mb-2 cursor-pointer hover:bg-red-100/50 transition-colors"
                          >
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">PDF</span>
                            <span className="text-[9px] text-neutral-500">Toca para abrir</span>
                          </div>
                        ) : (
                          <div className="w-full h-28 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 flex flex-col items-center justify-center p-2 text-blue-600 mb-2">
                            <File className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-semibold text-center line-clamp-2 px-1">
                              {att.name}
                            </span>
                          </div>
                        )}

                        {/* File Details & Actions */}
                        <div className="space-y-1">
                          <p
                            className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate"
                            title={att.name}
                          >
                            {att.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400">
                            <span>{formatFileSize(att.size)}</span>
                            <div className="flex items-center gap-1">
                              {/* Download link */}
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                                title="Descargar archivo"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="p-1 rounded text-neutral-400 hover:text-rose-600"
                                title="Eliminar archivo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- MODE 4: APPLE PENCIL / TRAZO ---------------- */}
          {activeInputMode === 'pencil' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lienzo de dibujo y escritura a mano con Apple Pencil o táctil</span>
                </span>
                <span>Se guarda automáticamente</span>
              </div>
              <DrawingPad initialDataUrl={noteData.drawing} onChange={handleDrawingChange} />
            </div>
          )}

          {/* ---------------- MODE 5: ENLACES WEB ---------------- */}
          {activeInputMode === 'links' && (
            <div className="space-y-4">
              {showAddLinkForm ? (
                <form
                  onSubmit={handleAddLink}
                  className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Añadir Enlace a «{tabTitle}»</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAddLinkForm(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Título descriptivo (ej. Receta, Folleto médico, Factura)"
                      className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://ejemplo.com"
                      className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#151722] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                    >
                      ＋ Guardar Enlace
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddLinkForm(true)}
                  className="px-4 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 transition-colors"
                >
                  <Link2 className="w-4 h-4 text-indigo-500" />
                  <span>Añadir Nuevo Enlace Web</span>
                </button>
              )}

              {/* Links List */}
              <div className="space-y-2">
                {noteData.links.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2">
                    No hay enlaces guardados en esta pestaña todavía.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {noteData.links.map((link) => (
                      <div
                        key={link.id}
                        className="p-3 rounded-xl bg-[#faf8f5] dark:bg-[#12141f] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{link.title}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-1 rounded text-neutral-400 hover:text-rose-600 transition-colors shrink-0"
                          title="Eliminar enlace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image / Document Lightbox Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
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
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.dataUrl}
                  download={previewAttachment.name}
                  className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              {previewAttachment.type === 'image' && (
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
