"use client";

import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

const COACHFI_PREFIX = "coachfi-";
const COPY: Record<Locale, { title: string; body: string; export: string; delete: string }> = {
  en: {
    title: "Data control on this device",
    body: "Coach FI stores most app state locally in the browser. You can export or delete local app data from this device.",
    export: "Export data",
    delete: "Delete local data",
  },
  pl: {
    title: "Kontrola danych na tym urządzeniu",
    body: "Coach FI zapisuje większość stanu lokalnie w przeglądarce. Możesz wyeksportować lub usunąć lokalne dane aplikacji z tego urządzenia.",
    export: "Eksportuj dane",
    delete: "Usuń dane lokalne",
  },
  ja: {
    title: "この端末のデータ管理",
    body: "Coach FI は多くの状態をブラウザ内に保存します。この端末のローカルデータをエクスポートまたは削除できます。",
    export: "データをエクスポート",
    delete: "ローカルデータを削除",
  },
};

function collectStorage(storage: Storage) {
  const data: Record<string, string> = {};
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(COACHFI_PREFIX)) {
      data[key] = storage.getItem(key) ?? "";
    }
  }
  return data;
}

export function DataSafetyPanel() {
  const { locale } = useLanguage();
  const copy = COPY[locale];

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      localStorage: collectStorage(window.localStorage),
      sessionStorage: collectStorage(window.sessionStorage),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "coachfi-data-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function deleteLocalData() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
        (key): key is string => !!key && key.startsWith(COACHFI_PREFIX)
      );
      keys.forEach((key) => storage.removeItem(key));
    }
    window.location.reload();
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black text-text">{copy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{copy.body}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={exportData}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {copy.export}
        </Button>
        <Button type="button" variant="outline" onClick={deleteLocalData}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {copy.delete}
        </Button>
      </div>
    </div>
  );
}
