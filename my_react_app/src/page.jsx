import React, { useEffect, useState } from 'react';
import './App.css';

function Page() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/ai-response", {
          credentials: "include"
        });
        const data = await res.json();
        setResult(data.response || "No response found.");
      } catch (err) {
        console.log(err);
        setResult("Failed to load response");
      } finally {
        setLoading(false);
      }
    };
    fetchResponse();
  }, []);

    return (
      <>
      <h1 className='welcome'>Results</h1>
    <div className="app-container">
      <div className="result">
        {result}
      </div>
     
    </div>
    </>
  );
}
export default Page;