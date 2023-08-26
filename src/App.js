import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [prompt, setPrompt] = useState('moon');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageUrls, setImageUrls] = useState([]);

  const handleGenerate = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/generate-image`, {
        params: { prompt, negativePrompt },
        responseType: 'arraybuffer',
      });

      const blob = new Blob([response.data], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(blob);

      setImageUrls(prevImageUrls => [...prevImageUrls, imageUrl]);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };
  

  return (
    <div className="App">
      <div>
        <label>
          Prompt: <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Negative Prompt: <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
        </label>
      </div>
      <div>
        <button onClick={handleGenerate}>Generate Image</button>
      </div>
      <div>
        {imageUrls.map((url, index) => (
          <img key={index} src={url} alt={`Generated ${index}`} style={{ marginRight: '10px', width: '200px' }} />
        ))}
      </div>
    </div>
  );
}

export default App;
