import {useState} from "react";
import {KanbanSquare, PlugZap, Shield} from "lucide-react";
import type {DnfCharacter, Participant, PartyNumber, SlotIndex} from "../types";
import {StatBadge} from "./StatBadge";
import {clsx} from "clsx";

type Props = {
  participants: Participant[];
  partyCount?: number;
  slotsPerParty?: number;
  unassignedParticipants?: Participant[];
  activeRaidId?: string | null;
  onAssign: (participantId: string, partyNumber: PartyNumber, slotIndex: SlotIndex) => void;
};

const BUFFER_KEYWORDS = ["크루세이더", "인챈트리스", "뮤즈", "패러메딕"];

const normalizeAdventureName = (value?: string | null) => value?.trim().toLowerCase() ?? "";
const PARTY_LABELS = ["레드", "옐로", "그린", "블루"];

const getPartyLabel = (partyNumber: number, totalCount: number) => {
  if (totalCount === 2) return PARTY_LABELS[partyNumber - 1] ?? `파티 ${partyNumber}`;
  if (totalCount >= 3) return PARTY_LABELS[partyNumber - 1] ?? `파티 ${partyNumber}`;
  return `파티 ${partyNumber}`;
};

function isBufferJob(character: DnfCharacter) {
  const normalize = (value?: string | null) => value?.toLowerCase().replace(/\s+/g, "") ?? "";
  const job = normalize(character.jobName);
  const grow = normalize(character.jobGrowName);
  return BUFFER_KEYWORDS.some((keyword) => job.includes(keyword) || grow.includes(keyword));
}

function ParticipantChip({
  participant,
  draggable,
  onDragStart,
}: {
  participant: Participant;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
}) {
  const isBuffer = isBufferJob(participant.character);

  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart?.(participant.id)}
      className={clsx(
        "flex items-center justify-between gap-3 rounded-xl border border-panel-border bg-panel px-3 py-2 text-xs shadow-soft",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex flex-col min-w-0 gap-0.5">
        <span className="text-[10px] text-text-subtle truncate">
          {participant.character.adventureName ?? ""}
        </span>
        <p className="font-display text-[13px] truncate">{participant.character.jobGrowName}</p>
        <span className="text-[11px] text-text-muted truncate">
          {participant.character.characterName}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-text-muted">
        {!isBuffer && <StatBadge label="딜" value={participant.damage} unit="억" />}
        {isBuffer && <StatBadge label="버프" value={participant.buffPower} unit="만" tone="amber" />}
      </div>
    </div>
  );
}

