import {AlertTriangle, Loader2, X} from "lucide-react";
import type {DamageCalculationDetail, DnfCharacter} from "../types";

type Props = {
  character: DnfCharacter;
  detail: DamageCalculationDetail | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
};

const integerFormat = new Intl.NumberFormat("ko-KR");
const decimalFormat = new Intl.NumberFormat("ko-KR", {maximumFractionDigits: 1, minimumFractionDigits: 1});

export function DamageDetailModal({character, detail, isLoading, error, onClose, onRetry}: Props) {
  const skills = detail?.dealer?.skills ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6">
      <div className="relative flex w-full max-w-2xl max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border border-panel-border bg-panel shadow-card">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-text-subtle hover:text-text"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                자체딜 {integerFormat.format(Math.round(character.calculatedDealer ?? 0))} · 계산 시각{" "}
                {detail ? new Date(detail.calculatedAt).toLocaleString() : "-"}
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-panel-border bg-panel-muted px-3 py-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              계산 결과를 불러오는 중입니다...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                계산 정보를 불러오지 못했습니다.
              </div>
              <p className="text-xs text-amber-900/80">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="pill border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && skills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">상위 스킬별 계산 (40초 기준 딜 점수)</p>
                {detail?.dealer && (
                  <span className="pill bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                    총 점수 {integerFormat.format(Math.round(detail.dealer.totalScore))}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {skills.map((skill, index) => (
                  <div
                    key={`${skill.name}-${skill.level}-${index}`}
                    className="rounded-xl border border-panel-border bg-panel-muted px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="pill bg-primary-muted text-primary text-xs">#{index + 1}</span>
                        <p className="font-medium text-text">
                          {skill.name} <span className="text-xs text-text-muted">Lv.{skill.level}</span>
                        </p>
                      </div>
                      <p className="text-sm text-text-muted">
                        기본쿨 {decimalFormat.format(skill.baseCd)}s → 실쿨 {decimalFormat.format(skill.realCd)}s
                      </p>
                    </div>
                    <div className="mt-1 grid gap-2 sm:grid-cols-3 text-xs text-text-muted">
                      <div>한 번: {integerFormat.format(Math.round(skill.singleDamage))}</div>
                      <div>40초 사용 횟수: {decimalFormat.format(skill.casts)}</div>
                      <div className="text-text">
                        40초 총딜: <span className="font-semibold">{integerFormat.format(Math.round(skill.score))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && skills.length === 0 && (
            <p className="rounded-xl border border-panel-border bg-panel-muted px-3 py-2 text-sm text-text-muted">
              계산된 스킬 정보가 없습니다. 다시 시도하거나 장착 정보를 새로고침해 주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
