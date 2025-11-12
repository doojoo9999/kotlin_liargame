import { Link, NavLink } from 'react-router-dom';
import { useMemo } from 'react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', label: '홈' },
  { to: '/search', label: '검색' },
  { to: '/leaderboard', label: '랭킹' },
  { to: '/community', label: '커뮤니티' },
  { to: '/multiplayer', label: '멀티' },
  { to: '/editor', label: '에디터' },
  { to: '/profile', label: '프로필' }
];

const Header = () => {
  const items = useMemo(() => navItems, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between gap-6 px-6">
        <Link to="/" className="text-lg font-bold tracking-tight">
          Nemonemo
        </Link>
        <nav className="hidden gap-4 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx('rounded px-3 py-1 text-sm font-medium transition-colors', {
                  'bg-primary text-primary-foreground shadow': isActive,
                  'text-slate-300 hover:text-white': !isActive
                })
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/editor"
            className="rounded-md border border-primary px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            퍼즐 만들기
          </Link>
          <button className="rounded-md border border-slate-700 px-3 py-1 text-sm hover:border-primary">
            로그인
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
