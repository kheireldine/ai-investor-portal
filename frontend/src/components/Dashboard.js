import React, { useEffect, useState } from "react";
import Portfolio from "./Portfolio";
import Requests from "./Requests";

export default function Dashboard({ token, setToken }) {
  const [profile, setProfile] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProfile(data));

    fetch("http://127.0.0.1:8000/ai-insights", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setAiInsights(data.message));
  }, [token]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h2>Welcome, {profile.name}</h2>
      <button onClick={logout}>Logout</button>
      <Portfolio token={token} />
      <Requests token={token} />
      {aiInsights && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h3>AI Insights</h3>
          <p>{aiInsights}</p>
        </div>
      )}
    </div>
  );
}
