import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import {
  useAchievementSummary,
  useChallengeSummary,
  useSeasonPassProgress
} from '@/features/challenges/useChallengeSummary';
import { useNotifications } from '@/features/notifications/useNotifications';

const ProfilePage = () => {
  const pushToast = useNotificationStore((state) => state.pushToast);
  const { data: achievements } = useAchievementSummary();
  const { data: challenges } = useChallengeSummary();
  const { data: season } = useSeasonPassProgress();
  const { data: notifications } = useNotifications();

  useEffect(() => {
    pushToast({ title: '게스트 계정 준비 완료', description: '나의 업적과 시즌 패스를 확인할 수 있습니다.' });
  }, [pushToast]);

  return (
    <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
      <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h1 className="text-2xl font-semibold">내 프로필</h1>
        <div className="rounded border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
          <p>닉네임: 게스트</p>
          <p>Anon ID: <code className="font-mono">{localStorage.getItem('anon_id') ?? '발급 준비 중'}</code></p>
          <p>획득한 업적: {achievements?.length ?? 0}개</p>
          <p>진행 중인 도전 과제: {challenges?.filter((challenge) => !challenge.completed).length ?? 0}개</p>
          <p>시즌 패스 레벨: {season?.tierLevel ?? 0}</p>
        </div>
      </section>
      <aside className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold">알림</h2>
        <div className="space-y-3 text-sm text-slate-300">
          {(notifications ?? []).map((notification) => (
            <article
              key={notification.id}
              className="rounded border border-slate-800 bg-slate-950/60 p-3"
            >
              <header className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>{notification.type}</span>
                <time>{new Date(notification.createdAt).toLocaleString()}</time>
              </header>
              <h3 className="mt-1 text-sm font-semibold text-slate-100">{notification.title}</h3>
              <p className="text-xs text-slate-400">{notification.message}</p>
            </article>
          ))}
          {notifications?.length === 0 && (
            <p className="text-sm text-slate-400">아직 도착한 알림이 없습니다.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ProfilePage;
