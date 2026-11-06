export interface MotivationalQuote {
  id: number;
  text: string;
  author: string;
  category: 'superacion' | 'organizacion' | 'serenidad' | 'habitos' | 'exito';
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 1,
    text: 'El secreto de avanzar es comenzar. El secreto de comenzar es dividir tus tareas complejas en pequeñas tareas manejables.',
    author: 'Mark Twain',
    category: 'organizacion',
  },
  {
    id: 2,
    text: 'No cuentes los días, haz que los días cuenten.',
    author: 'Muhammad Ali',
    category: 'superacion',
  },
  {
    id: 3,
    text: 'Somos lo que hacemos día a día de modo que la excelencia no es un acto, sino un hábito.',
    author: 'Aristóteles',
    category: 'habitos',
  },
  {
    id: 4,
    text: 'Cada mañana nacemos de nuevo. Lo que hacemos hoy es lo que más importa.',
    author: 'Buda',
    category: 'serenidad',
  },
  {
    id: 5,
    text: 'La única forma de hacer un gran trabajo es amar lo que haces. Si aún no lo has encontrado, sigue buscando.',
    author: 'Steve Jobs',
    category: 'exito',
  },
  {
    id: 6,
    text: 'El futuro pertenece a quienes creen en la belleza de sus sueños.',
    author: 'Eleanor Roosevelt',
    category: 'superacion',
  },
  {
    id: 7,
    text: 'No juzgues cada día por lo que cosechas, sino por las semillas que siembras.',
    author: 'Robert Louis Stevenson',
    category: 'habitos',
  },
  {
    id: 8,
    text: 'La disciplina es el puente entre las metas y los logros.',
    author: 'Jim Rohn',
    category: 'organizacion',
  },
  {
    id: 9,
    text: 'Nunca es demasiado tarde para ser lo que podrías haber sido.',
    author: 'George Eliot',
    category: 'superacion',
  },
  {
    id: 10,
    text: 'La paz viene de adentro. No la busques afuera.',
    author: 'Marco Aurelio',
    category: 'serenidad',
  },
  {
    id: 11,
    text: 'Pequeñas acciones cotidianas crean resultados extraordinarios con el paso del tiempo.',
    author: 'James Clear',
    category: 'habitos',
  },
  {
    id: 12,
    text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
    author: 'Robert Collier',
    category: 'exito',
  },
  {
    id: 13,
    text: 'Lo que no empezamos hoy, jamás estará terminado mañana.',
    author: 'Johann Wolfgang von Goethe',
    category: 'organizacion',
  },
  {
    id: 14,
    text: 'No te limites. Mucha gente se limita a lo que piensan que pueden hacer. Puedes ir tan lejos como tu mente te lo permita.',
    author: 'Mary Kay Ash',
    category: 'superacion',
  },
  {
    id: 15,
    text: 'La felicidad no es algo hecho. Proviene de tus propias acciones.',
    author: 'Dalai Lama',
    category: 'serenidad',
  },
  {
    id: 16,
    text: 'Organizar tu día es regalarte calma para disfrutar de cada instante.',
    author: 'Proverbio anónimo',
    category: 'organizacion',
  },
  {
    id: 17,
    text: 'El valor no es la ausencia de miedo, sino el triunfo sobre él.',
    author: 'Nelson Mandela',
    category: 'superacion',
  },
  {
    id: 18,
    text: 'El orden en el tiempo es la libertad del espíritu.',
    author: 'Séneca',
    category: 'organizacion',
  },
  {
    id: 19,
    text: 'Cree que puedes y ya habrás recorrido la mitad del camino.',
    author: 'Theodore Roosevelt',
    category: 'exito',
  },
  {
    id: 20,
    text: 'La perseverancia no es una carrera larga, son muchas carreras cortas una tras otra.',
    author: 'Walter Elliot',
    category: 'habitos',
  },
  {
    id: 21,
    text: 'Aprende del ayer, vive para el hoy, sueña con el mañana.',
    author: 'Albert Einstein',
    category: 'serenidad',
  },
  {
    id: 22,
    text: 'Tu tiempo es limitado, así que no lo malgastes viviendo la vida de otro.',
    author: 'Steve Jobs',
    category: 'exito',
  },
  {
    id: 23,
    text: 'Si caminas solo irás más rápido, si caminas acompañado llegarás más lejos.',
    author: 'Proverbio africano',
    category: 'superacion',
  },
  {
    id: 24,
    text: 'No tienes que ver toda la escalera, solo da el primer paso.',
    author: 'Martin Luther King Jr.',
    category: 'organizacion',
  },
  {
    id: 25,
    text: 'La gratitud convierte lo que tenemos en suficiente, y más.',
    author: 'Melody Beattie',
    category: 'serenidad',
  },
  {
    id: 26,
    text: 'No esperes. El momento nunca será el perfecto. Empieza donde estás.',
    author: 'Napoleon Hill',
    category: 'habitos',
  },
  {
    id: 27,
    text: 'La mejor forma de predecir el futuro es crearlo.',
    author: 'Peter Drucker',
    category: 'exito',
  },
  {
    id: 28,
    text: 'Una meta sin un plan es simplemente un deseo.',
    author: 'Antoine de Saint-Exupéry',
    category: 'organizacion',
  },
];

