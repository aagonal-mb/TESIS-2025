import { useEffect, useState } from "react";
import { getQuestionsBySurvey } from "../api/questions.api";
import { QuestionCard } from "./QuestionCard";

export function QuestionsList({ surveyId }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    async function loadQuestions() {
      const res = await getQuestionsBySurvey(surveyId);
      setQuestions(res.data);
    }
    loadQuestions();
  }, [surveyId]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Questions</h2>
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}
