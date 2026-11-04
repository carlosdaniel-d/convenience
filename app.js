// Inicializar mapa centrado en Santo Domingo
const map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 13);

// Capa oscura estilo Uber (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd',
  attribution: '&copy; CARTO'
}).addTo(map);

// Mover los controles de zoom a la esquina inferior derecha
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Cargar los datos de negocios.json
async function cargarNegocios() {
  try {
    const response = await fetch('negocios.json');
    if (!response.ok) throw new Error('No se pudo cargar el archivo negocios.json');
    
    const data = await response.json();
    const listaNegocios = data.negocios || data;

    listaNegocios.forEach(negocio => {
      if (!negocio.ubicacion?.latitud || !negocio.ubicacion?.longitud) return;

      // Crear marcador simple
      const marker = L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud]).addTo(map);

      // Contenido del Popup
      const popupHtml = `
        <div style="color: #111; font-family: Inter, sans-serif;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${negocio.nombre}</h3>
          <p style="font-size: 12px; color: #555; margin: 0;">${negocio.categoria}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });

    console.log(`Se cargaron ${listaNegocios.length} negocios correctamente.`);
  } catch (error) {
    console.error("Error al procesar los negocios:", error);
  }
}

cargarNegocios();
