import { useEffect, useState } from "react";
import { getAllSurveys } from '../api/surveys.api';
import { SurveyCard } from './SurveyCard';


export function SurveysList() {
    const [surveys, setSurveys] = useState([]);
   
    useEffect(() => {
        async function loadSurveys() {
            const res = await getAllSurveys();
            setSurveys(res.data);
        }
        loadSurveys();
    }, []);     

  return <div>
        
        {surveys.map(survey => (
            <div key={survey.id}>
                <SurveyCard survey={survey} />
            </div>
        ))}
    </div>
  ;
}