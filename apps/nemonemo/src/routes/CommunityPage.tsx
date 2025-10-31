const CommunityPage = () => {
  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">커뮤니티</h1>
        <p className="text-sm text-slate-400">공지, 이벤트, 팁과 토론이 모이는 전용 페이지입니다.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold">공지사항</h2>
          <p className="mt-2 text-sm text-slate-400">관리자 게시글이 이곳에 노출됩니다.</p>
        </section>
        <section className="rounded border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-semibold">커뮤니티 하이라이트</h2>
          <p className="mt-2 text-sm text-slate-400">이번 주 인기 작가와 작품을 소개합니다.</p>
        </section>
      </div>
    </div>
  );
};

export default CommunityPage;
