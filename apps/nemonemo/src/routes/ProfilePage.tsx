import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';

const ProfilePage = () => {
  const pushToast = useNotificationStore((state) => state.pushToast);

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
          <p>총 플레이: 0회</p>
          <p>평균 점수: 0점</p>
        </div>
      </section>
      <aside className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold">알림</h2>
        <p className="text-sm text-slate-400">알림 센터와 푸시 설정이 이 영역에 배치됩니다.</p>
      </aside>
    </div>
  );
};

export default ProfilePage;
