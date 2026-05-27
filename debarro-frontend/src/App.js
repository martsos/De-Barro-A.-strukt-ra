import { ConfigProvider, theme } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ModulValaszto from "./pages/ModulValaszto";
import UzemanyagLayout from "./pages/uzemanyag/UzemanyagLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import UaDashboard from "./pages/uzemanyag/UaDashboard";
import Bevetelezesform from "./Bevetelezesform";
import Kiadasform from "./Kiadasform";
import Mozgasform from "./Mozgasform";
import Tranzakciok from "./Tranzakciok";
import Torzsadatok from "./Torzsadatok";

function App() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModulValaszto />} />
          <Route path="/uzemanyag" element={<UzemanyagLayout />}>
            <Route index element={<UaDashboard />} />
            <Route path="kiadas" element={<Kiadasform />} />
            <Route path="mozgas" element={<Mozgasform />} />
            <Route path="bevet" element={<Bevetelezesform />} />
            <Route path="elozmeny" element={<Tranzakciok />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="torzsadatok" element={<Torzsadatok />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
