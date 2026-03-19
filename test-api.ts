import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aimsrc_secret_key_2026";
const token = jwt.sign({ id: 1, role: "MASTER_ADMIN", email: "drnarayanak@gmail.com", department: "Pharmacology" }, JWT_SECRET);

async function testApi() {
  console.log("Testing POST /api/cds-audits...");
  try {
    const res = await fetch("http://localhost:3005/api/cds-audits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        file_data: null,
        extracted_data: { test: "data" },
        ai_recommendations: { test: "data" }
      })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testApi();
