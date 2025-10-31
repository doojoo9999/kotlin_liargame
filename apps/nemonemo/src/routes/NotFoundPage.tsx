import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-sm text-slate-400">요청하신 페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        홈으로 돌아가기
      </Link>
    </div>
  );
};

export default NotFoundPage;
