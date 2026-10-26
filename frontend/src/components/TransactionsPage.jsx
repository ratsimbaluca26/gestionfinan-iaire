import React, { useEffect, useState } from "react";
import TransactionForm from "./TransactionForm";

const API = "http://localhost:3000"; // ✅ adapte à ton backend

export default function TransactionsPage() {
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    (async () => {
      // Charger clients
      const cRes = await fetch(`${API}/clients`);
      const cData = await cRes.json();
      setClients(Array.isArray(cData) ? cData : []);

      // Charger fournisseurs
      const sRes = await fetch(`${API}/suppliers`);
      const sData = await sRes.json();
      setSuppliers(Array.isArray(sData) ? sData : []);
    })();
  }, []);

  const onCreateClient = async (payload) => {
    const res = await fetch(`${API}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erreur création client");
    const created = await res.json();
    setClients((prev) => [...prev, created]);
    return created; // doit contenir { id, name }
  };

  // ✅ création fournisseur (indispensable pour afficher "+ Nouveau fournisseur")
  const onCreateSupplier = async ({ name }) => {
    const res = await fetch(`${API}/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Erreur création fournisseur");
    const created = await res.json();
    console.log(created)
    setSuppliers((prev) => [...prev, created]);
    return created; // doit contenir { id, name }
  };

  const onCreate = async (payload) => {
    const res = await fetch(`${API}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erreur création transaction");
    return res.json();
  };

  return (
    <TransactionForm
      clients={clients}
      suppliers={suppliers}
      onCreate={onCreate}
      onCreateClient={onCreateClient}
      onCreateSupplier={onCreateSupplier} // ✅ c’est ça qui active l’option
    />
  );
}