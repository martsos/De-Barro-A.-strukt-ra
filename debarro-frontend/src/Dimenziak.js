import { useState, useEffect } from "react";
import { API } from "./api";

function Dimenziak() {
  const [alkalmazottak, setAlkalmazottak] = useState([]);

  useEffect(() => {
    fetch(`${API}/alkalmazott`)
      .then(r => r.json())
      .then(data => {
        console.log("alkalmazottak:", data);
        setAlkalmazottak(data);
      });
  }, []);

  return (
    <div>
      {alkalmazottak.map(a => (
        <div key={a.foglalkoztatott_id}>
          {a.foglalkoztatott_nev} - {a.allapot}
        </div>
      ))}
    </div>
  );
}

export default Dimenziak;