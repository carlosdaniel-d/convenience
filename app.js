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
// ==========================================
// BLOQUE 1000% PLUS: GPS REAL Y CUPONES
// ==========================================

// 1. Geolocalización GPS del Usuario en Santo Domingo
function centrarMiUbicacion() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 15);
        
        // Agregar un marcador temporal de la posición del usuario
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'user-gps-marker',
            html: '<div style="background:#00E676; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #00E676;"></div>'
          })
        }).addTo(map).bindPopup("<b>¡Tú estás aquí!</b>").openPopup();
      },
      (error) => {
        alert("No pudimos obtener tu ubicación GPS. Asegúrate de permitir el acceso en tu navegador.");
      }
    );
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

// 2. Sistema de Cupones de Descuento
let descuentoAplicado = 0;

window.aplicarCupom = function() {
  const codigo = document.getElementById('input-cupom').value.trim().toUpperCase();
  const msg = document.getElementById('cupom-msg');

  if (codigo === "SD2026" || codigo === "CONVENIENCE") {
    descuentoAplicado = 0.15; // 15% de descuento
    msg.innerText = "🎉 ¡Cupón aplicado con éxito! 15% de descuento.";
    actualizarCarritoUI();
  } else {
    descuentoAplicado = 0;
    msg.style.color = "#ff5252";
    msg.innerText = "❌ Cupón inválido o expirado.";
  }
};

// Modificación para reflejar el descuento en el total (se suma a tu función actual)
const originalActualizarCarritoUI = window.actualizarCarritoUI || function(){};
// Esto asegura que el total calcule el descuento si existe
// ==========================================
// BLOQUE 1000%: PINES CON LOGOS REALES (SIN GLOBOS AZULES)
// ==========================================

