import {X} from "lucide-react";
import type {CohortPreference, DnfCharacter} from "../types";
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
  actionLabel?: string;
  showDamage?: boolean;
  showBuff?: boolean;
  cohortPreference?: CohortPreference | null;
  onChangeCohortPreference?: (value: CohortPreference | null) => void;
  showCohortPreference?: boolean;
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
  actionLabel = "이 캐릭터로 지원하기",
  showDamage = true,
  showBuff = true,
  cohortPreference = null,
  onChangeCohortPreference,
  showCohortPreference = false,
}: Props) {
  const gridCols = showDamage && showBuff ? "md:grid-cols-2" : "md:grid-cols-1";

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

          <div className={`grid gap-3 ${gridCols}`}>
            {showDamage && (
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">딜 (억 단위)</span>
                <input
                  value={damage}
                  onChange={(e) => onChangeDamage(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="예: 1200 (억)"
                />
              </label>
            )}
            {showBuff && (
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">버프력 (만 단위)</span>
                <input
                  value={buff}
                  onChange={(e) => onChangeBuff(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="예: 550 (만)"
                />
              </label>
            )}
          </div>

          {showCohortPreference && onChangeCohortPreference && (
            <div className="space-y-2 text-sm">
              <p className="text-text-muted">배치 선호도</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {label: "상관없음", value: null},
                  {label: "앞기수 선호", value: "FRONT" as CohortPreference | null},
                  {label: "뒷기수 선호", value: "BACK" as CohortPreference | null},
                ].map((option) => {
                  const isActive = cohortPreference === option.value;
                  return (
                    <button
                      type="button"
                      key={option.label}
                      onClick={() => onChangeCohortPreference(option.value)}
                      className={`rounded-lg border px-2 py-2 text-sm transition ${
                        isActive
                          ? "border-primary bg-primary-muted text-primary"
                          : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-text-subtle">여러 기수가 있을 때 자동 배치가 선호 기수를 먼저 고려합니다.</p>
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-xl bg-primary text-white border border-primary py-3 shadow-soft hover:bg-primary-dark transition disabled:opacity-60"
          >
            {isSubmitting ? "지원 중..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
