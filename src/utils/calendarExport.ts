import { Task } from '../types';
import { toIsoDate } from './constants';

export function getGoogleCalendarUrl(task: Partial<Task>): string {
  const title = task.t || 'Recordatorio';
  const dateStr = task.d || toIsoDate(new Date());
  const timeStr = task.h || '10:00';

  const [hours, mins] = timeStr.split(':').map(Number);
  const start = new Date(`${dateStr}T${timeStr}:00`);
  const end = new Date(start.getTime() + 45 * 60 * 1000);

  const formatGCal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const details = task.n || '';
  const location = task.lugar || '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGCal(start)}/${formatGCal(end)}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile(task: Partial<Task>) {
  const title = task.t || 'Recordatorio';
  const dateStr = task.d || toIsoDate(new Date());
  const timeStr = task.h || '10:00';

  const start = new Date(`${dateStr}T${timeStr}:00`);
  const end = new Date(start.getTime() + 45 * 60 * 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi Calendario de Tareas//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:task-${task.id || Date.now()}@micalendario.app`,
    `DTSTAMP:${fmt(new Date())}Z`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(task.n || '').replace(/\n/g, '\\n')}`,
    task.lugar ? `LOCATION:${task.lugar.replace(/\n/g, ' ')}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function getWhatsAppShoppingUrl(title: string, categoryName: string, items: Array<{ x: string; d: boolean }>): string {
  const header = `🛒 *${title || 'Lista de la compra'}* (${categoryName})\n`;
  const itemsText = items.length
    ? items.map((i) => (i.d ? `✅ ~${i.x}~` : `▫️ ${i.x}`)).join('\n')
    : '(Lista vacía)';
  const message = `${header}\n${itemsText}\n\n_Organizado con Mi Calendario de Tareas_`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function getMapsUrl(type: 'search' | 'directions', query: string): string {
  const clean = query.trim();
  if (!clean) return 'https://www.google.com/maps';
  if (type === 'directions') {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clean)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
}