/**
 * Devuelve una frase motivadora aleatoria, evitando opcionalmente repetir el ID anterior.
 */
export function getRandomMotivationalQuote(excludeId?: number): MotivationalQuote {
  const pool = MOTIVATIONAL_QUOTES.filter((q) => q.id !== excludeId);
  if (pool.length === 0) return MOTIVATIONAL_QUOTES[0];
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Devuelve un saludo cálido según la hora local del día.
 */
export function getTimeGreeting(userName?: string, customHour?: number): { greeting: string; period: 'morning' | 'afternoon' | 'evening'; emoji: string } {
  const hour = customHour !== undefined ? customHour : new Date().getHours();
  const namePart = userName && userName.trim() ? `, ${userName.trim()}` : '';

  if (hour >= 6 && hour < 13) {
    return {
      greeting: `¡Buenos días${namePart}!`,
      period: 'morning',
      emoji: '☀️',
    };
  } else if (hour >= 13 && hour < 21) {
    return {
      greeting: `¡Buenas tardes${namePart}!`,
      period: 'afternoon',
      emoji: '🌅',
    };
  } else {
    return {
      greeting: `¡Buenas noches${namePart}!`,
      period: 'evening',
      emoji: '🌙',
    };
  }
}

export const PRESET_AVATARS: { id: string; label: string; emoji: string; gradient: string }[] = [
  { id: 'preset:sparkle', label: 'Estrella Luminosa', emoji: '✨', gradient: 'from-amber-400 to-rose-500' },
  { id: 'preset:astronaut', label: 'Astronauta', emoji: '🧑‍🚀', gradient: 'from-indigo-500 to-cyan-400' },
  { id: 'preset:zen', label: 'Serenidad Zen', emoji: '🧘', gradient: 'from-emerald-400 to-teal-600' },
  { id: 'preset:coffee', label: 'Enfoque & Café', emoji: '☕', gradient: 'from-amber-600 to-amber-900' },
  { id: 'preset:artist', label: 'Creatividad', emoji: '🎨', gradient: 'from-fuchsia-500 to-purple-600' },
  { id: 'preset:runner', label: 'Vitalidad', emoji: '⚡', gradient: 'from-orange-500 to-amber-400' },
  { id: 'preset:phoenix', label: 'Fénix', emoji: '🦅', gradient: 'from-rose-500 to-red-600' },
  { id: 'preset:flower', label: 'Armonía', emoji: '🌸', gradient: 'from-pink-400 to-rose-400' },
];
