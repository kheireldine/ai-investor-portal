import React, { useState } from "react";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const data = new URLSearchParams();
    data.append("username", email);
    data.append("password", password);

    const res = await fetch("http://127.0.0.1:8000/token", { method: "POST", body: data });
    if (res.ok) {
      const tokenData = await res.json();
      localStorage.setItem("token", tokenData.access_token);
      setToken(tokenData.access_token);
    } else {
      alert("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
    </form>
  );
}
