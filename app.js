// Centrado en Santo Domingo, República Dominicana
const latInicial = 18.4861;
const lngInicial = -69.9312;

// Inicializar el mapa
const map = L.map('map', {
  zoomControl: false // Ocultamos los botones (+/-) por defecto para mayor limpieza
}).setView([latInicial, lngInicial], 13);

// Capa de mapa estilo Uber / Dark Mode (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd',
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
}).addTo(map);

// Reposicionar el control de Zoom abajo a la derecha
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Cargar y mostrar los comercios desde el JSON
async function cargarNegocios() {
  try {
    const response = await fetch('negocios.json');
    const data = await response.json();
    
    data.negocios.forEach(negocio => {
      // Crear un marcador visual personalizado
      const customIcon = L.divIcon({
        className: 'custom-pin-container',
        html: `<div class="custom-pin">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      // Crear Popup con diseño moderno
      const popupContent = `
        <div class="popup-card">
          <h3>${negocio.nombre}</h3>
          <p>${negocio.categoria} • ${negocio.direccion.sector}</p>
          <span class="tag">${negocio.meta?.destacado ? '🔥 Populares' : 'Abierto'}</span>
        </div>
      `;

      // Agregar marcador al mapa
      L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });
  } catch (error) {
    console.error("Error cargando los negocios:", error);
  }
}

cargarNegocios();
