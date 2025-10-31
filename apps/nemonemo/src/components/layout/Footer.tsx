const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 py-6 text-sm text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Nemonemo. 모든 권리 보유.</p>
        <div className="flex gap-4">
          <a href="/docs/architecture" className="hover:text-white">
            아키텍처 문서
          </a>
          <a href="/docs/openapi" className="hover:text-white">
            API
          </a>
          <a href="/docs/testing" className="hover:text-white">
            테스트 전략
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
