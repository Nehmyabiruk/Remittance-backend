exports.getExchangeRate = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Missing from or to currency" });
    }

    const fromCurr = from.toUpperCase();
    const toCurr = to.toUpperCase();

    console.log(`[EXCHANGE] Fetching rate: ${fromCurr} → ${toCurr}`);

    // Reliable free API - supports ETB, KES, etc.
    const apiUrl = `https://api.exchangerate.host/convert?access_key=cf75651ede5e037a617809bd&from=${fromCurr}&to=${toCurr}&amount=1`;
    const response = await axios.get(apiUrl, { timeout: 10000 });

    console.log(`[EXCHANGE] API Status: ${response.status}`);

    const rates = response.data.rates;

    if (!rates || !rates[toCurr]) {
      console.error(`[EXCHANGE] Rate not found for ${toCurr}. Available currencies:`, Object.keys(rates || {}).slice(0, 15));
      throw new Error(`Rate not available for ${fromCurr} to ${toCurr}`);
    }

    const rate = parseFloat(rates[toCurr]);

    console.log(`[EXCHANGE] SUCCESS - Rate: ${rate}`);

    res.json({
      success: true,
      from: fromCurr,
      to: toCurr,
      rate: Number(rate.toFixed(6)),
      last_updated: response.data.time_last_update_utc || new Date().toISOString()
    });
  } catch (err) {
    console.error("[EXCHANGE ERROR]:", err.message);
    if (err.response) {
      console.error("API Status:", err.response.status);
    }
    res.status(503).json({
      success: false,
      message: `Unable to fetch rate for ${to ? to.toUpperCase() : 'selected currency'}`,
      error: err.message
    });
  }
};