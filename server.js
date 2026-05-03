const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatPhone = (phone) => {
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("0")) return "254" + phone.slice(1);
    if (phone.startsWith("254")) return phone;
    return phone;
};

app.post("/send-bulk", async (req, res) => {
    const { numbers, amount, reference } = req.body;

    if (!numbers || !amount) {
        return res.status(400).json({ error: "Missing numbers or amount" });
    }

    const phoneList = numbers.split("\n").map(n => n.trim()).filter(n => n);
    let results = [];

    for (let phone of phoneList) {
        try {
            const payload = {
                amount: amount,
                phone_number: formatPhone(phone),
                external_reference: reference || "BulkPayment"
            };

            const response = await axios.post(
                "https://api.swiftwallet.co.ke/pay-app/v3/stk-initiate/",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            results.push({ phone, status: "Sent", response: response.data });

        } catch (err) {
            results.push({
                phone,
                status: "Failed",
                error: err.response?.data || err.message
            });
        }

        await delay(2000);
    }

    res.json({ success: true, results });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
