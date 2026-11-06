import React, { useState, useRef } from 'react';
import { Medication } from '../types';
import { toIsoDate } from '../utils/constants';
import { sounds } from '../utils/audio';
import {
  Pill,
  Check,
  Plus,
  Bell,
  Volume2,
  Trash2,
  Clock,
  Edit3,
  FileText,
  X,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MedicationViewProps {
  medications: Medication[];
  onToggleMedication: (id: number) => void;
  onAddMedication: (med: Omit<Medication, 'id' | 'taken' | 'alerted'>) => void;
  onUpdateMedication: (med: Medication) => void;
  onDeleteMedication: (id: number) => void;
}

export const MedicationView: React.FC<MedicationViewProps> = ({
  medications,
  onToggleMedication,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
}) => {
  const todayStr = toIsoDate(new Date());

  // Add Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('09:00');
  const [lead, setLead] = useState<number>(0);
  const [isAlertOn, setIsAlertOn] = useState(true);
  const [notes, setNotes] = useState('');

  // Editing state for an entire medication or just its annotation
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [editName, setEditName] = useState('');
  const [editDose, setEditDose] = useState('');
  const [editTime, setEditTime] = useState('09:00');
  const [editLead, setEditLead] = useState<number>(0);
  const [editIsAlertOn, setEditIsAlertOn] = useState(true);
  const [editNotes, setEditNotes] = useState('');

  // Inline Note Editor state (quick edit just the note of a specific med)
  const [inlineNoteMedId, setInlineNoteMedId] = useState<number | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState('');

  // Voice dictation state
  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'add' | 'edit' | 'inline' | null>(null);
  const recognitionRef = useRef<any>(null);

  const totalToday = medications.length;
  const takenTodayCount = medications.filter((m) => Boolean(m?.taken?.[todayStr])).length;
  const adherencePercent = totalToday > 0 ? Math.round((takenTodayCount / totalToday) * 100) : 0;

  const handleToggle = (id: number) => {
    onToggleMedication(id);
    const m = medications.find((x) => x.id === id);
    if (m && !m.taken?.[todayStr]) {
      sounds.playMedicationChime();
      if (takenTodayCount + 1 === totalToday) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    }
  };

  // Add Medication Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMedication({
      n: name.trim(),
      dose: dose.trim() || '1 toma diaria',
      h: time,
      on: isAlertOn,
      lead: lead,
      notes: notes.trim() || undefined,
    });

    setName('');
    setDose('');
    setTime('09:00');
    setNotes('');
    setLead(0);
    setIsAlertOn(true);
    setShowAddForm(false);
  };

  // Open Edit Modal for a Medication
  const handleOpenEdit = (med: Medication) => {
    setEditingMed(med);
    setEditName(med.n);
    setEditDose(med.dose);
    setEditTime(med.h);
    setEditLead(med.lead || 0);
    setEditIsAlertOn(med.on);
    setEditNotes(med.notes || '');
  };

  // Save Edit Medication Submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !editName.trim()) return;

    const updated: Medication = {
      ...editingMed,
      n: editName.trim(),
      dose: editDose.trim() || '1 toma diaria',
      h: editTime,
      on: editIsAlertOn,
      lead: editLead,
      notes: editNotes.trim() || undefined,
    };

    onUpdateMedication(updated);
    setEditingMed(null);
  };

  // Quick Inline Note Edit
  const handleStartInlineNote = (med: Medication) => {
    setInlineNoteMedId(med.id);
    setInlineNoteText(med.notes || '');
  };

  const handleSaveInlineNote = (med: Medication) => {
    const updated: Medication = {
      ...med,
      notes: inlineNoteText.trim() || undefined,
    };
    onUpdateMedication(updated);
    setInlineNoteMedId(null);
    setInlineNoteText('');
  };

  // Delete ONLY the annotation of a medication
  const handleDeleteAnnotation = (med: Medication) => {
    const updated: Medication = {
      ...med,
      notes: '',
    };
    onUpdateMedication(updated);
  };

  // Voice Dictation
  const handleToggleDictation = (target: 'add' | 'edit' | 'inline') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    if (isDictating && dictationTarget === target) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setIsDictating(false);
      setDictationTarget(null);
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
          if (target === 'add') {
            setNotes((prev) => (prev ? prev + ' ' + textResult.trim() : textResult.trim()));
          } else if (target === 'edit') {
            setEditNotes((prev) => (prev ? prev + ' ' + textResult.trim() : textResult.trim()));
          } else if (target === 'inline') {
            setInlineNoteText((prev) => (prev ? prev + ' ' + textResult.trim() : textResult.trim()));
          }
        }
      };

      recognition.onerror = () => {
        setIsDictating(false);
        setDictationTarget(null);
      };

      recognition.onend = () => {
        setIsDictating(false);
        setDictationTarget(null);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsDictating(true);
      setDictationTarget(target);
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsDictating(false);
      setDictationTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Adherence Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-pink-200/50 dark:border-pink-900/50">
            💊
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
              Control de Medicación y Suplementos
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Seguimiento diario recurrente, anotaciones médicas e instrucciones de toma
            </p>
          </div>
        </div>

        {/* Adherence progress */}
        <div className="flex items-center gap-4 w-full sm:w-auto bg-[#faf8f5] dark:bg-[#12141f] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Tomas de hoy
            </span>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {takenTodayCount} de {totalToday} ({adherencePercent}%)
            </p>
          </div>
          <div className="w-11 h-11 rounded-full border-4 border-pink-200 dark:border-pink-950 relative flex items-center justify-center">
            <span className="text-xs font-bold text-pink-600 dark:text-pink-400 tabular-nums">
              {adherencePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Action and Test Audio */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cerrar formulario' : 'Añadir medicamento'}</span>
        </button>

        <button
          type="button"
          onClick={() => sounds.playAlarmChime()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151722] text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-50 transition-colors"
          title="Probar sonido de alarma"
        >
          <Volume2 className="w-3.5 h-3.5 text-pink-600" />
          <span>Probar alarma</span>
        </button>
      </div>

      {/* Add Medication Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="p-5 rounded-2xl bg-white dark:bg-[#151722] border border-pink-200 dark:border-pink-900 shadow-sm space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              <span>Nuevo Medicamento o Tratamiento</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-neutral-600 text-xs"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                Nombre del fármaco / suplemento
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Omeprazol, Ibuprofeno, Magnesio"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                Dosis y frecuencia
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="ej. 1 comprimido, 500 mg con el desayuno"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                Hora de la toma
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-mono text-neutral-900 dark:text-neutral-100"
                required
              />
            </div>
          </div>

          {/* Anotaciones e instrucciones médicas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-pink-600" />
                <span>Anotaciones e Instrucciones Médicas</span>
              </label>
              <button
                type="button"
                onClick={() => handleToggleDictation('add')}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg transition-colors ${
                  isDictating && dictationTarget === 'add'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/50'
                }`}
                title="Dictar anotación con el micrófono"
              >
                {isDictating && dictationTarget === 'add' ? (
                  <MicOff className="w-3 h-3" />
                ) : (
                  <Mic className="w-3 h-3" />
                )}
                <span>
                  {isDictating && dictationTarget === 'add' ? 'Escuchando…' : 'Dictar nota'}
                </span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade instrucciones, consejos del médico o precauciones (ej. Tomar 30 min antes de comer con un vaso grande de agua, no mezclar con lácteos, vigilar tensión...)"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlertOn}
                  onChange={(e) => setIsAlertOn(e.target.checked)}
                  className="rounded border-neutral-300 text-pink-600"
                />
                <span>Activar alarma sonora</span>
              </label>
              {isAlertOn && (
                <select
                  value={lead}
                  onChange={(e) => setLead(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-800"
                >
                  <option value={0}>Avisar a la hora exacta</option>
                  <option value={5}>5 minutos antes</option>
                  <option value={10}>10 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                </select>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Guardar medicamento
            </button>
          </div>
        </form>
      )}

      {/* Medication List */}
      <div className="bg-white dark:bg-[#151722] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden">
        {medications.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No tienes medicamentos registrados. Pulsa «Añadir medicamento» arriba.
          </div>
        ) : (
          medications
            .slice()
            .sort((a, b) => (a.h || '00:00').localeCompare(b.h || '00:00'))
            .map((med) => {
              const isTakenToday = Boolean(med.taken?.[todayStr]);
              const isInlineEditingThis = inlineNoteMedId === med.id;

              return (
                <div
                  key={med.id}
                  className={`p-4 transition-colors ${
                    isTakenToday
                      ? 'bg-neutral-50/70 dark:bg-neutral-900/40 opacity-75'
                      : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
                  }`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    {/* Checkbox and main info */}
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(med.id)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 ${
                          isTakenToday
                            ? 'bg-pink-600 border-pink-600 text-white shadow-xs'
                            : 'border-pink-400 hover:border-pink-600'
                        }`}
                        title={isTakenToday ? 'Marcar como pendiente' : 'Marcar como tomada hoy'}
                      >
                        {isTakenToday && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <b
                            className={`text-sm ${
                              isTakenToday
                                ? 'line-through text-neutral-500'
                                : 'text-neutral-900 dark:text-neutral-100 font-semibold'
                            }`}
                          >
                            {med.n}
                          </b>
                          {isTakenToday && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded">
                              Tomada hoy
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {med.dose}
                        </p>
                      </div>
                    </div>

                    {/* Clock and Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-mono tabular-nums bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-pink-600" />
                        <span>{med.h}</span>
                        {med.on && (
                          <span title="Alarma activa">
                            <Bell className="w-3 h-3 text-pink-500" />
                          </span>
                        )}
                      </div>

                      {/* Edit full medication */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Editar medicamento y anotaciones"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete medication */}
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteMedication(med.id);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar medicamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ---------------- ANOTACIONES SECTION ---------------- */}
                  <div className="mt-2.5 ml-10">
                    {/* Inline Note Editor if opened */}
                    {isInlineEditingThis ? (
                      <div className="p-3 rounded-xl bg-pink-50/50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-pink-900 dark:text-pink-300 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Editando anotación de {med.n}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleDictation('inline')}
                            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              isDictating && dictationTarget === 'inline'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'text-pink-700 dark:text-pink-300 hover:bg-pink-100'
                            }`}
                          >
                            <Mic className="w-3 h-3" />
                            <span>{isDictating && dictationTarget === 'inline' ? 'Escuchando…' : 'Dictar'}</span>
                          </button>
                        </div>
                        <textarea
                          value={inlineNoteText}
                          onChange={(e) => setInlineNoteText(e.target.value)}
                          placeholder="Escribe las instrucciones o anotaciones de este medicamento…"
                          rows={2}
                          className="w-full p-2 text-xs rounded-lg border border-pink-200 dark:border-pink-800 bg-white dark:bg-[#12141f] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInlineNoteMedId(null)}
                            className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInlineNote(med)}
                            className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                          >
                            Guardar anotación
                          </button>
                        </div>
                      </div>
                    ) : med.notes ? (
                      /* Display existing notes with Edit & Delete actions */
                      <div className="p-2.5 rounded-xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/40 flex items-start justify-between gap-3 text-xs text-neutral-700 dark:text-neutral-300 group/note">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-pink-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-800 dark:text-pink-400 block mb-0.5">
                              Anotación / Instrucciones:
                            </span>
                            <p className="text-xs leading-relaxed italic">
                              "{med.notes}"
                            </p>
                          </div>
                        </div>

                        {/* Actions for this specific annotation */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover/note:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartInlineNote(med)}
                            className="p-1 rounded-md text-neutral-500 hover:text-pink-600 hover:bg-pink-100/60 dark:hover:bg-pink-900/40 transition-colors"
                            title="Editar anotación"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnotation(med)}
                            className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Eliminar solo la anotación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* If no annotation exists, quick button to add one */
                      <button
                        type="button"
                        onClick={() => handleStartInlineNote(med)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-700 dark:text-pink-400 hover:text-pink-800 hover:underline pt-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir anotación o instrucciones</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* ---------------- EDIT MEDICATION MODAL ---------------- */}
      {editingMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingMed(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center text-sm shadow-xs">
                  💊
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    Editar Medicamento y Anotaciones
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Modifica el nombre, dosis, horario o sus instrucciones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMed(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nombre del medicamento
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={editDose}
                    onChange={(e) => setEditDose(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Hora diaria
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs font-mono text-neutral-900 dark:text-neutral-100"
                    required
                  />
                </div>
              </div>

              {/* Anotaciones field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-pink-600" />
                    <span>Anotaciones / Instrucciones de toma</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleDictation('edit')}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg transition-colors ${
                        isDictating && dictationTarget === 'edit'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'text-pink-600 hover:bg-pink-50'
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isDictating && dictationTarget === 'edit' ? 'Escuchando…' : 'Dictar'}</span>
                    </button>

                    {editNotes.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditNotes('');
                        }}
                        className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Eliminar nota
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Instrucciones del médico, precauciones, efectos a vigilar o consejos de toma…"
                  rows={3}
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Alarm Config */}
              <div className="flex items-center justify-between gap-3 text-xs text-neutral-600 dark:text-neutral-400 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsAlertOn}
                    onChange={(e) => setEditIsAlertOn(e.target.checked)}
                    className="rounded border-neutral-300 text-pink-600"
                  />
                  <span>Alarma sonora activa</span>
                </label>
                {editIsAlertOn && (
                  <select
                    value={editLead}
                    onChange={(e) => setEditLead(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-800"
                  >
                    <option value={0}>A la hora exacta</option>
                    <option value={5}>5 min antes</option>
                    <option value={10}>10 min antes</option>
                    <option value={15}>15 min antes</option>
                  </select>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
