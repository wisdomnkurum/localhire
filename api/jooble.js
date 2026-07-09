export default async function handler(req, res) {
  const API_KEY = process.env.JOOBLE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Jooble API key not configured on server." });
  }

  const { keywords = "", location = "", page = 1 } = req.query;

  try {
    const joobleRes = await fetch(`https://jooble.org/api/${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, page }),
    });

    if (!joobleRes.ok) {
      return res.status(joobleRes.status).json({ error: "Jooble request failed." });
    }

    const data = await joobleRes.json();

    // Normalize Jooble's response shape into what the frontend expects
    const jobs = (data.jobs || []).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      snippet: j.snippet,
      salary: j.salary,
      link: j.link,
      updated: j.updated,
    }));

    return res.status(200).json({ jobs, totalCount: data.totalCount || jobs.length });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch jobs from Jooble." });
  }
      }
