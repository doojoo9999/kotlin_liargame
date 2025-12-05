import {useState} from "react";
import {KanbanSquare, PlugZap, Shield} from "lucide-react";
import type {Participant, PartyNumber, SlotIndex} from "../types";
import {StatBadge} from "./StatBadge";
import {clsx} from "clsx";

type Props = {
  participants: Participant[];
  onAssign: (participantId: string, partyNumber: PartyNumber, slotIndex: SlotIndex) => void;
};

const partyLabels: Record<number, string> = {
  1: "파티 1",
  2: "파티 2",
  3: "파티 3",
};

function ParticipantChip({
  participant,
  draggable,
  onDragStart,
}: {
  participant: Participant;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart?.(participant.id)}
      className="rounded-xl border border-panel-border bg-white/5 px-3 py-2 text-sm space-y-1 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display">{participant.character.characterName}</p>
        <span className="text-[11px] text-white/60">{participant.character.jobGrowName}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-white/70">
        <StatBadge label="딜" value={participant.damage} unit="억" />
        <StatBadge label="버프" value={participant.buffPower} unit="만" tone="amber" />
      </div>
    </div>
  );
}

export function PartyBoard({participants, onAssign}: Props) {
  const [dragging, setDragging] = useState<string | null>(null);

  const unassigned = participants.filter((p) => !p.partyNumber);
  const partySlots: Record<number, Array<Participant | null>> = {
    1: [null, null, null, null],
    2: [null, null, null, null],
    3: [null, null, null, null],
  };

  participants.forEach((p) => {
    if (p.partyNumber && p.slotIndex !== null && p.slotIndex !== undefined) {
      const party = partySlots[p.partyNumber];
      if (party && party[p.slotIndex] === null) {
        party[p.slotIndex] = p;
      }
    }
  });

  const handleDrop = (partyNumber: PartyNumber, slotIndex: SlotIndex) => {
    if (!dragging) return;
    onAssign(dragging, partyNumber, slotIndex);
    setDragging(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      <div className="frosted p-4 space-y-3">
        <div className="flex items-center gap-2 text-white/70">
          <KanbanSquare className="h-4 w-4 text-neon-cyan" />
          <p className="font-display text-lg">미배치</p>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {unassigned.length === 0 && (
            <p className="text-sm text-white/60">미배치 인원이 없습니다.</p>
          )}
          {unassigned.map((p) => (
            <ParticipantChip
              key={p.id}
              participant={p}
              draggable
              onDragStart={(id) => setDragging(id)}
            />
          ))}
        </div>
      </div>

      <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((partyNumber) => {
          const slots = partySlots[partyNumber];
          const hasBuffer = slots.some((slot) => slot?.buffPower && slot.buffPower > 0);
          return (
            <div key={partyNumber} className="frosted p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">{partyLabels[partyNumber]}</p>
                  <p className="font-display text-xl">포지션</p>
                </div>
                {!hasBuffer && (
                  <span className="pill border-amber-400/60 text-amber-200 bg-amber-400/10">
                    <Shield className="h-4 w-4" />
                    버퍼 없음
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {slots.map((slot, idx) => (
                  <div
                    key={`${partyNumber}-${idx}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(partyNumber as PartyNumber, idx as SlotIndex);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className={clsx(
                      "rounded-xl border border-dashed border-panel-border p-3 min-h-[110px] transition",
                      dragging ? "bg-white/5" : "bg-white/[0.02]"
                    )}
                  >
                    <p className="text-xs text-white/60 mb-1">슬롯 {idx + 1}</p>
                    {slot ? (
                      <ParticipantChip participant={slot} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/50">
                        드래그하여 배치
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-white/60">
                <PlugZap className="h-4 w-4 text-neon-cyan" />
                슬롯을 클릭하지 않아도 드래그 앤 드롭으로 바로 배치됩니다.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
