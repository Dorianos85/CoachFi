"use client";

import { Fragment, type ReactNode } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useProductStorage } from "@/lib/use-product-storage";

/** Auth controllers live outside this boundary so changing owner does not restart them. */
export function ProductScopeBoundary({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const { snapshot } = useProductStorage();
  if (snapshot.status !== "ready") {
    if (snapshot.failure === "erase-failed") return <div role="alert" className="p-6 text-sm text-muted">
      <p>{locale === "pl" ? "Nie udało się usunąć wszystkich danych lokalnych. Część danych mogła zostać usunięta. Synchronizacja została zatrzymana."
        : "Some local data could not be deleted. Part of the data may have been removed. Sync has been stopped."}</p>
      <button type="button" className="mt-3 rounded-lg border p-3 font-bold" onClick={() => window.location.reload()}>
        {locale === "pl" ? "Wczytaj aplikację ponownie" : "Reload the app"}
      </button>
    </div>;
    return <p role="status" className="p-6 text-sm text-muted">{locale === "pl"
      ? "Ustalamy dostęp do danych na tym urządzeniu…" : "Preparing access to data on this device…"}</p>;
  }
  return <Fragment key={snapshot.revision}>
    {snapshot.owner?.kind === "account" && snapshot.localOnly && <p role="status"
      className="border-b border-primary/10 bg-white p-3 text-sm text-muted">{locale === "pl"
        ? snapshot.syncIssue === "unconfirmed"
          ? "Zmiany na tym urządzeniu nie mają potwierdzenia zapisu na koncie. Zachowujemy lokalne dane; automatyczna synchronizacja jest wyłączona. Możesz wyeksportować dane na stronie Prywatność."
          : snapshot.syncIssue === "read-only"
            ? "Dane konta można odczytać. Zmiany zapisujemy tylko na tym urządzeniu; automatyczna synchronizacja jest wyłączona."
            : "Dane tego konta są dostępne lokalnie. Synchronizacja jest obecnie niedostępna."
        : snapshot.syncIssue === "unconfirmed"
          ? "Changes on this device have no confirmed account save. Local data is preserved; automatic sync is disabled. You can export data on the Privacy page."
          : snapshot.syncIssue === "read-only"
            ? "Account data can be read. Changes are saved only on this device; automatic sync is disabled."
            : "This account's data is available locally. Sync is currently unavailable."}</p>}
    {children}
  </Fragment>;
}
