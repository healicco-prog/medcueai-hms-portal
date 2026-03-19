async function run() {
  const loginRes = await fetch('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'drnarayanak@gmail.com', password: 'Tata-vidhya@1969' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Token:', token ? 'Obtained' : 'Failed');

  const res = await fetch('http://localhost:3005/api/cds-audits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      extracted_data: { demographics: 'test' },
      ai_recommendations: { alerts: [] }
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run();
