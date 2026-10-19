"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { buildOwnedLocalDataExport, deleteLocalProductData } from "@/lib/data-export";
import { useProductStorage } from "@/lib/use-product-storage";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

const COPY: LocalizedMap<{ title: string; body: string; export: string; delete: string }> = {
  en: {
    title: "Data control on this device",
    body: "Export selected data for the current guest or account, including the device language. Sign-in credentials and free-text names/goals are excluded. Delete removes this owner's local data only, preserving data outside this scope and device preferences. It does not delete your account or provider data. Signing in again may download earlier account data into an empty local view; new changes stay on this device.",
    export: "Export data",
    delete: "Delete local data",
  },
  pl: {
    title: "Kontrola danych na tym urządzeniu",
    body: "Eksportuj wybrane dane bieżącego gościa lub konta, w tym język urządzenia. Eksport pomija poświadczenia i tekstowe nazwy/cele. Usunięcie obejmuje tylko lokalne dane tego właściciela, zachowując dane poza tym zakresem i ustawienia urządzenia. Nie usuwa konta ani danych u dostawców. Ponowne logowanie może pobrać wcześniejsze dane konta do pustego lokalnego widoku; nowe zmiany pozostają na tym urządzeniu.",
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

export function DataSafetyPanel() {
  const { storage, sessionStorage } = useProductStorage();
  const { locale } = useLanguage();
  const copy = pickLocalized(COPY, locale);
  const [error, setError] = useState(false);

  function exportData() {
    setError(false);
    try {
      const payload = buildOwnedLocalDataExport(storage, sessionStorage);
      if (!storage.isCurrent() || !sessionStorage.isCurrent()) throw new Error("Storage owner changed");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = "coachfi-data-export.json";
        if (!storage.isCurrent() || !sessionStorage.isCurrent()) throw new Error("Storage owner changed");
        link.click();
      } finally { URL.revokeObjectURL(url); }
    } catch { setError(true); }
  }

  function deleteLocalData() {
    setError(false);
    try {
      if (!deleteLocalProductData(storage)) throw new Error("Storage owner changed");
      window.location.reload();
    } catch { setError(true); }
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black text-text">{copy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{copy.body}</p>
      <p className="mt-2 text-sm font-bold">{locale === "pl"
        ? (storage.owner?.kind === "account" ? "Bieżący zakres: konto" : "Bieżący zakres: gość")
        : (storage.owner?.kind === "account" ? "Current scope: account" : "Current scope: guest")}</p>
      {error ? <p role="alert" className="mt-2 text-sm text-attention">{locale === "pl" ? "Nie udało się przetworzyć danych lokalnych. Spróbuj ponownie." : "Local data could not be processed. Please try again."}</p> : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={exportData} disabled={!storage.isCurrent()}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {copy.export}
        </Button>
        <Button type="button" variant="outline" onClick={deleteLocalData} disabled={!storage.isCurrent()}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {copy.delete}
        </Button>
      </div>
    </div>
  );
}
