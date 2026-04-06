const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require("../db/db");

// 1. Exchange rate
exports.getExchangeRate = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Missing from or to currency" });
    }

    const fromCurr = from.toUpperCase();
    const toCurr = to.toUpperCase();

    console.log(`[EXCHANGE] Fetching: ${fromCurr} → ${toCurr}`);

    const response = await axios.get(
      `https://api.frankfurter.app/latest?from=${fromCurr}&to=${toCurr}`
    );

    const rate = response.data.rates?.[toCurr];

    if (!rate || isNaN(rate)) {
      throw new Error("No valid rate found");
    }

    res.json({
      success: true,
      from: fromCurr,
      to: toCurr,
      rate: parseFloat(rate.toFixed(6)),
      last_updated: response.data.date
    });
  } catch (err) {
    console.error("[EXCHANGE ERROR]", err.message);
    res.status(500).json({ message: "Failed to fetch rate" });
  }
};
exports.sendMoney = async (req, res) => {
  const client = await pool.connect();
  console.log("=== SEND MONEY STARTED ===");

  try {
    await client.query("BEGIN");
    console.log("Transaction started");

    const { receiverEmail, amount, description, receiverCurrency } = req.body;
    const senderId = req.user.id;
    const sendAmount = parseFloat(amount);

    console.log(`Sender ID: ${senderId} | Receiver: ${receiverEmail} | Amount: ${sendAmount}`);

    if (isNaN(sendAmount) || sendAmount <= 0) {
      throw new Error("Invalid amount");
    }

    // 1. Get sender
    const senderRes = await client.query(
      "SELECT balance, currency FROM users WHERE id = $1", [senderId]
    );
    const senderBalance = parseFloat(senderRes.rows[0].balance);

    if (senderBalance < sendAmount) {
      throw new Error("Insufficient balance");
    }

    console.log(`Sender balance check passed: ${senderBalance}`);

    // 2. Get receiver
    const receiverRes = await client.query(
      "SELECT id, currency FROM users WHERE email = $1", [receiverEmail]
    );

    if (receiverRes.rows.length === 0) {
      throw new Error("Receiver not found");
    }

    const receiverId = receiverRes.rows[0].id;
    console.log(`Receiver found - ID: ${receiverId}`);

    if (senderId === receiverId) {
      throw new Error("Cannot send to yourself");
    }

    // 3. Update sender
    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [sendAmount, senderId]
    );
    console.log("Sender balance updated (deducted)");

    // 4. Update receiver
    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [sendAmount, receiverId]
    );
    console.log("Receiver balance updated (added)");

    // 5. Record transaction
    await client.query(
      `INSERT INTO transactions 
       (sender_id, receiver_id, amount, status, description)
       VALUES ($1, $2, $3, 'completed', $4)`,
      [senderId, receiverId, sendAmount, description || "Transfer"]
    );
    console.log("Transaction recorded");

    await client.query("COMMIT");
    console.log("=== TRANSACTION COMMITTED SUCCESSFULLY ===");

    res.json({
      success: true,
      message: "Transfer successful",
      sent: sendAmount
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("=== TRANSACTION ROLLED BACK ===");
    console.error("Error:", err.message);

    res.status(400).json({
      success: false,
      message: err.message || "Transfer failed"
    });
  } finally {
    client.release();
  }
};

// Get transaction history for the logged-in user
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`Fetching transaction history for user ID: ${userId}`);

    const result = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.received_amount,
        t.sender_currency,
        t.receiver_currency,
        t.exchange_rate,
        t.description,
        t.created_at,
        t.status,
        u1.name as sender_name,
        u2.name as receiver_name,
        u1.email as sender_email,
        u2.email as receiver_email,
        t.sender_id,
        t.receiver_id
      FROM transactions t
      LEFT JOIN users u1 ON t.sender_id = u1.id
      LEFT JOIN users u2 ON t.receiver_id = u2.id
      WHERE t.sender_id = $1 OR t.receiver_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [userId]);

    console.log(`Found ${result.rows.length} transactions for user ${userId}`);

    res.json({
      success: true,
      transactions: result.rows.map(row => ({
        id: row.id,
        // FIXED: Correctly determine if this user sent or received
        type: row.sender_id === userId ? "sent" : "received",
        amount: parseFloat(row.amount),
        received_amount: row.received_amount ? parseFloat(row.received_amount) : null,
        sender_currency: row.sender_currency,
        receiver_currency: row.receiver_currency,
        exchange_rate: row.exchange_rate ? parseFloat(row.exchange_rate) : null,
        description: row.description,
        date: row.created_at,
        status: row.status,
        other_party: row.sender_id === userId 
          ? (row.receiver_name || row.receiver_email) 
          : (row.sender_name || row.sender_email)
      }))
    });
  } catch (err) {
    console.error("Transaction history error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history"
    });
  }
};