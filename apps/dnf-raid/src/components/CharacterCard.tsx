import {ArrowRight} from "lucide-react";
import {DnfCharacter} from "../types";
import {clsx} from "clsx";

type Props = {
  character: DnfCharacter;
  highlight?: boolean;
  actionLabel?: string;
  onAction?: (character: DnfCharacter) => void;
  subtitle?: string;
};

export function CharacterCard({character, highlight, actionLabel = "신청하기", onAction, subtitle}: Props) {
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
          <div className="pill">서버 {character.serverId}</div>
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
