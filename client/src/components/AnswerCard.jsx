// client/src/components/AnswerCard.jsx
import { useNavigate } from "react-router-dom";

// Función auxiliar para formatear la respuesta visualmente
const formatResponse = (response, type) => {
 if (!response) {
 return <span className="text-gray-400 italic">Sin respuesta</span>;
 }
 
 // Aquí puedes agregar los tipos más complejos para una mejor visualización
 switch (type) {
 case "bool":
 // Asume que la respuesta es "True" o "False"
 const isTrue = response.toLowerCase() === 'true';
 return (
 <span 
 className={`font-semibold text-sm py-0.5 px-2 rounded-full ${isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
 >
 {isTrue ? 'Verdadero ✅' : 'Falso ❌'}
 </span>
 );

 case "scale":
 case "rating":
 // Convierte la respuesta a número y muestra estrellas o escala
 const value = parseInt(response);
 if (isNaN(value)) return response;
 
 if (type === "rating") {
 // Muestra estrellas (⭐⭐⭐)
 return <span className="text-yellow-500">{'★'.repeat(value)}{'☆'.repeat(5 - value)} ({value}/5)</span>;
 } else {
 // Muestra solo el valor de la escala con un badge
 return (
 <span className="font-bold text-lg text-blue-600 bg-blue-50 py-0.5 px-2 rounded-md">
 {value}
 </span>
 );
 }
 
 case "date":
 // Formatea la fecha
 try {
 const date = new Date(response);
 return date.toLocaleDateString(); // Muestra la fecha en formato local
 } catch (e) {
 return response;
 }

 case "longtext":
 case "address":
 // Muestra un extracto y un ícono para indicar texto largo
 const excerpt = response.substring(0, 100) + (response.length > 100 ? '...' : '');
 return (
 <p className="text-sm italic border-l-2 pl-2 border-gray-300 whitespace-pre-wrap">
 "{excerpt}"
 </p>
 );
 
 case "multi":
 case "choice":
 case "dropdown":
 // Asume que las opciones vienen separadas por ";" o "," (adaptar según tu backend)
 const options = response.split(/;|,/g).filter(o => o.trim() !== '');
 return (
 <div className="flex flex-wrap gap-2 mt-1">
 {options.map((option, index) => (
 <span 
 key={index} 
 className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full font-medium"
 >
 {option.trim()}
 </span>
 ))}
 </div>
 );

 case "number":
 return <span className="font-mono text-base text-gray-700">{response}</span>;

 default:
 // text, email, phone, time, matrix, rank, other, etc.
 return <p className="text-sm whitespace-pre-wrap">{response}</p>;
 }
};


export function AnswerCard({ answer }) {
 const navigate = useNavigate();

 // Asegúrate de que 'answer' tenga 'question_type'. Si no lo tiene, deberás modificar 
 // la llamada a la API en AnswersList.jsx para que incluya los datos de la pregunta.
 const responseContent = formatResponse(answer.response, answer.question_type);
 
 // Si tu API no devuelve el 'question_type' en el objeto 'answer', 
 // el componente AnswersList deberá obtener la pregunta (y su tipo) primero.

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
 <h3 className="font-bold">Respuesta #{answer.id}</h3>
 
 {/* 💡 AQUÍ SE INSERTA LA RESPUESTA FORMATEADA */}
 <div className="mt-2">
 {responseContent}
 </div>

 <p className="text-xs text-gray-500 mt-2">Usuario: {answer.user}</p>
 </div>
 );
}