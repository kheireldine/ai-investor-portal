import React, { useState, useEffect } from "react";

export default function Requests({ token }) {
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");

  const fetchRequests = () => {
    fetch("http://127.0.0.1:8000/requests", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setRequests(data));
  };

  useEffect(() => fetchRequests(), [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:8000/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, amount: parseFloat(amount) }),
    }).then(() => {
      setAmount("");
      fetchRequests();
    });
  };

  return (
    <div>
      <h3>Requests</h3>
      <form onSubmit={handleSubmit}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
        <button type="submit">Submit</button>
      </form>
      <ul>
        {requests.map((r, idx) => (
          <li key={idx}>{r.type} ${r.amount} - {r.status} ({new Date(r.timestamp).toLocaleString()})</li>
        ))}
      </ul>
    </div>
  );
}
