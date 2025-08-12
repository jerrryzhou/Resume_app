import './App.css';
import { useState } from 'react'

function Home() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTestChange = (e) => {
    setDescription(e.target.value);
  };

  const send = async(prompt) => {
    try {
      const response = await fetch('http://localhost:3000/ask-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });
    const data = await response.json();
    console.log(data.result);
    }
    catch(error) {
      console.log(error);
    }
    
  }


  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file first");
      return;
    }
     if (!description) {
      alert("Job description is required.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

  

  try {

    const res = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });
        
    const result = await res.json();
    
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
    alert(result.message);
    // send(description);
  } catch (err) {
    console.log(err);
    alert('Upload failed');
  }
} // Button needs to save test too

  return (
    <>
        <h1 className='welcome'>Welcome Twin</h1>
    <div className="app-container">
      <div className="landing-card">
        <h1>Upload your Resume Below</h1>
        {/* <p>Upload your file below to get started.</p> */}
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="file-input" />
        <button className="upload-btn" onClick={handleUpload}>Upload</button>
        <h2>Paste The Job description here</h2>
        <textarea onChange={(e) => setDescription(e.target.value)} cols="50" rows="10"></textarea>
      </div>
    </div>
    </>
  );
}

export default Home;