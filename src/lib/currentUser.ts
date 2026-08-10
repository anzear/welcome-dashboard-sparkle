import { useEffect, useState } from "react";

export interface MockUser {
  name: string;
  team?: string;
  color: string; // tailwind bg color class
}

export const MOCK_USERS: MockUser[] = [
  { name: "Jon Doe", team: "Strategy", color: "bg-emerald-500" },
  { name: "Maya Chen", team: "R&D", color: "bg-violet-500" },
  { name: "Sam Patel", team: "Procurement", color: "bg-amber-500" },
  { name: "Lina Rossi", team: "Sustainability", color: "bg-rose-500" },
];

const KEY = "current_user_v1";
const EVT = "currentUserChanged";

export function getCurrentUser(): MockUser {
  if (typeof window === "undefined") return MOCK_USERS[0];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const u = JSON.parse(raw);
      const match = MOCK_USERS.find((m) => m.name === u.name);
      if (match) return match;
    }
  } catch {}
  return MOCK_USERS[0];
}

export function setCurrentUser(name: string) {
  const u = MOCK_USERS.find((m) => m.name === name) || MOCK_USERS[0];
  try {
    localStorage.setItem(KEY, JSON.stringify(u));
  } catch {}
  window.dispatchEvent(new Event(EVT));
}

export function useCurrentUser(): MockUser {
  const [u, setU] = useState<MockUser>(() => getCurrentUser());
  useEffect(() => {
    const h = () => setU(getCurrentUser());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return u;
}

export const CURRENT_USER_EVENT = EVT;
