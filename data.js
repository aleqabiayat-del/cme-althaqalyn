// api/data.js
// Serverless function that stores/reads the CME board data in Upstash Redis
// so that everyone who opens the site (any browser, any device) sees the
// same shared data instead of each browser having its own local copy.

const KEY = 'cme_data_v6';

function defaultData() {
  return {
    physicians: [],
    nurses: [],
    pharmacists: [],
    support: [],
    general: [],
    external: [],
    pdfs: [],
    excels: [],
    registrations: {},
    staffPoints: {}
  };
}

module.exports = async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    res.status(500).json({ error: 'missing_env', message: 'KV_REST_API_URL / KV_REST_API_TOKEN not configured' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', KEY])
      });
      const payload = await r.json();
      const value = payload && payload.result ? JSON.parse(payload.result) : defaultData();
      res.status(200).json(value);
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = defaultData(); }
      }
      if (!body) body = defaultData();

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', KEY, JSON.stringify(body)])
      });
      await r.json();
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: String(err) });
  }
};
