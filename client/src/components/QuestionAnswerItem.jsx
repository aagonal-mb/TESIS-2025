// client/src/components/QuestionAnswerItem.jsx
import React from 'react';

export default function QuestionAnswerItem({ question, currentResponse, onResponseChange }) {
    const { id, text, question_type, required, choices } = question;
    
    const handleChange = (value) => {
        onResponseChange(id, value);
    };

    // Asegúrate de que los choices sean un array, ya sea que vengan de Django como array o como string (ver SurveyDetailPage)
    const choiceOptions = Array.isArray(choices) ? choices : [];
    
    // Las respuestas múltiples (multi) se manejan como un string separado por ';'
    const currentMultiResponses = typeof currentResponse === 'string' ? currentResponse.split(';').filter(Boolean) : (Array.isArray(currentResponse) ? currentResponse : []);

    const handleMultiChange = (option) => {
        const newResponses = currentMultiResponses.includes(option)
            ? currentMultiResponses.filter(r => r !== option)
            : [...currentMultiResponses, option];
        
        // 💡 Enviar de vuelta como string separado por ;
        handleChange(newResponses.join(';')); 
    };

    let inputField;
    
    // --- Renderizado Condicional de los Inputs ---
    
    switch (question_type) {
        case 'text':
        case 'email':
        case 'number':
        case 'phone':
            const inputType = question_type === 'text' ? 'text' : question_type;
            inputField = (
                <input
                    type={inputType}
                    className="auth-input"
                    value={currentResponse || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    required={required}
                />
            );
            break;

        case 'longtext':
        case 'address':
            inputField = (
                <textarea
                    className="auth-input"
                    rows={4}
                    value={currentResponse || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    required={required}
                />
            );
            break;
            
        case 'date':
        case 'time':
            inputField = (
                <input
                    type={question_type}
                    className="auth-input"
                    value={currentResponse || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    required={required}
                />
            );
            break;

        case 'bool':
            inputField = (
                <div style={{ display: 'flex', gap: 24 }}>
                    {['True', 'False'].map(val => (
                        <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                                type="radio"
                                name={`q-${id}`}
                                value={val}
                                checked={currentResponse === val}
                                onChange={() => handleChange(val)}
                                required={required}
                            />
                            {val === 'True' ? 'Verdadero' : 'Falso'}
                        </label>
                    ))}
                </div>
            );
            break;
            
        case 'scale':
        case 'rating':
            inputField = (
                <div style={{ display: 'flex', gap: 12 }}>
                    {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name={`q-${id}`}
                                value={val}
                                checked={parseInt(currentResponse) === val}
                                onChange={() => handleChange(val.toString())}
                                required={required}
                            />
                            {question_type === 'rating' ? (
                                <span style={{ fontSize: 20, color: '#facc15' }}>★</span>
                            ) : (
                                <span>{val}</span>
                            )}
                        </label>
                    ))}
                </div>
            );
            break;

        case 'choice': 
        case 'dropdown': 
            if (question_type === 'dropdown') {
                 inputField = (
                    <select
                        className="auth-input"
                        value={currentResponse || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        required={required}
                    >
                        <option value="">Selecciona una opción</option>
                        {choiceOptions.map((option, idx) => (
                            <option key={idx} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            } else { // 'choice' (Radio Buttons)
                inputField = (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {choiceOptions.map((option, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="radio"
                                    name={`q-${id}`}
                                    value={option}
                                    checked={currentResponse === option}
                                    onChange={() => handleChange(option)}
                                    required={required}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                );
            }
            break;
            
        case 'multi': // Selección Múltiple (Checkboxes)
            inputField = (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {choiceOptions.map((option, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="checkbox"
                                name={`q-${id}`}
                                value={option}
                                checked={currentMultiResponses.includes(option)}
                                onChange={() => handleMultiChange(option)}
                            />
                            {option}
                        </label>
                    ))}
                 </div>
            );
            break;
            
        case 'matrix':
        case 'rank':
            inputField = <div className="text-gray-500 italic">Campo complejo: {question_type} (Requiere componente especializado)</div>;
            break;
            
        default:
            inputField = <div className="text-red-500">Tipo de pregunta no soportado.</div>;
    }


    return (
        <div style={{ 
            marginBottom: 32, 
            padding: 16, 
            border: "1px solid #ddd", 
            borderRadius: 8,
            color: '#1f2937'
        }}>
            <label className="font-bold text-lg mb-2 block">
                {text} {required && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <div className="mt-2">
                {inputField}
            </div>
        </div>
    );
}