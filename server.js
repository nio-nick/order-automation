const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

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

        let orders = [];
        try {
            const data = await fs.readFile(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with empty array
        }

        orders.push(newOrder);
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));

        res.status(201).json({ success: true, message: 'Order placed successfully!', orderId: newOrder.id });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
