// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

export interface UseKeyboardShortcutsOptions {
  onToggleSearch: () => void;
  onCloseSearch: () => void;
  onNewTask: () => void;
  onSelectView: (view: 'day' | 'week' | 'month' | 'list' | 'undated') => void;
}

/**
 * Custom hook to manage global keyboard shortcuts across the application.
 * Ignores regular character keys when the active focused element is an input, textarea, or contentEditable.
 */
export function useKeyboardShortcuts({
  onToggleSearch,
  onCloseSearch,
  onNewTask,
  onSelectView,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Meta/Ctrl + K: Toggle Quick Search Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleSearch();
        return;
      }

      // Escape: Close active overlay / search
      if (e.key === 'Escape') {
        onCloseSearch();
        return;
      }

      // Single-key shortcuts only active when not typing inside an input element
      if (!isInput) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          onNewTask();
        } else if (e.key === '1') {
          onSelectView('day');
        } else if (e.key === '2') {
          onSelectView('week');
        } else if (e.key === '3') {
          onSelectView('month');
        } else if (e.key === '4') {
          onSelectView('list');
        } else if (e.key === '5') {
          onSelectView('undated');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSearch, onCloseSearch, onNewTask, onSelectView]);
}