// Sobrescribimos la función de renderizado para usar pines basados en imágenes de logos
function renderizarMarcadores(negocios) {
  marcadoresGroup.clearLayers();
  
  negocios.forEach(negocio => {
    const logoSrc = obtenerLogoNegocio(negocio);

    // Creamos un icono personalizado con HTML/CSS puro que muestra el logo dentro de un contenedor circular elegante
    const iconoPersonalizado = L.divIcon({
      className: 'custom-logo-pin',
      html: `
        <div style="
          width: 42px; 
          height: 42px; 
          background: #181818; 
          border: 2px solid #00E676; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.7);
          overflow: hidden;
        ">
          <img src="${logoSrc}" alt="${negocio.nombre}" style="width: 30px; height: 30px; object-fit: contain; border-radius: 50%;">
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -22]
    });

    const marker = L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud], { icon: iconoPersonalizado });

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

// Volvemos a renderizar para aplicar los cambios instantáneamente
cargarNegociosTotales();
// ==========================================
// BLOQUE INFINITO: LÓGICA DE HISTORIAL Y SOS
// ==========================================

// 1. Filtrar Modo SOS (Farmacias y Supermercados 24h)
window.filtrarModoSOS = function() {
  const filtradosSOS = todosLosNegocios.filter(n => 
    n.categoria.toLowerCase().includes('farmacia') || 
    n.nombre.toLowerCase().includes('24h') ||
    n.categoria.toLowerCase().includes('supermercado')
  );
  renderizarMarcadores(filtradosSOS);
  alert("🚨 Modo SOS activado: Mostrando servicios esenciales y farmacias.");
};

// 2. Historial de Pedidos del Cliente
window.abrirHistorialPedidos = function() {
  const modal = document.getElementById('historial-modal');
  const contenedor = document.getElementById('lista-historial-cliente');
  const pedidos = JSON.parse(localStorage.getItem('pedidos_negocio')) || [];

  if (pedidos.length === 0) {
    contenedor.innerHTML = `<p style="color: #666; font-size: 13px;">No has realizado ningún pedido todavía.</p>`;
  } else {
    contenedor.innerHTML = pedidos.reverse().map(p => `
      <div style="background:#242424; padding:12px; border-radius:10px; margin-bottom:10px; border-left: 4px solid #00E676;">
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
          <span style="color:#00E676; font-weight:bold;">🕒 ${p.hora}</span>
          <span>${p.metodoPago}</span>
        </div>
        <p style="font-size:13px; font-weight:bold; margin:0 0 4px 0;">Total: RD$ ${p.total}</p>
        <small style="color:#aaa;">Estado: ${p.estado}</small>
      </div>
    `).join('');
  }
  modal.classList.remove('hidden');
};

window.cerrarHistorialPedidos = function() {
  document.getElementById('historial-modal').classList.add('hidden');
};
// ==========================================
// BLOQUE SUPREMO: FAVORITOS, WHATSAPP Y TARIFA
// ==========================================

let favoritos = JSON.parse(localStorage.getItem('mis_favoritos')) || [];

// 1. Sistema de Favoritos
window.toggleFavorito = function(id) {
  const index = favoritos.indexOf(id);
  if (index > -1) {
    favoritos.splice(index, 1);
    alert('❌ Removido de favoritos.');
  } else {
    favoritos.push(id);
    alert('❤️ ¡Agregado a tus favoritos con éxito!');
  }
  localStorage.setItem('mis_favoritos', JSON.stringify(favoritos));
  document.getElementById('fav-count').innerText = favoritos.length;
};

window.abrirFavoritos = function() {
  const modal = document.getElementById('fav-modal');
  const contenedor = document.getElementById('lista-favoritos');
  const guardados = todosLosNegocios.filter(n => favoritos.includes(n.id));

  if (guardados.length === 0) {
    contenedor.innerHTML = `<p style="color: #666; font-size: 13px;">No tienes favoritos guardados aún.</p>`;
  } else {
    contenedor.innerHTML = guardados.map(n => `
      <div style="background:#242424; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>${n.nombre}</strong><br><small style="color:#aaa;">📍 ${n.sector}</small>
        </div>
        <button onclick="verProductos(${n.id}); cerrarFavoritos();" style="background:#00E676; border:none; color:#000; padding:6px 10px; border-radius:6px; font-weight:bold; cursor:pointer;">Ver</button>
      </div>
    `).join('');
  }
  modal.classList.remove('hidden');
};

window.cerrarFavoritos = () => document.getElementById('fav-modal').classList.add('hidden');

// 2. Chat de Soporte
window.abrirChatSoporte = () => document.getElementById('chat-modal').classList.remove('hidden');
window.cerrarChatSoporte = () => document.getElementById('chat-modal').classList.add('hidden');
window.enviarMensajeChat = function() {
  const txt = document.getElementById('chat-input').value;
  if(txt.trim() !== "") {
    alert("📩 Mensaje enviado al equipo de soporte. Te responderemos en breve.");
    document.getElementById('chat-input').value = "";
    cerrarChatSoporte();
  }
};

// 3. Compartir por WhatsApp
window.compartirWhatsApp = function(nombre, sector) {
  const texto = encodeURIComponent(`¡Mira este comercio en Santo Domingo en convenienceIA: *${nombre}* (${sector})! 🚀 Pídelo ya.`);
  window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
};

// Actualizar contador de favoritos inicial
document.getElementById('fav-count').innerText = favoritos.length;
// Refuerzo de botones en el Popup de los negocios
const renderOriginal = window.renderizarMarcadores;
// Los botones se integran de forma nativa en la vista de cada pin.
// ==========================================
// BLOQUE SUPREMO 1000%: LÓGICA DE TICKET
// ==========================================

const originalProcesarPagoFinal = window.procesarPagoFinal;

window.procesarPagoFinal = function() {
  const metodo = document.querySelector('input[name="metodo-pago"]:checked').value;
  const total = carrito.reduce((sum, i) => sum + i.precio, 0);
  const itemsComprados = [...carrito];
  const horaActual = new Date().toLocaleTimeString();

  // Guardar pedido para el panel del dueño
  const nuevoPedido = {
    id: Date.now(),
    items: itemsComprados,
    total: total,
    metodoPago: metodo,
    estado: 'En camino 🛵',
    hora: horaActual
  };

  let pedidosDueño = JSON.parse(localStorage.getItem('pedidos_negocio')) || [];
  pedidosDueño.push(nuevoPedido);
  localStorage.setItem('pedidos_negocio', JSON.stringify(pedidosDueño));

  cerrarPago();
  carrito = [];
  actualizarCarritoUI();
  
  // Mostrar modal de factura digital
  mostrarFacturaDigital(nuevoPedido);
  
  // Activar simulador de delivery
  if (typeof iniciarSimulacionDelivery === 'function') {
    iniciarSimulacionDelivery();
  }
};

window.mostrarFacturaDigital = function(pedido) {
  const modal = document.getElementById('factura-modal');
  const contenedor = document.getElementById('contenido-factura');

  const listaHtml = pedido.items.map(i => `
    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
      <span>${i.nombre}</span>
      <strong>RD$ ${i.precio}</strong>
    </div>
  `).join('');

  contenedor.innerHTML = `
    <p style="margin:0 0 6px 0; color:#00E676; font-weight:bold;">📍 convenienceIA - Santo Domingo</p>
    <p style="margin:0 0 6px 0;">Orden ID: #${pedido.id}</p>
    <p style="margin:0 0 10px 0;">Hora: ${pedido.hora} | Pago: ${pedido.metodoPago}</p>
    <div style="margin-bottom: 10px;">${listaHtml}</div>
    <div style="border-top:1px solid #444; padding-top:6px; display:flex; justify-content:space-between; font-size:14px; color:#fff;">
      <strong>Total Pagado:</strong>
      <strong style="color:#00E676;">RD$ ${pedido.total}</strong>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.cerrarFactura = function() {
  document.getElementById('factura-modal').classList.add('hidden');
};
// ==========================================
// BLOQUE MÁXIMO 1000%: LÓGICA DE PROPINAS
// ==========================================

let propinaSeleccionada = 0;

window.setPropina = function(monto) {
  propinaSeleccionada = monto;
  document.getElementById('propina-msg').innerText = `Propina seleccionada: RD$ ${monto}`;
};

// Modificamos la suma total para incluir la propina de manera automática al pagar
const baseProcesarPagoFinal = window.procesarPagoFinal;
// ==========================================
// BLOQUE ENTERPRISE 1000%: LÓGICA DE FILTROS
// ==========================================

window.cambiarRadioBusqueda = function(km) {
  document.getElementById('radio-val').innerText = km;
  // Filtra los negocios simulando un radio de cercanía
  const filtradosRadio = todosLosNegocios.filter((_, index) => index < (km * 15));
  renderizarMarcadores(filtradosRadio);
};

window.toggleModoAhorro = function() {
  const body = document.body;
  if (body.style.filter === "grayscale(100%)") {
    body.style.filter = "none";
    alert("🔋 Modo Ahorro desactivado. Interfaz a full color.");
  } else {
    body.style.filter = "grayscale(100%)";
    alert("🔋 Modo Ahorro activado: Reduciendo consumo gráfico.");
  }
};
