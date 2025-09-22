import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-50 h-screen bg-gray-100 border-r border-gray-300 p-4">
      <h1 className="text-xl font-bold mb-5">TESIS</h1>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link
              to="/surveys"
              className="block p-2 rounded-md hover:bg-gray-200 hover:border hover:border-gray-400"
            >
              Surveys
            </Link>
            <ul className="ml-4 mt-1 space-y-1">
              <li>
                <Link
                  to="/surveys/new"
                  className="block p-2 rounded-md hover:bg-gray-200 hover:border hover:border-gray-400"
                >
                  + New Survey
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}