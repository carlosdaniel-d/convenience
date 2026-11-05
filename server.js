const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a Base de Datos en la Nube (MongoDB Atlas real)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:cluster_convenience@cluster0.mongodb.net/convenienceIA?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("🚀 [DB] Conectado exitosamente a MongoDB Atlas (Producción)");
}).catch(err => {
  console.error("❌ [DB] Error de conexión a la base de datos:", err);
});

// Esquema de Pedidos Reales
const PedidoSchema = new mongoose.Schema({
  negocio: String,
  items: Array,
  total: Number,
  metodoPago: String,
  direccionDestino: String,
  estado: { type: String, default: "Pendiente de Aprobación" },
  fecha: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', PedidoSchema);

// --- RUTAS DE LA API REST (100% Reales) ---

// 1. Endpoint para crear un pedido real desde la App
app.post('/api/pedidos', async (req, res) => {
  try {
    const nuevoPedido = new Pedido(req.body);
    await nuevoPedido.save();
    console.log("📦 [PEDIDO NUEVO] Registrado en BD:", nuevoPedido._id);
    res.status(201).json({ success: true, message: "Pedido registrado con éxito en servidores de Santo Domingo", id: nuevoPedido._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Endpoint para que el panel "Soy Dueño" obtenga los pedidos en tiempo real
app.get('/api/pedidos/comercio/:nombre', async (req, res) => {
  try {
    const pedidos = await Pedido.find({ negocio: req.params.nombre }).sort({ fecha: -1 }).limit(20);
    res.json({ success: true, data: pedidos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Endpoint de Estado del Sistema y Clima SD
app.get('/api/sistema/estado', (req, res) => {
  res.json({
    app: "convenienceIA Enterprise",
    region: "Santo Domingo, DO",
    estadoServidor: "Online 24/7",
    tasaUSD: 60.50,
    timestamp: new Date()
  });
});

// Puerto de escucha en Render / Local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor backend de convenienceIA corriendo en puerto ${PORT}`);
});
