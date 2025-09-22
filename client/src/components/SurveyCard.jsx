import { useNavigate } from 'react-router-dom';



export function SurveyCard({ survey }) {

    const navigate = useNavigate();

  return (
   <div
  className="
    border border-gray-300  {/* borde gris suave */}
    rounded-md              {/* esquinas redondeadas (5px) */}
    m-1                     {/* margen pequeño */}
    p-3                     {/* padding interno */}
    bg-gray-50              {/* fondo gris claro */}
    cursor-pointer           {/* cursor tipo manito */}
    hover:bg-gray-100        {/* fondo un poco más notorio al pasar el mouse */}
    hover:border-gray-400    {/* borde más oscuro en hover */}
  "

      onClick={() => navigate(`/surveys/${survey.id}`)}

       
    >
      <h1 className='font-bold uppercase'>{survey.title}</h1>
      <p>{survey.description}</p>
      
    </div>
  );
}


