import {ArrowRight} from "lucide-react";
import {clsx} from "clsx";
import type {DnfCharacter} from "../types";

type Props = {
  character: DnfCharacter;
  highlight?: boolean;
  actionLabel?: string;
  onAction?: (character: DnfCharacter) => void;
  subtitle?: string;
  onClickCalculatedDealer?: (character: DnfCharacter) => void;
};

export function CharacterCard({
  character,
  highlight,
  actionLabel = "신청하기",
  onAction,
  subtitle,
  onClickCalculatedDealer,
}: Props) {
  const hasDamage = character.damage != null && character.damage > 0;
  const hasBuff = character.buffPower != null && character.buffPower > 0;
  const hasCalculatedDealer = character.calculatedDealer != null && character.calculatedDealer > 0;
  const hasCalculatedBuffer = character.calculatedBuffer != null && character.calculatedBuffer > 0;

  const formatDamage = (value: number) => `${Math.round(value).toLocaleString()} 딜`;
  const formatBuff = (value: number) => `${Math.round(value).toLocaleString()} 버프`;

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-panel-border bg-panel shadow-card transition hover:-translate-y-1 hover:shadow-soft",
        highlight && "ring-2 ring-primary/40"
      )}
    >
      <div className="relative p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-panel-border bg-panel-muted">
            <img
              src={character.imageUrl}
              alt={character.characterName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <p className="card-title">{character.characterName}</p>
            <p className="text-sm text-text-muted">
              {character.jobName} · {character.jobGrowName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-text-muted">
          <div className="pill">명성 {character.fame.toLocaleString()}</div>
          {character.adventureName && <div className="pill">모험단 {character.adventureName}</div>}
          {hasDamage && <div className="pill bg-primary-muted text-primary">던담 {formatDamage(character.damage ?? 0)}</div>}
          {hasBuff && <div className="pill bg-amber-50 text-amber-700 border border-amber-200">던담 {formatBuff(character.buffPower ?? 0)}</div>}
          {hasCalculatedDealer && (
            <button
              type="button"
              onClick={() => onClickCalculatedDealer?.(character)}
              className="pill bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-100"
            >
              자체딜 {Math.round(character.calculatedDealer ?? 0).toLocaleString()}
            </button>
          )}
          {hasCalculatedBuffer && (
            <div className="pill bg-teal-50 text-teal-700 border border-teal-200">
              자체버프 {Math.round(character.calculatedBuffer ?? 0).toLocaleString()}
            </div>
          )}
        </div>

        {subtitle && <p className="text-text-muted text-sm">{subtitle}</p>}

        {onAction && (
          <button
            onClick={() => onAction(character)}
            className="group inline-flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-2 text-sm border border-primary shadow-soft hover:bg-primary-dark transition"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
