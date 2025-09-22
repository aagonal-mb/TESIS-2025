export function QuestionCard({ question }) {
  return (
    <div
      className="
        border border-gray-300
        rounded-md
        m-1
        p-3
        bg-gray-50
        hover:bg-gray-100
        hover:border-gray-400
      "
    >
      <h2 className="font-bold">{question.text}</h2>
      <p className="text-sm text-gray-600">Type: {question.question_type}</p>
    </div>
  );
}
