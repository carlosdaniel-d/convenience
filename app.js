const map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

let todosLosNegocios = [];
let marcadoresGroup = L.layerGroup().addTo(map);
let carrito = [];
let categoriaActual = 'Todos';

const sectoresSD = [
  { nombre: "Piantini", lat: 18.4750, lng: -69.9380 },
  { nombre: "Naco", lat: 18.4795, lng: -69.9330 },
  { nombre: "Bella Vista", lat: 18.4550, lng: -69.9480 },
  { nombre: "Evaristo Morales", lat: 18.4690, lng: -69.9420 },
  { nombre: "Gazcue", lat: 18.4680, lng: -69.8980 }
];

const tiposNegocios = [
  { cat: "Supermercado", nombres: ["Supermercado Nacional", "Sirena Market"] },
  { cat: "Farmacia 24h", nombres: ["Farmacia Carol", "Farmacia GBC"] },
  { cat: "Bebidas & Licores", nombres: ["El Catador", "Liquor Store"] },
  { cat: "Comida Rápida & Delivery", nombres: ["Burger Craft", "Pizzería SD"] }
];

function generar300Negocios() {
  const lista = [];
  for (let i = 0; i < 300; i++) {
    const sector = sectoresSD[i % sectoresSD.length];
    const tipo = tiposNegocios[i % tiposNegocios.length];
    const nombreBase = tipo.nombres[i % tipo.nombres.length];
    lista.push({
      id: i + 1,
      nombre: `${nombreBase} ${sector.nombre} #${i+1}`,
      categoria: tipo.cat,
      sector: sector.nombre,
      ubicacion: { latitud: sector.lat + (Math.random() - 0.5) * 0.03, longitud: sector.lng + (Math.random() - 0.5) * 0.03 },
      productos: [
        { id: 101, nombre: "Combo Especial SD", precio: 450 },
        { id: 102, nombre: "Bebida Fría 1L", precio: 120 }
      ]
    });
  }
  return lista;
}

function renderizarMarcadores(negocios) {
  marcadoresGroup.clearLayers();
  negocios.forEach(negocio => {
    const marker = L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud]);
    const popupHtml = `
      <div style="color:#111; font-family:Inter; padding:4px;">
        <h4 style="margin:0 0 4px 0;">${negocio.nombre}</h4>
        <small style="background:#00E676; padding:2px 6px; border-radius:4px; font-weight:bold;">${negocio.categoria}</small>
        <p style="margin:6px 0; font-size:12px;">📍 ${negocio.sector}</p>
        <button onclick="verProductos(${negocio.id})" style="width:100%; background:#111; color:#fff; border:none; padding:6px; border-radius:6px; cursor:pointer; font-weight:bold;">Ver Productos 🛍️</button>
      </div>
    `;
    marker.bindPopup(popupHtml);
    marcadoresGroup.addLayer(marker);
  });
}

function filtrarNegocios() {
  const texto = document.getElementById('search-input').value.toLowerCase().trim();
  const filtrados = todosLosNegocios.filter(n => {
    const coincideCat = categoriaActual === 'Todos' || n.categoria === categoriaActual;
    const coincideTexto = n.nombre.toLowerCase().includes(texto) || n.sector.toLowerCase().includes(texto);
    return coincideCat && coincideTexto;
  });
  renderizarMarcadores(filtrados);
}

// 1. Manejo de Filtros por Categoría
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    categoriaActual = e.target.getAttribute('data-cat');
    filtrarNegocios();
  });
});

document.getElementById('search-input').addEventListener('input', filtrarNegocios);

// 2. Manejo de Pedidos / Carrito
window.verProductos = function(id) {
  const negocio = todosLosNegocios.find(n => n.id === id);
  if (!negocio) return;
  document.getElementById('modal-business-name').innerText = negocio.nombre;
  const container = document.getElementById('cart-items');
  container.innerHTML = negocio.productos.map(p => `
    <div class="item-row">
      <div><strong>${p.nombre}</strong><br><small>RD$ ${p.precio}</small></div>
      <button class="btn-add" onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">+ Agregar</button>
    </div>
  `).join('');
  document.getElementById('cart-modal').classList.remove('hidden');
};

window.agregarAlCarrito = function(nombre, precio) {
  carrito.push({ nombre, precio });
  actualizarCarritoUI();
};

function actualizarCarritoUI() {
  document.getElementById('cart-count').innerText = carrito.length;
  const total = carrito.reduce((sum, i) => sum + i.precio, 0);
  document.getElementById('cart-total-price').innerText = `RD$ ${total}`;
  if (carrito.length > 0) document.getElementById('cart-btn').classList.remove('hidden');
}

window.abrirCarrito = () => document.getElementById('cart-modal').classList.remove('hidden');
window.cerrarCarrito = () => document.getElementById('cart-modal').classList.add('hidden');
window.finalizarPedido = () => {
  alert('🚀 ¡Pedido enviado con éxito a la central de delivery!');
  carrito = [];
  actualizarCarritoUI();
  cerrarCarrito();
};

