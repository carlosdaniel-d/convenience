// ==========================================
// 1. CONFIGURACIÓN DEL MAPA
// ==========================================
const map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 13);

// Capa limpia de OpenStreetMap (sin requerir API Key)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let todosLosNegocios = [];
let marcadoresGroup = L.layerGroup().addTo(map);

// ==========================================
// 2. GENERADOR DE 300 NEGOCIOS EN SANTO DOMINGO
// ==========================================
const sectoresSD = [
  { nombre: "Piantini", lat: 18.4750, lng: -69.9380 },
  { nombre: "Naco", lat: 18.4795, lng: -69.9330 },
  { nombre: "Bella Vista", lat: 18.4550, lng: -69.9480 },
  { nombre: "Evaristo Morales", lat: 18.4690, lng: -69.9420 },
  { nombre: "Gazcue", lat: 18.4680, lng: -69.8980 },
  { nombre: "Zona Colonial", lat: 18.4730, lng: -69.8850 },
  { nombre: "Los Cacicazgos", lat: 18.4480, lng: -69.9650 },
  { nombre: "Mirador Sur", lat: 18.4450, lng: -69.9520 },
  { nombre: "Arroyo Hondo", lat: 18.5050, lng: -69.9350 },
  { nombre: "Ensanche Quisqueya", lat: 18.4780, lng: -69.9480 }
];

const tiposNegocios = [
  { cat: "Supermercado", nombres: ["Supermercado Nacional", "Sirena Market", "Jumbo", "Carrefour Express"] },
  { cat: "Farmacia 24h", nombres: ["Farmacia Carol", "Farmacia GBC", "Farmacia Los Hidalgos"] },
  { cat: "Bebidas & Licores", nombres: ["El Catador", "Liquor Store 24/7", "La Enoteca", "Drink Point"] },
  { cat: "Comida Rápida & Delivery", nombres: ["Pizzería Gourmet", "Burger Craft", "Sushi Lounge", "Tacos & Co."] },
  { cat: "Conveniencia", nombres: ["Colmado Premium", "Express Mart", "Mini Market SD"] }
];

function generar300Negocios() {
  const lista = [];
  let idCounter = 1;

  for (let i = 0; i < 300; i++) {
    const sector = sectoresSD[i % sectoresSD.length];
    const tipo = tiposNegocios[i % tiposNegocios.length];
    const nombreBase = tipo.nombres[Math.floor(Math.random() * tipo.nombres.length)];

    // Variación aleatoria de coordenadas alrededor del sector
    const latOffset = (Math.random() - 0.5) * 0.025;
    const lngOffset = (Math.random() - 0.5) * 0.025;

    lista.push({
      id: idCounter++,
      nombre: `${nombreBase} ${sector.nombre} #${Math.floor(Math.random() * 90 + 10)}`,
      categoria: tipo.cat,
      sector: sector.nombre,
      ubicacion: {
        latitud: sector.lat + latOffset,
        longitud: sector.lng + lngOffset
      }
    });
  }
  return lista;
}

// ==========================================
// 3. RENDERIZADO DE MARCADORES Y BÚSQUEDA
// ==========================================
function renderizarMarcadores(negocios) {
  marcadoresGroup.clearLayers();

  negocios.forEach(negocio => {
    const marker = L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud]);

    const popupHtml = `
      <div style="font-family: Inter, sans-serif; padding: 4px; color: #111;">
        <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${negocio.nombre}</h4>
        <span style="display: inline-block; background: #00E676; color: #000; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
          ${negocio.categoria}
        </span>
        <p style="margin: 0; font-size: 12px; color: #666;">📍 ${negocio.sector}, Santo Domingo</p>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marcadoresGroup.addLayer(marker);
  });
}

async function inicializarApp() {
  try {
    // Intentar obtener de negocios.json si existe datos locales
    const res = await fetch('negocios.json');
    if (res.ok) {
      const data = await res.json();
      const datosJson = data.negocios || data;
      if (Array.isArray(datosJson) && datosJson.length >= 300) {
        todosLosNegocios = datosJson;
      } else {
        todosLosNegocios = generar300Negocios();
      }
    } else {
      todosLosNegocios = generar300Negocios();
    }
  } catch (e) {
    todosLosNegocios = generar300Negocios();
  }

  renderizarMarcadores(todosLosNegocios);
  console.log(`✅ ${todosLosNegocios.length} negocios cargados en el mapa.`);
}

// Configurar filtro en tiempo real en la barra de búsqueda
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase().trim();
      const filtrados = todosLosNegocios.filter(n =>
        n.nombre.toLowerCase().includes(texto) ||
        n.categoria.toLowerCase().includes(texto) ||
        n.sector.toLowerCase().includes(texto)
      );
      renderizarMarcadores(filtrados);
    });
  }
});

inicializarApp();
