"use client";

import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

const COACHFI_PREFIX = "coachfi-";
const COPY: LocalizedMap<{ title: string; body: string; export: string; delete: string }> = {
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
  es: {
    title: "Control de datos en este dispositivo",
    body: "Coach FI guarda la mayor parte del estado de la app localmente en el navegador. Puedes exportar o eliminar los datos locales de la app en este dispositivo.",
    export: "Exportar datos",
    delete: "Eliminar datos locales",
  },
  fr: {
    title: "Contrôle des données sur cet appareil",
    body: "Coach FI stocke l'essentiel de l'état de l'application localement dans le navigateur. Vous pouvez exporter ou supprimer les données locales de l'application sur cet appareil.",
    export: "Exporter les données",
    delete: "Supprimer les données locales",
  },
  zh: {
    title: "本设备上的数据控制",
    body: "Coach FI 将大部分应用状态保存在本地浏览器中。你可以从本设备导出或删除本地应用数据。",
    export: "导出数据",
    delete: "删除本地数据",
  },
  hi: {
    title: "इस डिवाइस पर डेटा नियंत्रण",
    body: "Coach FI ऐप की ज़्यादातर स्थिति ब्राउज़र में स्थानीय रूप से सहेजता है। आप इस डिवाइस से स्थानीय ऐप डेटा एक्सपोर्ट कर सकते हैं या हटा सकते हैं।",
    export: "डेटा एक्सपोर्ट करें",
    delete: "स्थानीय डेटा हटाएं",
  },
  "pt-BR": {
    title: "Controle de dados neste dispositivo",
    body: "O Coach FI guarda a maior parte do estado do app localmente no navegador. Você pode exportar ou apagar os dados locais do app neste dispositivo.",
    export: "Exportar dados",
    delete: "Apagar dados locais",
  },
  tr: {
    title: "Bu cihazda veri kontrolü",
    body: "Coach FI uygulama durumunun çoğunu tarayıcıda yerel olarak saklar. Yerel uygulama verilerini bu cihazdan dışa aktarabilir veya silebilirsin.",
    export: "Verileri dışa aktar",
    delete: "Yerel verileri sil",
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
  const copy = pickLocalized(COPY, locale);

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
