import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/Dashboard";
import { ReviewersPage } from "./pages/Reviewers";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="reviewers" element={<ReviewersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
