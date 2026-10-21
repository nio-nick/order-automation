const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Google Sheets Configuration from environment variables
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

async function appendOrderToSheet(order) {
    try {
        if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            console.log('Google Sheets environment variables not fully set, skipping sync.');
            return;
        }

        // Initialize Auth
        const serviceAccountAuth = new JWT({
            email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheets[0]; // Use the first sheet

        // Append the row
        await sheet.addRow({
            'Date': order.timestamp,
            'Customer Name': order.customer_name,
            'Phone': order.phone,
            'Address': order.address,
            'Product Name': order.product_name,
            'Price': order.price
        });

        console.log('Order successfully synced to Google Sheet');
    } catch (error) {
        console.error('Google Sheets Sync Error:', error);
    }
}

app.post('/api/order', async (req, res) => {
    try {
        const { customer_name, phone, address, product_name, price } = req.body;

        if (!customer_name || !phone || !address || !product_name || !price) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const newOrder = {
            id: Date.now(),
            customer_name,
            phone,
            address,
            product_name,
            price,
            timestamp: new Date().toISOString()
        };

        // 1. Save to local JSON file
        let orders = [];
        try {
            const data = await fs.readFile(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            // Start with empty array if file doesn't exist
        }

        orders.push(newOrder);
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));

        // 2. Auto-sync to Google Sheet
        await appendOrderToSheet(newOrder);

        res.status(201).json({ success: true, message: 'Order placed successfully!', orderId: newOrder.id });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
