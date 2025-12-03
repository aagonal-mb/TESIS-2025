// client/src/components/FormattedAnswerDisplay.jsx
import React from 'react';

// Este componente da formato a la respuesta para su visualización en la tabla de resultados.
export default function FormattedAnswerDisplay({ response, questionType }) {
  if (!response || String(response).trim() === "") {
    return <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 14 }}>Sin respuesta</span>;
  }
  
  const baseStyle = { fontSize: 14 };

  switch (questionType) {
    case "bool":
      const isTrue = String(response).toLowerCase() === 'true';
      return (
        <span 
          style={{ 
            ...baseStyle, 
            fontWeight: 600, 
            padding: '2px 8px', 
            borderRadius: 9999, 
            // Estilos Tailwind-like convertidos a inline CSS
            background: isTrue ? '#d1fae5' : '#fee2e2', // bg-green-100 / bg-red-100
            color: isTrue ? '#065f46' : '#991b1b'        // text-green-700 / text-red-700
          }}
        >
          {isTrue ? 'Verdadero ✅' : 'Falso ❌'}
        </span>
      );

    case "scale":
    case "rating":
      const value = parseInt(response);
      if (isNaN(value)) return <span style={baseStyle}>{response}</span>;
      
      if (questionType === "rating") {
        // Muestra estrellas
        return (
          <span style={{ ...baseStyle, color: '#facc15' }}>
            {'★'.repeat(value)}{'☆'.repeat(5 - value)} ({value}/5)
          </span>
        );
      } else {
        // Muestra escala numérica
        return (
          <span style={{ 
            ...baseStyle, 
            fontWeight: 700, 
            color: '#3b82f6', 
            background: '#eff6ff', 
            padding: '2px 6px', 
            borderRadius: 4 
          }}>
            {value}
          </span>
        );
      }
      
    case "date":
      try {
        return <span style={baseStyle}>{new Date(response).toLocaleDateString()}</span>;
      } catch (e) {
        return <span style={baseStyle}>{response}</span>;
      }

    case "multi":
    case "choice":
    case "dropdown":
    case "rank":
    case "matrix": 
      // Lógica robusta para manejar strings de Python literal o strings separados por ;
      let options = [];
      try {
          // Intenta parsear el string como un array JSON (reemplazando comillas simples si vienen de Python)
          const parsed = JSON.parse(String(response).replace(/'/g, '"'));
          if (Array.isArray(parsed)) {
              options = parsed.filter(o => typeof o === 'string' && o.trim() !== '');
          } else {
              // Si no es un array JSON válido, intenta dividir por punto y coma (formato frontend)
              options = String(response).split(/;|,/g).filter(o => o.trim() !== '');
          }
      } catch (e) {
          // Si todo falla, intenta dividir por separador común
          options = String(response).split(/;|,/g).filter(o => o.trim() !== '');
          if (options.length === 0 && String(response).trim() !== "") {
              options = [String(response)]; // Si hay texto, tómalo como una sola respuesta
          }
      }

      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {options.map((option, index) => (
            <span 
              key={index} 
              style={{
                fontSize: 12, 
                padding: '3px 8px', 
                borderRadius: 9999, 
                fontWeight: 500,
                background: '#e0e7ff', 
                color: '#4f46e5',      
              }}
            >
              {option.trim()}
            </span>
          ))}
        </div>
      );
      
    case "longtext":
    case "address":
      const excerpt = String(response).substring(0, 100) + (String(response).length > 100 ? '...' : '');
      return <p style={{ ...baseStyle, margin: 0, fontStyle: 'italic', borderLeft: '2px solid #ccc', paddingLeft: 6, whiteSpace: 'pre-wrap' }}>{excerpt}</p>;

    default:
      // text, number, email, phone, time, other
      return <span style={baseStyle}>{response}</span>;
  }
}