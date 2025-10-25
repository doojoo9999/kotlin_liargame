import {NavLink, Route, Routes} from "react-router-dom";
import AdminKeyPanel from "./components/AdminKeyPanel";
import DashboardPage from "./pages/DashboardPage";
import MembersPage from "./pages/MembersPage";
import BossesPage from "./pages/BossesPage";
import BossKillsPage from "./pages/BossKillsPage";
import ItemsPage from "./pages/ItemsPage";
import SalesPage from "./pages/SalesPage";
import ReportsPage from "./pages/ReportsPage";
import UploadPage from "./pages/UploadPage";
import ClanFundPage from "./pages/ClanFundPage";
import PolicyPage from "./pages/PolicyPage";
import EssencePage from "./pages/EssencePage";

const routes = [
  {path: "", label: "대시보드", element: <DashboardPage />},
  {path: "members", label: "혈원", element: <MembersPage />},
  {path: "bosses", label: "보스", element: <BossesPage />},
  {path: "boss-kills", label: "보스킬", element: <BossKillsPage />},
  {path: "items", label: "인벤토리", element: <ItemsPage />},
  {path: "sales", label: "정산", element: <SalesPage />},
  {path: "reports", label: "리포트", element: <ReportsPage />},
  {path: "clan-fund", label: "혈비", element: <ClanFundPage />},
  {path: "essence", label: "정수", element: <EssencePage />},
  {path: "policy", label: "정책", element: <PolicyPage />},
  {path: "upload", label: "업로드", element: <UploadPage />},
];

export default function App() {
  return (
    <div className="lineagew-container">
      <header style={{marginBottom: "2rem"}}>
        <h1 style={{fontSize: "2.5rem", marginBottom: "0.5rem"}}>LineageW 혈맹 재무 콘솔</h1>
        <p style={{color: "#cbd5f5", maxWidth: "56ch"}}>
          보스킬 기록부터 아이템 판매, 혈비 정산까지 한 화면에서 처리하고 운영 로그를 남깁니다.
          `docs/lineagew/linw.md` 절차를 그대로 옮겨 왔습니다.
        </p>
      </header>

      <AdminKeyPanel />

      <nav>
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={`/${route.path}`}
            className={({isActive}) => (isActive ? "active" : "")}
            end={route.path === ""}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={`/${route.path}`} element={route.element} />
        ))}
        <Route path="*" element={<DashboardPage />} />
      </Routes>
    </div>
  );
}
