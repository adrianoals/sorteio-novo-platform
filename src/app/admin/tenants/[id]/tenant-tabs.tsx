"use client";

import { useState } from "react";
import Link from "next/link";
import { TenantConfigTab } from "./tabs/config-tab";
import { BlocksTab } from "./tabs/blocks-tab";
import { ApartmentsTab } from "./tabs/apartments-tab";
import { SpotsTab } from "./tabs/spots-tab";
import { ImportTab } from "./tabs/import-tab";
import { StatusTab } from "./tabs/status-tab";

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
  { id: "status", label: "Status" },
] as const;

export function TenantTabs({ tenant }: { tenant: Tenant }) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("config");

  return (
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
                onClick={() => setActive(tab.id)}
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
        {active === "config" && <TenantConfigTab tenant={tenant} />}
        {active === "blocks" && <BlocksTab tenantId={tenant.id} />}
        {active === "apartments" && (
          <ApartmentsTab
            tenantId={tenant.id}
            hasBlocks={!!tenant.config?.has_blocks}
            hasBasement={!!tenant.config?.has_basement}
            basements={tenant.config?.basements ?? []}
          />
        )}
        {active === "spots" && <SpotsTab tenantId={tenant.id} hasBlocks={!!tenant.config?.has_blocks} config={tenant.config} />}
        {active === "import" && <ImportTab tenantId={tenant.id} />}
        {active === "status" && <StatusTab tenantId={tenant.id} />}
      </div>
    </div>
  );
}
