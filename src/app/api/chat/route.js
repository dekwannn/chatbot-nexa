export async function POST(req) {
    const body = await req.json();
    const { question } = body;
  
    const apiKey = process.env.GEMINI_API_KEY;
  
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }]
      })
    });
  
    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada jawaban.";
  
    return Response.json({ answer });
  }
  