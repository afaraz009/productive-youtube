import React from "react";
import type { AuthUser } from "../auth/types";

interface AccountBarProps {
  user: AuthUser;
  busy: boolean;
  onSignOut: () => void;
}

const AccountBar: React.FC<AccountBarProps> = ({ user, busy, onSignOut }) => {
  return (
    <div className="space-y-3">
      <div>
        <span className="block text-xs text-slate-500 dark:text-slate-400">
          Signed in as
        </span>
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {user.email ?? "Unknown email"}
        </span>
      </div>
      <button
        onClick={onSignOut}
        disabled={busy}
        className="w-full px-3 py-2.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
};

export default AccountBar;