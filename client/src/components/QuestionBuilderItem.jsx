// client/src/components/QuestionBuilderItem.jsx
import React from 'react';

// --- 1. Sub-componente: Renderizado de la Previsualización ---

/**
 * Muestra una previsualización simple del tipo de campo de respuesta.
 */
const getPlaceholderInput = (questionType) => {
 const commonStyle = { 
 width: '100%', 
 padding: '8px 12px', 
 border: '1px solid #ccc', 
 borderRadius: 6, 
 boxSizing: 'border-box',
 marginBottom: 8,
 };
 
 switch (questionType) {
 case 'longtext':
 case 'address':
 return <textarea style={{ ...commonStyle, minHeight: 80 }} disabled placeholder="Respuesta de texto largo..." />;
 case 'bool':
 return (
 <div style={{ display: 'flex', gap: 16 }}>
 <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="radio" disabled /> Verdadero</label>
 <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input type="radio" disabled /> Falso</label>
 </div>
 );
 case 'scale':
 return (
 <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', maxWidth: 300 }}>
 {[1, 2, 3, 4, 5].map(n => (
 <label key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 12 }}>
 <input type="radio" disabled style={{ margin: 0 }} />
 {n}
 </label>
 ))}
 </div>
 );
 case 'rating':
 // Previsualización de estrellas (usando un emoji)
 return <div style={{ fontSize: 20, color: '#facc15' }}>⭐⭐⭐⭐⭐</div>;
 case 'number':
 return <input type="number" style={commonStyle} disabled placeholder="Escribe un número..." />;
 case 'date':
 return <input type="date" style={{ ...commonStyle, maxWidth: 200 }} disabled />;
 case 'time':
 return <input type="time" style={{ ...commonStyle, maxWidth: 150 }} disabled />;
 case 'email':
 return <input type="email" style={commonStyle} disabled placeholder="ejemplo@correo.com" />;
 case 'phone':
 return <input type="tel" style={commonStyle} disabled placeholder="+54 9 11 XXXX-XXXX" />;
 case 'matrix':
 case 'rank':
 return <p style={{ color: '#9ca3af' }}>Campo complejo, verás la estructura en el formulario final.</p>;
 case 'text':
 default:
 return <input type="text" style={commonStyle} disabled placeholder="Respuesta corta..." />;
 }
};


// --- 2. Sub-componente: Constructor de Opciones (Choices) ---

const ChoiceBuilder = ({ qid, question_type, choices, updateChoices }) => {

 // Tipos de pregunta que requieren opciones para ser mostradas
 const isChoiceBased = ['choice', 'multi', 'dropdown'].includes(question_type);
 // Tipos de pregunta que usan opciones como títulos (Matrix/Rank)
 const isHeaderBased = ['matrix', 'rank'].includes(question_type);

 let inputType = 'text'; // Por defecto para Matrix/Rank
 if (question_type === 'choice' || question_type === 'dropdown') inputType = 'radio';
 if (question_type === 'multi') inputType = 'checkbox';


 const addChoice = () => updateChoices(qid, [...choices, ""]);
 
 const updateChoiceText = (choiceIndex, value) => {
 const newChoices = choices.map((c, i) => (i === choiceIndex ? value : c));
 updateChoices(qid, newChoices);
 };

 const removeChoice = (choiceIndex) => {
 const newChoices = choices.filter((_, i) => i !== choiceIndex);
 updateChoices(qid, newChoices);
 };
 
 const effectiveChoices = choices.length === 0 ? [""] : choices;
 
 const labelText = isChoiceBased ? "Opciones de Respuesta" : "Elementos a Clasificar / Columnas de Matriz";
 const helperText = isChoiceBased 
 ? "Define las opciones que el usuario podrá seleccionar. Una por línea."
 : "Define los elementos principales de este campo. Uno por línea.";

 return (
 <div style={{ padding: '8px 0', borderLeft: '3px solid #6366f1', paddingLeft: 12, marginTop: 12 }}>
 <label style={{ fontWeight: 'bold', fontSize: 14 }}>{labelText}</label>
 <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>
 {helperText}
 </p>
 {effectiveChoices.map((choice, index) => (
 <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
 {(isChoiceBased && inputType !== 'text') && (
 <input type={inputType} disabled style={{ margin: 0 }} /> 
 )}
 
 <input
 className="auth-input"
 value={choice}
 onChange={(e) => updateChoiceText(index, e.target.value)}
 placeholder={`${isChoiceBased ? 'Opción' : 'Elemento'} ${index + 1}`}
 style={{ flexGrow: 1 }}
 />
 {choices.length > 1 && ( 
 <button
 type="button"
 onClick={() => removeChoice(index)}
 style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
 >
 X
 </button>
 )}
 </div>
 ))}
 <button
 type="button"
 onClick={addChoice}
 style={{
 border: 'none',
 background: '#e0e7ff',
 color: '#4f46e5',
 padding: '4px 8px',
 borderRadius: 6,
 cursor: 'pointer',
 fontSize: 13,
 marginTop: 4
 }}
 >
 + Añadir {isChoiceBased ? 'Opción' : 'Elemento'}
 </button>
 </div>
 );
};


