import React, { useState } from 'react';
import { Task, ShoppingItem } from '../types';
import { SHOP_TYPES } from '../utils/constants';
import { getWhatsAppShoppingUrl } from '../utils/calendarExport';
import { ShoppingCart, Plus, Check, Trash2, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShoppingViewProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onAddTask: (prefilled: Partial<Task>) => void;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({
  tasks,
  onUpdateTask,
  onAddTask,
}) => {
  const shoppingTasks = tasks.filter((t) => t.c === 'compras');

  // Selected or active shopping list task
  const [selectedTaskId, setSelectedTaskId] = useState<number>(
    shoppingTasks.length > 0 ? shoppingTasks[0].id : 0
  );

  const activeTask =
    shoppingTasks.find((t) => t.id === selectedTaskId) ||
    shoppingTasks[0] ||
    null;

  const [newItemText, setNewItemText] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [newListType, setNewListType] = useState<string>('super');
  const [showNewListModal, setShowNewListModal] = useState(false);

  const items = activeTask?.items || [];
  const completedCount = items.filter((i) => i.d).length;

  const handleToggleItem = (itemId: string) => {
    if (!activeTask) return;
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, d: !item.d } : item
    );

    const willBeAllDone = updatedItems.length > 0 && updatedItems.every((i) => i.d);
    if (willBeAllDone) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }

    onUpdateTask({
      ...activeTask,
      items: updatedItems,
    });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !activeTask) return;

    const newItem: ShoppingItem = {
      id: String(Date.now()),
      x: newItemText.trim(),
      d: false,
    };

    onUpdateTask({
      ...activeTask,
      items: [...items, newItem],
    });

    setNewItemText('');
  };

  const handleRemoveItem = (itemId: string) => {
    if (!activeTask) return;
    onUpdateTask({
      ...activeTask,
      items: items.filter((i) => i.id !== itemId),
    });
  };

  const handleClearCompleted = () => {
    if (!activeTask) return;
    onUpdateTask({
      ...activeTask,
      items: items.filter((i) => !i.d),
    });
  };

  const handleCreateNewList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const newTask: Partial<Task> = {
      t: newListTitle.trim(),
      c: 'compras',
      d: new Date().toISOString().slice(0, 10),
      h: '18:00',
      done: false,
      ctipo: newListType as any,
      items: [],
    };

    onAddTask(newTask);
    setNewListTitle('');
    setShowNewListModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151722] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            🛒
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
              Listas de la Compra y Artículos
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Organiza tus listas por supermercado, hogar o farmacia y compártelas en WhatsApp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNewListModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e8533a] hover:bg-[#d4432c] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva lista</span>
        </button>
      </div>

      {/* List Selector Tabs */}
      {shoppingTasks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {shoppingTasks.map((t) => {
            const isSelected = activeTask?.id === t.id;
            const tItems = t.items || [];
            const remaining = tItems.filter((i) => !i.d).length;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTaskId(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-[#151722] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <span>{t.t}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums font-bold ${
                    isSelected
                      ? 'bg-neutral-700 dark:bg-neutral-200 text-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {remaining}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active List Card */}
      {activeTask ? (
        <div className="bg-white dark:bg-[#151722] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100">
                  {activeTask.t}
                </h4>
                <span className="text-xs text-neutral-500">
                  ({SHOP_TYPES[activeTask.ctipo || 'super']})
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {completedCount} de {items.length} artículos comprados
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getWhatsAppShoppingUrl(
                  activeTask.t,
                  SHOP_TYPES[activeTask.ctipo || 'super'],
                  items.map((i) => ({ x: i.x, d: i.d }))
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </a>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Limpiar comprados ({completedCount})
                </button>
              )}
            </div>
          </div>

          {/* Quick Add Input */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Escribe un artículo (ej. Manzanas, Leche, Detergente, Pan integral)..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#e8533a]/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              ＋ Añadir
            </button>
          </form>

          {/* Items Checklist */}
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Esta lista está vacía. Añade artículos arriba para empezar.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    item.d
                      ? 'bg-neutral-50/70 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/60 text-neutral-400'
                      : 'bg-white dark:bg-[#151722] border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        item.d
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {item.d && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        item.d ? 'line-through text-neutral-400' : ''
                      }`}
                    >
                      {item.x}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Eliminar artículo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#151722] rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 mb-3">No tienes listas de compra creadas.</p>
          <button
            onClick={() => setShowNewListModal(true)}
            className="px-4 py-2 bg-[#e8533a] text-white rounded-xl text-xs font-semibold"
          >
            Crear lista de la compra
          </button>
        </div>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs"
          onClick={() => setShowNewListModal(false)}
        >
          <div
            className="bg-white dark:bg-[#161824] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif font-bold text-base text-neutral-900 dark:text-neutral-100">
              Crear Nueva Lista de Compra
            </h3>

            <form onSubmit={handleCreateNewList} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Nombre de la lista
                </label>
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Ej. Compra semanal Mercadona, Ropa rebajas..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs text-neutral-900 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Tipo de comercio
                </label>
                <select
                  value={newListType}
                  onChange={(e) => setNewListType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#faf8f5] dark:bg-[#12141f] text-xs"
                >
                  <option value="super">🛍️ Supermercado / Alimentación</option>
                  <option value="ropa">👕 Ropa y calzado</option>
                  <option value="higiene">🧴 Higiene y droguería</option>
                  <option value="menaje">🍳 Menaje y hogar</option>
                  <option value="farmacia">💊 Farmacia y parafarmacia</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#e8533a] text-white text-xs font-semibold"
                >
                  Crear lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
