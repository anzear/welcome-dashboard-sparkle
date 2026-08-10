export type ActivityNotification = {
  id: string;
  source: 'material-brief' | 'decision-space' | 'pathway-decision';
  action: 'added' | 'updated' | 'removed';
  title: string;
  description?: string;
  link: string;
  topic?: string;
  timestamp: string;
  read?: boolean;
};

const KEY = 'activity_notifications_v1';
const EVENT = 'activity-notifications-updated';
const MAX = 50;

export function getActivities(): ActivityNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list: ActivityNotification[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function addActivity(input: Omit<ActivityNotification, 'id' | 'timestamp' | 'read'>) {
  const entry: ActivityNotification = {
    ...input,
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  const list = [entry, ...getActivities()];
  save(list);
}

export function markAllRead() {
  save(getActivities().map(n => ({ ...n, read: true })));
}

export function markRead(id: string) {
  save(getActivities().map(n => n.id === id ? { ...n, read: true } : n));
}

export function clearActivities() {
  save([]);
}

export const ACTIVITY_EVENT = EVENT;

export function seedSampleActivities() {
  const existing = getActivities();
  if (existing.length > 0) return;
  const now = Date.now();
  const samples: ActivityNotification[] = [
    {
      id: 'sample-1',
      source: 'material-brief',
      action: 'updated',
      title: 'Material requirements saved',
      description: 'Target material specification and sustainability targets were updated for Fructose.',
      link: '/material-brief/Fructose',
      topic: 'Fructose',
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'sample-2',
      source: 'decision-space',
      action: 'added',
      title: 'Decision "Pursue pilot-scale fermentation" added',
      description: 'A new decision was logged in the Lactic Acid decision space.',
      link: '/decisions/Lactic Acid',
      topic: 'Lactic Acid',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'sample-3',
      source: 'pathway-decision',
      action: 'added',
      title: 'Pathway decision added',
      description: 'Evaluated the fermentation route and marked it as "Preferred".',
      link: '/pathways/Lactic Acid/Fermentation',
      topic: 'Lactic Acid — Fermentation',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'sample-4',
      source: 'material-brief',
      action: 'updated',
      title: 'Material requirements saved',
      description: 'Regulatory & compliance requirements updated for Sulphuric Acid.',
      link: '/material-brief/Sulphuric Acid',
      topic: 'Sulphuric Acid',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'sample-5',
      source: 'decision-space',
      action: 'removed',
      title: 'Decision removed',
      description: 'Removed an outdated decision from the Sulphuric Acid decision space.',
      link: '/decisions/Sulphuric Acid',
      topic: 'Sulphuric Acid',
      timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
  save(samples);
}
