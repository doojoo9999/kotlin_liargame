const AdminDashboardPage = () => {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">관리자 콘솔</h1>
        <p className="text-sm text-slate-400">
          퍼즐 검토 큐, OFFICIAL 승격, 신고 처리, 통계 대시보드가 이 영역에 배치될 예정입니다.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold">검토 대기</h2>
          <p className="mt-2 text-sm text-slate-400">현재 0개의 퍼즐이 검토를 기다리고 있습니다.</p>
        </section>
        <section className="rounded border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold">신고 큐</h2>
          <p className="mt-2 text-sm text-slate-400">신고 접수 및 처리 현황이 여기에 표시됩니다.</p>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
