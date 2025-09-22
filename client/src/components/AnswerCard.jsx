import { useNavigate } from "react-router-dom";

export function AnswerCard({ answer }) {
  const navigate = useNavigate();

  return (
    <div
      className="
        border border-gray-300
        rounded-md
        m-1
        p-3
        bg-gray-50
        cursor-pointer
        hover:bg-gray-100
        hover:border-gray-400
      "
      onClick={() => navigate(`/answers/${answer.id}`)}
    >
      <h3 className="font-bold">Answer #{answer.id}</h3>
      <p className="text-sm">Response: {answer.response}</p>
      <p className="text-xs text-gray-500">User: {answer.user}</p>
    </div>
  );
}
