import React, { useEffect, useMemo, useState } from "react";

const categories = {
  in: ["Vente en ligne", "Couture", "Bourse", "Autre entrée"],
  out: [
    "Fournitures de couture",
    "Achat d'habillement",
    "Dépense personnelle",
    "Frais",
    "Crédit",
    "Autre sortie",
  ],
};

export default function TransactionForm({
  clients = [],
  suppliers = [],
  onCreate,
  onCreateClient,
  onCreateSupplier,
}) {
  const canCreateSupplier = typeof onCreateSupplier === "function";

  const [type, setType] = useState("in");
  const [category, setCategory] = useState(categories.in[0]);

  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("");

  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sub, setSub] = useState("Nourriture");

  const [selectedClient, setSelectedClient] = useState("");
  const [newClient, setNewClient] = useState("");

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [newSupplier, setNewSupplier] = useState("");

  const isClientFlow = useMemo(() => {
    return type === "in" && (category === "Vente en ligne" || category === "Couture");
  }, [type, category]);

  const isSupplierFlow = useMemo(() => {
    return (
      type === "out" &&
      (category === "Fournitures de couture" || category === "Achat d'habillement")
    );
  }, [type, category]);

  const needsCounterparty = isClientFlow || isSupplierFlow;

  useEffect(() => {
    setCategory(categories[type]?.[0] ?? categories.in[0]);
    setSelectedClient("");
    setNewClient("");
    setSelectedSupplier("");
    setNewSupplier("");
  }, [type]);

  useEffect(() => {
    setSelectedClient("");
    setNewClient("");
    setSelectedSupplier("");
    setNewSupplier("");
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { type, category, description, date };

    if (needsCounterparty) {
      if (total === "") return alert("Montant total requis");

      const totalNum = parseFloat(total);
      const paidNum = parseFloat(paid || 0);

      if (Number.isNaN(totalNum)) return alert("Montant total invalide");
      if (Number.isNaN(paidNum)) return alert("Montant payé invalide");

      payload.total = totalNum;
      payload.paid = paidNum;
      payload.amount = paidNum;

      // ---- CLIENT (Entrées vente/couture)
      if (isClientFlow) {
        if (selectedClient === "new") {
          if (!newClient.trim()) return alert("Nom du client requis");
          if (typeof onCreateClient !== "function")
            return alert("onCreateClient n'est pas fourni");

          const created = await onCreateClient({
            name: newClient.trim(),
            kind: category === "Couture" ? "couture" : "vente",
          });

          const clientId = created?.id ?? created?.data?.id;
          if (!clientId) return alert("ID client introuvable");
          payload.clientId = clientId;
        } else if (!selectedClient) {
          return alert("Choisir un client");
        } else {
          payload.clientId = parseInt(selectedClient, 10);
        }
      }

      // ---- FOURNISSEUR (Sorties fournitures/habillement)
      if (isSupplierFlow) {
        if (selectedSupplier === "new") {
          if (!newSupplier.trim()) return alert("Nom du fournisseur requis");
          if (!canCreateSupplier) return alert("onCreateSupplier n'est pas fourni");

          const created = await onCreateSupplier({ name: newSupplier.trim() });

          const supplierId = created?.id ?? created?.data?.id;
          if (!supplierId) return alert("ID fournisseur introuvable");
          payload.supplierId = supplierId;

          // (optionnel) auto-sélection après création
          setSelectedSupplier(String(supplierId));
          setNewSupplier("");
        } else if (!selectedSupplier) {
          return alert("Choisir un fournisseur");
        } else {
          payload.supplierId = parseInt(selectedSupplier, 10);
        }
      }
    } else {
      if (amount === "") return alert("Montant requis");
      const amountNum = parseFloat(amount);
      if (Number.isNaN(amountNum)) return alert("Montant invalide");

      payload.amount = amountNum;

      if (category === "Dépense personnelle") payload.sub = sub;
    }

    await onCreate(payload);

    setAmount("");
    setTotal("");
    setPaid("");
    setDescription("");
    setSelectedClient("");
    setNewClient("");
    setSelectedSupplier("");
    setNewSupplier("");
  };

  return (
    <section className="card">
      <h3>Ajouter une opération</h3>

      <form onSubmit={handleSubmit}>
        <div className="seg">
          <label>
            <input type="radio" checked={type === "in"} onChange={() => setType("in")} />
            Entrée
          </label>
          <label>
            <input type="radio" checked={type === "out"} onChange={() => setType("out")} />
            Sortie
          </label>
        </div>

        <label>
          Catégorie
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(categories[type] || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {needsCounterparty ? (
          <>
            {isClientFlow && (
              <>
                <label>
                  Client
                  <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                    <option value="">Choisir un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="new">+ Nouveau client</option>
                  </select>
                </label>

                {selectedClient === "new" && (
                  <label>
                    Nom du client
                    <input value={newClient} onChange={(e) => setNewClient(e.target.value)} />
                  </label>
                )}
              </>
            )}

            {isSupplierFlow && (
              <>
                <label>
                  Fournisseur
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Choisir un fournisseur</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {canCreateSupplier && <option value="new">+ Nouveau fournisseur</option>}
                  </select>
                </label>

                {canCreateSupplier && selectedSupplier === "new" && (
                  <label>
                    Nom du fournisseur
                    <input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} />
                  </label>
                )}
              </>
            )}

            <label>
              Montant total
              <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
            </label>

            <label>
              Montant payé
              <input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label>
              Montant
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>

            {category === "Dépense personnelle" && (
              <label>
                Type de dépense
                <select value={sub} onChange={(e) => setSub(e.target.value)}>
                  <option>Nourriture</option>
                  <option>Vêtement</option>
                  <option>Divers</option>
                </select>
              </label>
            )}
          </>
        )}

        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <button className="btn" type="submit">Enregistrer</button>
      </form>
    </section>
  );
}