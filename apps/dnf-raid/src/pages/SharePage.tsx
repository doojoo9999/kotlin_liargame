import {useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {AlertTriangle, Loader2} from "lucide-react";

import {getRaid} from "../services/dnf";
import type {Participant} from "../types";
import {StatBadge} from "../components/StatBadge";

function SharePage() {
  const {raidId} = useParams<{raidId: string}>();

  const raidQuery = useQuery({
    queryKey: ["raid", raidId],
    enabled: Boolean(raidId),
    queryFn: () => (raidId ? getRaid(raidId) : Promise.resolve(null)),
  });

  if (raidQuery.isPending) {
    return (
      <div className="frosted p-6 flex items-center gap-2 text-white/70">
        <Loader2 className="h-4 w-4 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  if (!raidQuery.data) {
    return (
      <div className="frosted p-6 flex items-center gap-3 text-white/70">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        레이드를 찾을 수 없습니다.
      </div>
    );
  }

  const participants = raidQuery.data.participants;
  const slots: Record<number, Array<Participant | null>> = {
    1: [null, null, null, null],
    2: [null, null, null, null],
    3: [null, null, null, null],
  };
  const waiting: Participant[] = [];

  participants.forEach((p) => {
    if (p.partyNumber && p.slotIndex !== null && p.slotIndex !== undefined) {
      const party = slots[p.partyNumber];
      if (party && party[p.slotIndex] === null) {
        party[p.slotIndex] = p;
        return;
      }
    }
    waiting.push(p);
  });

  return (
    <div className="space-y-6">
      <div className="frosted p-5">
        <p className="text-sm text-white/70">{raidQuery.data.name}</p>
        <p className="font-display text-2xl">파티 배치 공유</p>
        <p className="text-xs text-white/60">누구나 접근 가능한 공유 페이지입니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((party) => (
          <div key={party} className="frosted p-4 space-y-3">
            <p className="text-white/70 text-sm">파티 {party}</p>
            <div className="space-y-2">
              {slots[party].map((p, idx) => (
                <div
                  key={`${party}-${idx}`}
                  className="rounded-xl border border-panel-border bg-white/5 p-3 min-h-[90px]"
                >
                  <p className="text-[11px] text-white/50 mb-1">슬롯 {idx + 1}</p>
                  {p ? (
                    <div>
                      <p className="font-display">{p.character.characterName}</p>
                      <p className="text-xs text-white/60">
                        {p.character.jobGrowName} · 명성 {p.character.fame.toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <StatBadge label="딜" value={p.damage} unit="억" />
                        <StatBadge label="버프" value={p.buffPower} unit="만" tone="amber" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/50">비어 있음</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="frosted p-4 space-y-2">
        <p className="text-sm text-white/70">미배치</p>
        {waiting.length === 0 ? (
          <p className="text-sm text-white/60">모두 배치되었습니다.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {waiting.map((p) => (
              <div key={p.id} className="rounded-xl border border-panel-border bg-white/5 p-3">
                <p className="font-display">{p.character.characterName}</p>
                <p className="text-xs text-white/60">
                  {p.character.jobGrowName} · 명성 {p.character.fame.toLocaleString()}
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                  <StatBadge label="딜" value={p.damage} unit="억" />
                  <StatBadge label="버프" value={p.buffPower} unit="만" tone="amber" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePage;
