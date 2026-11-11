// src/components/QuickSearchModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { CATEGORY_MAP } from '../utils/constants';
import { Search, X, CheckCircle2, Circle, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleTask: (id: number) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onToggleTask,
}) => {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (filterStatus === 'pending' && task.done) return false;
    if (filterStatus === 'completed' && !task.done) return false;

    if (!normalizedQuery) return true;

    const matchesTitle = task.t?.toLowerCase().includes(normalizedQuery);
    const matchesNotes = task.n?.toLowerCase().includes(normalizedQuery);
    const categoryInfo = CATEGORY_MAP[task.c];
    const matchesCategory = categoryInfo?.n?.toLowerCase().includes(normalizedQuery);

    return matchesTitle || matchesNotes || matchesCategory;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredTasks.length > 0 ? (prev + 1) % filteredTasks.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredTasks.length > 0 ? (prev - 1 + filteredTasks.length) % filteredTasks.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTasks[selectedIndex]) {
        onSelectTask(filteredTasks[selectedIndex]);
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#e8533a] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar por título, nota o categoría... (↑ ↓ para navegar)"
            className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500">
            ESC para salir
          </span>
        </div>

        {/* Status Filters */}
        <div className="px-3 py-2 bg-neutral-50 dark:bg-[#12141f] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-[#1a1c2b] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-amber-600'
              }`}
            >
              Pendientes ({tasks.filter((t) => !t.done).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-500 text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-emerald-600'
              }`}
            >
              Hechas ({tasks.filter((t) => t.done).length})
            </button>
          </div>
          <span className="text-[11px] text-neutral-400">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/50">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Sparkles className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p className="text-sm">No se encontraron tareas con esa búsqueda.</p>
              <p className="text-xs text-neutral-500">Prueba con otra palabra clave o añade una nueva tarea con la tecla «N».</p>
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const cat = CATEGORY_MAP[task.c] || CATEGORY_MAP.recordatorios;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    onSelectTask(task);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask(task.id);
                      }}
                      className="text-neutral-400 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                    >
                      {task.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm">{cat.e}</span>
                        <span
                          className={`text-sm font-medium truncate ${
                            task.done
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {task.t}
                        </span>
                        {task.priority === 'urgente' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                            Urgente
                          </span>
                        )}
                        {task.priority === 'alta' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                            Alta
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span className="truncate">{cat.n}</span>
                        {task.isUndated || !task.d ? (
                          <span className="text-orange-600 dark:text-orange-400 font-medium">Sin fecha</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            {task.d}
                          </span>
                        )}
                        {task.h && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {task.h}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
