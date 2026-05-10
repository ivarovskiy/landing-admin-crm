"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type AdminTheme = "light" | "dark";

const STORAGE_KEY = "admin-theme";

function applyTheme(theme: AdminTheme) {
  const shell = document.querySelector<HTMLElement>("[data-admin-theme-shell]");
  if (!shell) return;
  shell.classList.toggle("admin-theme", theme === "light");
  shell.classList.toggle("dark", theme === "dark");
  shell.dataset.adminTheme = theme;
}

export function AdminThemeMenu() {
  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function selectTheme(next: AdminTheme) {
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <div className="admin-theme-menu" aria-label="Admin theme">
      <button
        type="button"
        className={theme === "light" ? "admin-theme-menu__btn admin-theme-menu__btn--active" : "admin-theme-menu__btn"}
        onClick={() => selectTheme("light")}
        title="Light theme"
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </button>
      <button
        type="button"
        className={theme === "dark" ? "admin-theme-menu__btn admin-theme-menu__btn--active" : "admin-theme-menu__btn"}
        onClick={() => selectTheme("dark")}
        title="Dark theme"
      >
        <Moon className="h-4 w-4" />
        <span>Dark</span>
      </button>
    </div>
  );
}
