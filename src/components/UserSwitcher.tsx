import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check, UserRound } from "lucide-react";
import { MOCK_USERS, setCurrentUser, useCurrentUser } from "@/lib/currentUser";
import { initials } from "@/lib/materialEvaluation";

export default function UserSwitcher() {
  const user = useCurrentUser();
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-card border border-border shadow-md hover:shadow-lg transition-shadow">
            <span className={`w-6 h-6 rounded-full ${user.color} text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-card`}>
              {initials(user.name)}
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-semibold text-foreground">{user.name}</span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Demo as</span>
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-60 p-1.5">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold inline-flex items-center gap-1.5">
            <UserRound className="w-3 h-3" /> Switch demo user
          </div>
          <ul className="space-y-0.5">
            {MOCK_USERS.map((u) => {
              const active = u.name === user.name;
              return (
                <li key={u.name}>
                  <button
                    onClick={() => setCurrentUser(u.name)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-muted transition-colors ${active ? "bg-muted" : ""}`}
                  >
                    <span className={`w-6 h-6 rounded-full ${u.color} text-white text-[10px] font-semibold flex items-center justify-center`}>
                      {initials(u.name)}
                    </span>
                    <span className="flex flex-col leading-tight flex-1">
                      <span className="text-xs font-medium">{u.name}</span>
                      {u.team && <span className="text-[10px] text-muted-foreground">{u.team}</span>}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
