const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Google Sheets Configuration
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

// Courier API Configuration
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY;
const PATHAO_CLIENT_ID = process.env.PATHAO_CLIENT_ID;
const PATHAO_CLIENT_SECRET = process.env.PATHAO_CLIENT_SECRET;
const PATHAO_USERNAME = process.env.PATHAO_USERNAME;
const PATHAO_PASSWORD = process.env.PATHAO_PASSWORD;
const CARRYBEE_API_TOKEN = process.env.CARRYBEE_API_TOKEN;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
    secret: 'merchant-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using HTTPS
}));

// Auth Middleware
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) return next();
    res.status(401).json({ success: false, message: 'Unauthorized' });
}

// --- PUBLIC ORDER FORM ---

app.post('/api/order', async (req, res) => {
    try {
        const { customer_name, phone, address } = req.body;

        if (!customer_name || !phone || !address) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const newOrder = {
            id: Date.now(),
            customer_name,
            phone,
            address,
            product_name: null,
            price: null,
            delivery_charge: 0,
            status: 'Pending',
            tracking_code: null,
            timestamp: new Date().toISOString()
        };

        let orders = [];
        try {
            const data = await fs.readFile(ORDERS_FILE, 'utf8');
            orders = JSON.parse(data);
        } catch (error) {}

        orders.push(newOrder);
        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));

        res.status(201).json({ success: true, message: 'Order placed successfully!', orderId: newOrder.id });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// --- AUTHENTICATION ---

app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    // In a real app, store hashed password in env or DB.
    // For this task, we use a simple check or a dummy hashed check.
    const MERCHANT_PASSWORD = process.env.MERCHANT_PASSWORD || 'admin123';

    if (password === MERCHANT_PASSWORD) {
        req.session.isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// --- MERCHANT DASHBOARD ---

app.get('/api/dashboard/orders', isAuthenticated, async (req, res) => {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        const orders = JSON.parse(data).filter(o => o.status === 'Pending');

        const prodData = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(prodData);

        res.json({ success: true, orders, products });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/dashboard/approve', isAuthenticated, async (req, res) => {
    try {
        const { id, product_name, price, delivery_charge, courier } = req.body;

        let orders = JSON.parse(await fs.readFile(ORDERS_FILE, 'utf8'));
        const index = orders.findIndex(o => o.id === id);
        if (index === -1) return res.status(404).json({ success: false, message: 'Order not found' });

        let trackingCode = null;

        if (courier === 'steadfast') {
            if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
                return res.status(500).json({ success: false, message: 'Steadfast API keys are missing' });
            }
            try {
                const response = await axios.post('https://api.steadfast.com.bd/api/v1/create_order', {
                    api_key: STEADFAST_API_KEY,
                    secret_key: STEADFAST_SECRET_KEY,
                    customer_name: orders[index].customer_name,
                    customer_phone: orders[index].phone,
                    customer_address: orders[index].address,
                    parcel_details: `${product_name} - Price: ${price}`,
                    delivery_charge: delivery_charge
                });
                if (response.data && response.data.tracking_code) {
                    trackingCode = response.data.tracking_code;
                } else {
                    throw new Error('Courier API did not return a tracking code');
                }
            } catch (apiError) {
                console.error('Steadfast API Error:', apiError.message);
                return res.status(500).json({ success: false, message: `Steadfast dispatch failed: ${apiError.message}` });
            }
        } else if (courier === 'pathao') {
            if (!PATHAO_CLIENT_ID || !PATHAO_CLIENT_SECRET || !PATHAO_USERNAME || !PATHAO_PASSWORD) {
                return res.status(500).json({ success: false, message: 'Pathao API configuration is missing' });
            }
            try {
                const authRes = await axios.post('https://api.pathao.com/v1/auth/login', {
                    username: PATHAO_USERNAME,
                    password: PATHAO_PASSWORD
                });
                const token = authRes.data.token;

                const orderRes = await axios.post('https://api.pathao.com/v1/orders', {
                    recipient_name: orders[index].customer_name,
                    recipient_phone: orders[index].phone,
                    recipient_address: orders[index].address,
                    parcel_details: `${product_name} - Price: ${price}`,
                    delivery_charge: delivery_charge
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (orderRes.data && orderRes.data.order_id) {
                    trackingCode = orderRes.data.order_id;
                } else {
                    throw new Error('Courier API did not return a tracking code');
                }
            } catch (apiError) {
                console.error('Pathao API Error:', apiError.message);
                return res.status(500).json({ success: false, message: `Pathao dispatch failed: ${apiError.message}` });
            }
        } else if (courier === 'carrybee') {
            if (!CARRYBEE_API_TOKEN) {
                return res.status(500).json({ success: false, message: 'Carrybee API token is missing' });
            }
            try {
                const response = await axios.post('https://api.carrybee.com/v1/create_order', {
                    token: CARRYBEE_API_TOKEN,
                    customer_name: orders[index].customer_name,
                    customer_phone: orders[index].phone,
                    customer_address: orders[index].address,
                    item_details: `${product_name} - Price: ${price}`,
                    delivery_fee: delivery_charge
                });
                if (response.data && response.data.tracking_number) {
                    trackingCode = response.data.tracking_number;
                } else {
                    throw new Error('Courier API did not return a tracking code');
                }
            } catch (apiError) {
                console.error('Carrybee API Error:', apiError.message);
                return res.status(500).json({ success: false, message: `Carrybee dispatch failed: ${apiError.message}` });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid courier selected' });
        }

        // Only set to Approved if we got a tracking code
        orders[index].product_name = product_name;
        orders[index].price = price;
        orders[index].delivery_charge = delivery_charge;
        orders[index].status = 'Approved';
        orders[index].courier = courier;
        orders[index].tracking_code = trackingCode;

        await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
        res.json({ success: true, tracking_code: trackingCode });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/dashboard/products', isAuthenticated, async (req, res) => {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data);
        res.json({ success: true, products });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/dashboard/products', isAuthenticated, async (req, res) => {
    try {
        const { name, price } = req.body;
        const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        products.push({ id: Date.now(), name, price });
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.delete('/api/dashboard/products/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        let products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        products = products.filter(p => p.id !== Number(id));
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Routing for Dashboard & Login
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => {
    if (!req.session.isAuthenticated) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/dashboard/products', (req, res) => {
    if (!req.session.isAuthenticated) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
