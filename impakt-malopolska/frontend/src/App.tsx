import { MotionConfig } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { SiteNav } from "./components/SiteNav";
import { IssuesProvider } from "./lib/issues-context";
import { AuthProvider } from "./lib/auth-context";
import { HomePage } from "./pages/HomePage";
import { IssueDetailPage } from "./pages/IssueDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { SlidesPage } from "./pages/SlidesPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  const { pathname } = useLocation();

  // Slajdy do wydruku — bez nawigacji i bez danych z API.
  if (pathname === "/slajdy") return <SlidesPage />;

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <IssuesProvider>
          <SiteNav />
          <main className="flex flex-1 flex-col">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/zgloszenie/:id" element={<IssueDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/logowanie" element={<LoginPage />} />
            </Routes>
          </main>
        </IssuesProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
