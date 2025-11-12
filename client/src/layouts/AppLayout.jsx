import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar"; // Sidebar tiene export default

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white">
        <Sidebar />
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
