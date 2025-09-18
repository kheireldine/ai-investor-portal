import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from "./assets/logo.png";
import { marked } from "marked";

// Backgrounds
import signupBg from "./assets/signup-bg.png";
import loginBg from "./assets/signup-bg.png";

function App() {
  const [token, setToken] = useState(null);
  const [showSignup, setShowSignup] = useState(true);
  const [aiResponse, setAiResponse] = useState("");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");

  const handleAI = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiResponse(data.response || "No response");
    } catch (err) {
      console.error(err);
      setAiResponse("Error fetching AI response");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setPrompt("");
    setAiResponse("");
    setName("");
  };

  return (
    <>
      {!token ? (
        showSignup ? (
          <Signup setShowSignup={setShowSignup} setName={setName} />
        ) : (
          <Login setToken={setToken} setName={setName} setShowSignup={setShowSignup} />
        )
      ) : (
        <Dashboard
          name={name}
          prompt={prompt}
          setPrompt={setPrompt}
          aiResponse={aiResponse}
          handleAI={handleAI}
          handleLogout={handleLogout}
        />
      )}
    </>
  );
}

// --- Signup Component ---
const Signup = ({ setShowSignup, setName }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameInput, setNameInput] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: nameInput }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Signup failed");
      }
      alert("Signup successful! Please login.");
      setName(nameInput);
      setShowSignup(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${signupBg})`,
        backgroundSize: "50% auto",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingRight: "15%",
        paddingLeft: "5%",
      }}
    >
      <div className="card shadow-lg" style={{ maxWidth: "500px", width: "100%", backgroundColor: "#FFFFFF", color: "#B8860B", fontFamily: "Garamond, serif" }}>
        <div className="card-body">
          <div className="text-center mb-3">
            <img src={logo} alt="Logo" style={{ height: "80px" }} />
          </div>
          <h3 className="card-title mb-4 text-center" style={{ color: "#B8860B", fontFamily: "Futura, serif" }}>Signup</h3>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", color: "#B8860B", border: "1px solid #B8860B", fontFamily: "Garamond, sans-serif" }}
          />
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", color: "#B8860B", border: "1px solid #B8860B", fontFamily: "Garamond, sans-serif" }}
          />
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", color: "#B8860B", border: "1px solid #B8860B", fontFamily: "Garamond, sans-serif" }}
          />
          <button className="btn" style={{ backgroundColor: "#B8860B", color: "white", width: "100%", fontFamily: "Garamond, sans-serif" }} onClick={handleSignup}>Signup</button>
          <p className="mt-3 text-center">
            Already have an account? <button className="btn btn-link p-0" onClick={() => setShowSignup(false)} style={{ color: "#B8860B", fontFamily: "Futura, sans-serif" }}>Login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Login Component ---
const Login = ({ setToken, setName, setShowSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await res.json();
      setToken(data.access_token);
      setName(data.name || email);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "50% auto",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingRight: "15%",
        paddingLeft: "5%",
      }}
    >
      <div className="card shadow-lg" style={{ maxWidth: "450px", width: "100%", backgroundColor: "rgba(255,255,255,0.95)", color: "#B8860B", fontFamily: "Garamond, serif" }}>
        <div className="card-body">
          <div className="text-center mb-3">
            <img src={logo} alt="Logo" style={{ height: "80px" }} />
          </div>
          <h3 className="card-title mb-4 text-center" style={{ color: "#B8860B", fontFamily: "Futura, serif" }}>Login</h3>
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", color: "#B8860B", border: "1px solid #B8860B", fontFamily: "Garamond, sans-serif" }}
          />
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ backgroundColor: "#FFFFFF", color: "#B8860B", border: "1px solid #B8860B", fontFamily: "Garamond, sans-serif" }}
          />
          <button className="btn" style={{ backgroundColor: "#B8860B", color: "white", width: "100%", fontFamily: "Garamond, sans-serif" }} onClick={handleLogin}>Login</button>
          <p className="mt-3 text-center">
            Don't have an account? <button className="btn btn-link p-0" onClick={() => setShowSignup(true)} style={{ color: "#B8860B", fontFamily: "Futura, sans-serif" }}>Signup</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ name, prompt, setPrompt, aiResponse, handleAI, handleLogout }) => {
  // Ensure aiResponse is a string
  const formattedResponse = Array.isArray(aiResponse) ? aiResponse.join("\n") : aiResponse;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #B8860B, #FFFFFF)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Garamond, serif",
      }}
    >
      <div className="card shadow-lg" style={{ width: "100%", maxWidth: "1200px", backgroundColor: "rgba(255,255,255,0.85)", color: "#B8860B", padding: "20px" }}>
        <div className="card-body">
          <div className="text-center mb-3">
            <img src={logo} alt="Logo" style={{ height: "80px" }} />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 style={{ fontFamily: "Garamond, serif", color: "#B8860B" }}>Welcome, {name}</h2>
            <button className="btn btn-danger" onClick={handleLogout} style={{ fontFamily: "Futura, sans-serif" }}>Logout</button>
          </div>

          <h4 style={{ fontFamily: "Futura, sans-serif", color: "#B8860B" }}>Ask Gemini AI</h4>
          <textarea
            className="form-control mb-3"
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            style={{ backgroundColor: "#FFFFFF", color: "#B8860B", border: "2px solid #B8860B", fontFamily: "Garamond, sans-serif" }}
          />
          <button className="btn mb-3" style={{ backgroundColor: "#B8860B", color: "white", width: "100%", fontFamily: "Garamond, sans-serif" }} onClick={handleAI}>Submit Prompt</button>

          <h5 style={{ fontFamily: "Garamond, serif", color: "#B8860B" }}>AI Response:</h5>
          <div className="border rounded p-3" style={{ minHeight: "150px", backgroundColor: "#FFFFFF", color: "#B8860B", border: "2px solid #B8860B", fontFamily: "Garamond, serif" }}>
            <div dangerouslySetInnerHTML={{ __html: marked(formattedResponse || "") }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