export function PartyBoard({
  participants,
  unassignedParticipants,
  activeRaidId,
  onAssign,
  partyCount = 3,
  slotsPerParty = 4,
}: Props) {
  const [draggingParticipant, setDraggingParticipant] = useState<Participant | null>(null);
  const [duplicateAdventureCharacterName, setDuplicateAdventureCharacterName] = useState<string | null>(null);
  const [crossRaidCharacterName, setCrossRaidCharacterName] = useState<string | null>(null);

  const partyNumbers = Array.from({length: partyCount}, (_, idx) => idx + 1);
  const partySlots: Record<number, Array<Participant | null>> = {};
  const defaultUnassigned: Participant[] = [];

  partyNumbers.forEach((partyNumber) => {
    partySlots[partyNumber] = Array.from({length: slotsPerParty}, () => null);
  });

  participants.forEach((p) => {
    if (p.partyNumber && p.slotIndex !== null && p.slotIndex !== undefined) {
      const party = partySlots[p.partyNumber];
      if (party && p.slotIndex < party.length && party[p.slotIndex] === null) {
        party[p.slotIndex] = p;
        return;
      }
    }
    defaultUnassigned.push(p);
  });

  const unassignedSource =
    unassignedParticipants && unassignedParticipants.length > 0
      ? unassignedParticipants
      : defaultUnassigned;
  // Only surface applicants that belong to the currently selected raid so everything in the list is draggable.
  const unassigned = activeRaidId
    ? unassignedSource.filter((p) => p.raidId === activeRaidId)
    : unassignedSource;

  const handleDrop = (partyNumber: PartyNumber, slotIndex: SlotIndex) => {
    if (!draggingParticipant) return;
    const draggedParticipant = draggingParticipant;

    const draggedAdventure = normalizeAdventureName(draggedParticipant.character.adventureName);
    if (draggedAdventure) {
      const duplicated = participants.find(
        (p) =>
          p.id !== draggedParticipant.id &&
          p.partyNumber &&
          normalizeAdventureName(p.character.adventureName) === draggedAdventure
      );

      if (duplicated) {
        setDuplicateAdventureCharacterName(duplicated.character.characterName);
        setDraggingParticipant(null);
        return;
      }
    }

    if (activeRaidId && draggedParticipant.raidId !== activeRaidId) {
      setCrossRaidCharacterName(draggedParticipant.character.characterName);
      setDraggingParticipant(null);
      return;
    }

    onAssign(draggedParticipant.id, partyNumber, slotIndex);
    setDraggingParticipant(null);
  };

  const handleUnassign = () => {
    if (!draggingParticipant) return;
    if (activeRaidId && draggingParticipant.raidId !== activeRaidId) {
      setCrossRaidCharacterName(draggingParticipant.character.characterName);
      setDraggingParticipant(null);
      return;
    }
    onAssign(draggingParticipant.id, null, null);
    setDraggingParticipant(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      <div
        className={clsx(
          "frosted p-4 space-y-3",
          draggingParticipant && "border border-dashed border-primary/50"
        )}
        onDrop={(e) => {
          e.preventDefault();
          handleUnassign();
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 text-text-muted">
          <KanbanSquare className="h-4 w-4 text-primary" />
          <p className="font-display text-lg">미배치</p>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {unassigned.length === 0 && (
            <p className="text-sm text-text-subtle">미배치 인원이 없습니다.</p>
          )}
          {unassigned.map((p) => (
            <ParticipantChip
              key={p.id}
              participant={p}
              draggable={activeRaidId ? p.raidId === activeRaidId : true}
              onDragStart={() => setDraggingParticipant(p)}
            />
          ))}
        </div>
      </div>

      <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        {partyNumbers.map((partyNumber) => {
          const slots = partySlots[partyNumber];
          const hasBuffer = slots.some((slot) => slot?.buffPower && slot.buffPower > 0);
          const label = getPartyLabel(partyNumber, partyCount);
          const colorClass =
            label === "레드"
              ? "text-rose-600"
              : label === "옐로"
                ? "text-amber-600"
                : label === "그린"
                  ? "text-emerald-600"
                  : "text-text-muted";
          return (
            <div key={partyNumber} className="frosted p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={clsx("text-sm font-display", colorClass)}>{label} 파티</p>
                  <p className="font-display text-xl text-text">포지션</p>
                </div>
                {!hasBuffer && (
                  <span className="pill border-amber-200 text-amber-700 bg-amber-50">
                    <Shield className="h-4 w-4" />
                    버퍼 없음
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {slots.map((slot, idx) => (
                  <div
                    key={`${partyNumber}-${idx}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(partyNumber as PartyNumber, idx as SlotIndex);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className={clsx(
                      "rounded-xl border p-2 min-h-[88px] transition shadow-soft",
                      slot ? "border-panel-border bg-panel" : "border-dashed border-panel-border/80 bg-panel",
                      draggingParticipant && "bg-primary-muted"
                    )}
                  >
                    {slot ? (
                      <ParticipantChip
                        participant={slot}
                        draggable
                        onDragStart={() => setDraggingParticipant(slot)}
                      />
                    ) : (
                      <div className="flex h-full min-h-[72px] items-center justify-center text-[11px] text-text-subtle">
                        드래그하여 배치
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-text-subtle">
                <PlugZap className="h-4 w-4 text-primary" />
                슬롯을 클릭하지 않아도 드래그 앤 드롭으로 바로 배치됩니다.
              </div>
            </div>
          );
        })}
      </div>

      {duplicateAdventureCharacterName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-panel-border bg-panel shadow-card space-y-4 p-5">
            <div className="space-y-1">
              <p className="font-display text-lg text-text">이미 배치된 모험단입니다.</p>
              <p className="text-sm text-text-muted">
                배치된 캐릭터명 : {duplicateAdventureCharacterName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateAdventureCharacterName(null)}
              className="w-full rounded-xl bg-primary text-white border border-primary py-3 shadow-soft hover:bg-primary-dark transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {crossRaidCharacterName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-panel-border bg-panel shadow-card space-y-4 p-5">
            <div className="space-y-1">
              <p className="font-display text-lg text-text">다른 기수 신청자입니다.</p>
              <p className="text-sm text-text-muted">
                현재 선택된 기수에서 신청한 인원만 배치할 수 있습니다.
              </p>
              <p className="text-sm text-text-muted">캐릭터명 : {crossRaidCharacterName}</p>
            </div>
            <button
              type="button"
              onClick={() => setCrossRaidCharacterName(null)}
              className="w-full rounded-xl bg-primary text-white border border-primary py-3 shadow-soft hover:bg-primary-dark transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
