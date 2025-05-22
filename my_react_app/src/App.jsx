import './App.css';

function App() {
  return (
    <div className="app-container">
      <div className="landing-card">
        <h1>Upload your Resume Below</h1>
        {/* <p>Upload your file below to get started.</p> */}
        <input type="file" className="file-input" />
        <button className="upload-btn">Upload</button>
      </div>
    </div>
  );
}

export default App;