// --- 3. Componente Principal: Item de la Pregunta ---

export default function QuestionBuilderItem({
 question,
 index,
 types,
 updateQuestion,
 updateChoices,
 removeQuestion,
 canRemove,
}) {
 const { id: qid, text, question_type, required, choices } = question;

 // Tipos que requieren el constructor de opciones (choices)
 const needsChoices = ['choice', 'multi', 'dropdown', 'matrix', 'rank'].includes(question_type);

 return (
 <div
 style={{
 marginBottom: 16,
 padding: 16,
 borderRadius: 12,
 border: "1px solid #e5e7eb",
 background: "#f9fafb",
 }}
 >
 <div
 style={{
 display: "flex",
 justifyContent: "space-between",
 marginBottom: 8,
 }}
 >
 <strong>Pregunta {index + 1}</strong>
 {canRemove && (
 <button
 type="button"
 onClick={() => removeQuestion(qid)}
 style={{
 border: "none",
 background: "transparent",
 color: "#ef4444",
 cursor: "pointer",
 fontSize: 13,
 }}
 >
 Eliminar
 </button>
 )}
 </div>

 <div className="auth-field">
 <label>Texto de la pregunta</label>
 <input
 className="auth-input"
 value={text}
 onChange={(e) => updateQuestion(qid, "text", e.target.value)}
 placeholder='Ej: "¿Cómo evaluás el clima laboral?"'
 />
 </div>

 {/* Previsualización del campo de respuesta */}
 <div style={{ marginTop: 8, marginBottom: 16, padding: 8, border: '1px dashed #d1d5db', borderRadius: 4 }}>
 <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
 Previsualización de la respuesta ({types.find(t => t.value === question_type)?.label}😞
 </p>
 {getPlaceholderInput(question_type)}
 </div>
 
 <div
 style={{
 display: "flex",
 gap: 16,
 flexWrap: "wrap",
 alignItems: "center",
 }}
 >
 <div className="auth-field" style={{ flex: "0 0 200px" }}>
 <label>Tipo</label>
 <select
 className="auth-input"
 value={question_type}
 onChange={(e) => updateQuestion(qid, "question_type", e.target.value)}
 >
 {types.map((type) => (
 <option key={type.value} value={type.value}>
 {type.label}
 </option>
 ))}
 </select>
 </div>

 <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <input
 type="checkbox"
 checked={required}
 onChange={(e) => updateQuestion(qid, "required", e.target.checked)}
 />
 Obligatoria
 </label>
 </div>
 
 {/* Constructor de opciones (Choices) */}
 {needsChoices && (
 <ChoiceBuilder 
 qid={qid}
 question_type={question_type}
 choices={choices}
 updateChoices={updateChoices}
 />
 )}
 </div>
 );
}