import {X} from "lucide-react";
import {DnfCharacter} from "../types";
import {getServerName} from "../constants";

type Props = {
  character: DnfCharacter;
  damage: string;
  buff: string;
  onChangeDamage: (value: string) => void;
  onChangeBuff: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
};

export function SupportModal({
  character,
  damage,
  buff,
  onChangeDamage,
  onChangeBuff,
  onSubmit,
  onClose,
  isSubmitting = false,
  canSubmit = true,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-panel-border bg-panel shadow-card">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-text-subtle hover:text-text"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-panel-border bg-panel-muted">
              <img
                src={character.imageUrl}
                alt={character.characterName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="font-display text-lg text-text">{character.characterName}</p>
              <p className="text-sm text-text-subtle">
                {character.jobGrowName} · 명성 {character.fame.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">
                모험단 {character.adventureName ?? "-"} · 서버 {getServerName(character.serverId)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">딜 (억 단위)</span>
              <input
                value={damage}
                onChange={(e) => onChangeDamage(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="예: 1200 (억)"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">버프력 (만 단위)</span>
              <input
                value={buff}
                onChange={(e) => onChangeBuff(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="예: 550 (만)"
              />
            </label>
          </div>

          <button
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-xl bg-primary text-white border border-primary py-3 shadow-soft hover:bg-primary-dark transition disabled:opacity-60"
          >
            {isSubmitting ? "지원 중..." : "이 캐릭터로 지원하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
