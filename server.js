const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
    users: [
        { email: 'owner@geprek.com', password: 'owner123', role: 'owner' },
        { email: 'karyawan@geprek.com', password: 'karyawan123', role: 'karyawan' }
    ],
    menus: [
        { id: 1, name: 'Ayam Geprek', stock: 50, price: 15000 },
        { id: 2, name: 'Es Teh', stock: 100, price: 5000 },
        { id: 3, name: 'Nasi Uduk', stock: 30, price: 8000 },
        { id: 4, name: 'Sambal', stock: 200, price: 2000 }
    ],
    transactions: []
};

function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ======= ROUTING TANPA .html =======
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard-owner', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard-owner.html');
});

app.get('/dashboard-karyawan', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard-karyawan.html');
});

// ======= API ENDPOINTS =======
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const data = loadData();
    const user = data.users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ success: true, role: user.role });
    } else {
        res.json({ success: false, message: 'Email atau password salah' });
    }
});

app.get('/api/data', (req, res) => {
    res.json(loadData());
});

app.post('/api/transaction', (req, res) => {
    const { menuId, qty } = req.body;
    const data = loadData();
    const menu = data.menus.find(m => m.id === menuId);
    
    if (menu && menu.stock >= qty) {
        menu.stock -= qty;
        data.transactions.push({
            id: Date.now(),
            menuId: menuId,
            qty: qty,
            time: new Date().toISOString()
        });
        saveData(data);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Stok tidak mencukupi' });
    }
});

app.post('/api/menu', (req, res) => {
    const { name, stock, price } = req.body;
    const data = loadData();
    const newId = data.menus.length > 0 ? Math.max(...data.menus.map(m => m.id)) + 1 : 1;
    data.menus.push({ id: newId, name: name, stock: parseInt(stock), price: parseInt(price) });
    saveData(data);
    res.json({ success: true });
});

app.post('/api/updatestock', (req, res) => {
    const { menuId, newStock } = req.body;
    const data = loadData();
    const menu = data.menus.find(m => m.id === menuId);
    if (menu) {
        menu.stock = newStock;
        saveData(data);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// ======= START SERVER =======
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   ☁️  CLOUD DATA SAFETY - GEPREK LONDHO ║
    ╠════════════════════════════════════════╣
    ║   Server berjalan di:                  ║
    ║   http://localhost:${PORT}              ║
    ╠════════════════════════════════════════╣
    ║   Login:                               ║
    ║   Owner: owner@geprek.com / owner123   ║
    ║   Karyawan: karyawan@geprek.com / karyawan123 ║
    ╚════════════════════════════════════════╝
    `);
});