todosLosNegocios = generar300Negocios();
renderizarMarcadores(todosLosNegocios);
// ==========================================
// INTEGRACIÓN DE NEGOCIOS REALES DE USUARIOS (Fase 2)
// ==========================================
function cargarNegociosTotales() {
  const negociosGenerados = generar300Negocios();
  const negociosGuardados = JSON.parse(localStorage.getItem('mis_negocios')) || [];
  
  // Unimos los creados por dueños reales + los 300 automáticos
  todosLosNegocios = [...negociosGuardados, ...negociosGenerados];
  renderizarMarcadores(todosLosNegocios);
  console.log(`✅ Total cargado: ${todosLosNegocios.length} negocios en el mapa.`);
}

// Ejecutar la fusión al abrir la app
cargarNegociosTotales();
// ==========================================
// FUNCIÓN PARA OBTENER LOGO SEGÚN CATEGORÍA O CUSTOM
// ==========================================
function obtenerLogoNegocio(negocio) {
  // Si el negocio tiene una foto/logo personalizada, la usamos
  if (negocio.logoUrl) return negocio.logoUrl;

  // Logos predeterminados en alta resolución por categoría
  const logosPorCategoria = {
    "Supermercado": "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
    "Farmacia 24h": "https://cdn-icons-png.flaticon.com/512/4320/4320337.png",
    "Bebidas & Licores": "https://cdn-icons-png.flaticon.com/512/920/920581.png",
    "Comida Rápida & Delivery": "https://cdn-icons-png.flaticon.com/512/732/732217.png",
    "Conveniencia": "https://cdn-icons-png.flaticon.com/512/1162/1162456.png"
  };

  return logosPorCategoria[negocio.categoria] || "https://cdn-icons-png.flaticon.com/512/1162/1162456.png";
}

// Reemplazamos la función de dibujar marcadores para incluir la imagen/logo
function renderizarMarcadores(negocios) {
  marcadoresGroup.clearLayers();
  
  negocios.forEach(negocio => {
    const logoSrc = obtenerLogoNegocio(negocio);
    const marker = L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud]);

    const popupHtml = `
      <div style="color:#111; font-family:'Inter', sans-serif; padding:6px; text-align:center; max-width:200px;">
        <img src="${logoSrc}" alt="${negocio.nombre}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 10px; margin-bottom: 6px; background: #f0f0f0; padding: 4px;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">${negocio.nombre}</h4>
        <span style="display:inline-block; background:#00E676; color:#000; font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; margin-bottom:6px;">
          ${negocio.categoria}
        </span>
        <p style="margin:0 0 8px 0; font-size:11px; color:#666;">📍 ${negocio.sector}</p>
        <button onclick="verProductos(${negocio.id})" style="width:100%; background:#111; color:#fff; border:none; padding:8px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700;">
          Ver Menú / Productos 🛍️
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marcadoresGroup.addLayer(marker);
  });
}
// ==========================================
// BLOQUE 1000%: PASARELA, GPS Y RESEÑAS
// ==========================================

// 1. Modificar el botón de finalizar pedido para abrir pasarela
window.finalizarPedido = function() {
  if (carrito.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }
  cerrarCarrito();
  document.getElementById('checkout-modal').classList.remove('hidden');
};

window.cerrarPago = function() {
  document.getElementById('checkout-modal').classList.add('hidden');
};

window.procesarPagoFinal = function() {
  const metodo = document.querySelector('input[name="metodo-pago"]:checked').value;
  const total = carrito.reduce((sum, i) => sum + i.precio, 0);
  
  // Guardar pedido para el panel del dueño
  const nuevoPedido = {
    id: Date.now(),
    items: [...carrito],
    total: total,
    metodoPago: metodo,
    estado: 'En camino 🛵',
    hora: new Date().toLocaleTimeString()
  };

  let pedidosDueño = JSON.parse(localStorage.getItem('pedidos_negocio')) || [];
  pedidosDueño.push(nuevoPedido);
  localStorage.setItem('pedidos_negocio', JSON.stringify(pedidosDueño));

  cerrarPago();
  carrito = [];
  actualizarCarritoUI();
  
  // Activar simulador de delivery en vivo
  iniciarSimulacionDelivery();
};

// 2. Simulador de Delivery en el Mapa
function iniciarSimulacionDelivery() {
  const tracker = document.getElementById('delivery-tracker');
  const status = document.getElementById('tracker-status');
  tracker.classList.remove('hidden');
  
  status.innerText = "🏪 Comercio aceptó el pedido. Preparando...";
  
  setTimeout(() => {
    status.innerText = "🛵 Motorizado recogió el pedido. ¡En ruta!";
  }, 4000);

  setTimeout(() => {
    status.innerText = "📍 El motorizado está a 2 minutos de tu ubicación.";
  }, 8000);

  setTimeout(() => {
    status.innerText = "✅ ¡Pedido entregado con éxito! Disfrute su compra.";
    setTimeout(() => { tracker.classList.add('hidden'); }, 4000);
  }, 12000);
}

// 3. Sistema de Estrellas y Reseñas en el Popup del Mapa (Inyectado al renderizar)
// Agregamos la sección de calificación de estrellas en el HTML del popup de los negocios
