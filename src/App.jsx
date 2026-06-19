import { useState, useCallback } from 'react';
import './App.css';

function App() {
  const [sharedPrompt, setSharedPrompt] = useState('');
  const [responses, setResponses] = useState({
    ollama: '',
    qwen: '',
    tinyllama: ''
  });
  const [loading, setLoading] = useState({
    ollama: false,
    qwen: false,
    tinyllama: false
  });
  const [responseOrder, setResponseOrder] = useState([]);

  const models = [
    { id: 'tinyllama', name: 'Ollama(tinyllama:1.1b)', color: '#2f139e' },
    { id: 'qwen', name: 'Ollama (qwen2.5:0.5b)', color: '#2f139e' },
    { id: 'ollama', name: 'Ollama (gemma 3:1b)', color: '#2f139e' }
  ];

  const handlePromptChange = useCallback((value) => {
    setSharedPrompt(value);
  }, []);

  const fetchModelResponse = useCallback(async (model, prompt) => {
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const response = await fetch(`http://localhost:8080/api/${model}/${encodedPrompt}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.text();
      return data;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!sharedPrompt.trim()) return;
    
    // Set all models to loading
    setLoading({
      ollama: true,
      qwen: true,
      tinyllama: true
    });
    
    // Initialize all responses as loading
    setResponses({
      ollama: 'Loading...',
      qwen: 'Loading...',
      tinyllama: 'Loading...'
    });
    
    // Process each model independently
    models.forEach(model => {
      fetchModelResponse(model.id, sharedPrompt)
        .then(response => {
          // Update this specific model's response
          setResponses(prev => ({
            ...prev,
            [model.id]: response
          }));
          
          // Add this model to the response order
          //setResponseOrder(prev => [...prev, model.id]);
          
          // Set this model's loading state to false
          setLoading(prev => ({
            ...prev,
            [model.id]: false
          }));
        })
        .catch(error => {
          // Handle errors for this specific model
          setResponses(prev => ({
            ...prev,
            [model.id]: `Error: ${error.message}`
          }));
          
          setLoading(prev => ({
            ...prev,
            [model.id]: false
          }));
        });
    });
  }, [sharedPrompt, fetchModelResponse, models]);

  const isLoading = Object.values(loading).some(status => status);
  
  return (
    <div className="app-container">
      <h1>LLM Models Comparator</h1>
      
      <div className="shared-prompt-container">
        <div className="shared-prompt-area">
          <textarea
            placeholder="Enter a prompt to send to all models..."
            value={sharedPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            disabled={isLoading}
          />
          
          <button 
            onClick={handleSubmit}
            disabled={isLoading || !sharedPrompt.trim()}
            className="submit-all-btn"
          >
            {isLoading ? 'Sending...' : 'Compare All Models'}
          </button>
        </div>
      </div>
      
      
      <div className="model-grid">
        {models.map(model => (
          <div 
            key={model.id} 
            className="model-box"
            style={{ 
              borderColor: model.color,
              // Highlight the fastest model
              boxShadow: responseOrder[0] === model.id ? `0 0 15px ${model.color}` : 'none'
            }}
          >
            <h2 style={{ color: model.color }}>
              {model.name}
              {responseOrder.includes(model.id) && (
                <span className="response-badge">
                  {responseOrder.indexOf(model.id) + 1}
                </span>
              )}
            </h2>
            
            <div className="response-area">
              <h3>Response:</h3>
              <div className="response-content">
                {responses[model.id] ? (
                  <div className="response-text">{responses[model.id]}</div>
                ) : (
                  <div className="placeholder-text">Response will appear here</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;