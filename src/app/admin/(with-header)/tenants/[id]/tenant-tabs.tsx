"use client";

import { useMemo, useState } from "react";
import { SWRConfig } from "swr";
import { TenantConfigTab } from "./tabs/config-tab";
import { BlocksTab } from "./tabs/blocks-tab";
import { ApartmentsTab } from "./tabs/apartments-tab";
import { SpotsTab } from "./tabs/spots-tab";
import { ImportTab } from "./tabs/import-tab";
import { StatusTab } from "./tabs/status-tab";
import { DrawsTab } from "./tabs/draws-tab";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  config?: {
    has_blocks?: boolean;
    has_basement?: boolean;
    basements?: string[];
    enabled_features?: { pne?: boolean; idoso?: boolean };
    intended_draw_type?: "S1" | "S2" | "S3";
  } | null;
};

const TABS = [
  { id: "config", label: "Config" },
  { id: "blocks", label: "Blocos" },
  { id: "apartments", label: "Apartamentos" },
  { id: "spots", label: "Vagas" },
  { id: "import", label: "Importações" },
  { id: "draws", label: "Sorteios" },
  { id: "status", label: "Status" },
] as const;

export function TenantTabs({
  tenant,
  fallback,
}: {
  tenant: Tenant;
  fallback: Record<string, unknown>;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("config");
  const [mountedTabs, setMountedTabs] = useState<Set<(typeof TABS)[number]["id"]>>(
    () => new Set(["config"])
  );

  const activateTab = (tabId: (typeof TABS)[number]["id"]) => {
    setActive(tabId);
    setMountedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
  };

  const hasBlocks = !!tenant.config?.has_blocks;
  const hasBasement = !!tenant.config?.has_basement;
  const basements = useMemo(() => tenant.config?.basements ?? [], [tenant.config?.basements]);

  return (
    <SWRConfig value={{ fallback }}>
      <div>
        <div className="border-b border-[#e2deeb]">
          <nav className="flex gap-1" aria-label="Abas">
            {TABS.map((tab) => {
              const showBlocks = tab.id !== "blocks" || tenant.config?.has_blocks;
              if (tab.id === "blocks" && !showBlocks) return null;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => activateTab(tab.id)}
                  className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active === tab.id
                      ? "border-[#5936CC] text-[#250E62]"
                      : "border-transparent text-[#5b4d7a] hover:text-[#3F228D]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-6">
          {mountedTabs.has("config") && (
            <div className={active === "config" ? "block" : "hidden"}>
              <TenantConfigTab tenant={tenant} />
            </div>
          )}
          {hasBlocks && mountedTabs.has("blocks") && (
            <div className={active === "blocks" ? "block" : "hidden"}>
              <BlocksTab tenantId={tenant.id} />
            </div>
          )}
          {mountedTabs.has("apartments") && (
            <div className={active === "apartments" ? "block" : "hidden"}>
              <ApartmentsTab
                tenantId={tenant.id}
                hasBlocks={hasBlocks}
                hasBasement={hasBasement}
                basements={basements}
              />
            </div>
          )}
          {mountedTabs.has("spots") && (
            <div className={active === "spots" ? "block" : "hidden"}>
              <SpotsTab tenantId={tenant.id} hasBlocks={hasBlocks} config={tenant.config} />
            </div>
          )}
          {mountedTabs.has("import") && (
            <div className={active === "import" ? "block" : "hidden"}>
              <ImportTab tenant={tenant} />
            </div>
          )}
          {mountedTabs.has("draws") && (
            <div className={active === "draws" ? "block" : "hidden"}>
              <DrawsTab tenantId={tenant.id} />
            </div>
          )}
          {mountedTabs.has("status") && (
            <div className={active === "status" ? "block" : "hidden"}>
              <StatusTab tenantId={tenant.id} />
            </div>
          )}
        </div>
      </div>
    </SWRConfig>
  );
}
