// src/pages/Preference.jsx
function Preference({ preferences, setPreferences }) {
  const handleChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8000/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const result = await res.json();
      alert("Saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving preferences");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Your Preferences</h2>
      <input
        placeholder="Favorite Food"
        value={preferences.food}
        onChange={e => handleChange("food", e.target.value)}
      />
      <br /><br />
      <input
        placeholder="Favorite Drink"
        value={preferences.drink}
        onChange={e => handleChange("drink", e.target.value)}
      />
      <br /><br />
      <input
        placeholder="Preferred Activity"
        value={preferences.activity}
        onChange={e => handleChange("activity", e.target.value)}
      />
      <br /><br />
      <button onClick={handleSubmit}>Save</button>
    </div>
  );
}

export default Preference;