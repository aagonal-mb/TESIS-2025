import { useEffect, useState } from "react";
import { getAnswersByQuestion } from "../api/answers.api";
import { AnswerCard } from "./AnswerCard";

export function AnswersList({ questionId }) {
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    async function loadAnswers() {
      const res = await getAnswersByQuestion(questionId);
      setAnswers(res.data);
    }
    loadAnswers();
  }, [questionId]);

  return (
    <div>
      <h3 className="text-md font-bold mb-2">Answers</h3>
      {answers.map((a) => (
        <AnswerCard key={a.id} answer={a} />
      ))}
    </div>
  );
}
