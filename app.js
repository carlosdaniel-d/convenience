// ==========================================
// CONFIGURACIÓN INICIAL DEL MAPA
// ==========================================
// Coordenadas iniciales centradas en Santo Domingo
const map = L.map('map', { zoomControl: false }).setView([18.4861, -69.9312], 13);

// Capa de mapa limpia de OpenStreetMap (Sin errores de API Key)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Mover los controles de zoom a la esquina inferior derecha
L.control.zoom({ position: 'bottomright' }).addTo(map);


// ==========================================
// CARGA DE DATOS DESDE NEGOCIOS.JSON
// ==========================================
async function cargarNegocios() {
  try {
    const response = await fetch('negocios.json');
    if (!response.ok) throw new Error('No se pudo cargar el archivo negocios.json');
    
    const data = await response.json();
    const listaNegocios = data.negocios || data;

    listaNegocios.forEach(negocio => {
      if (!negocio.ubicacion?.latitud || !negocio.ubicacion?.longitud) return;

      // Crear marcador en el mapa
      const marker = L.marker([negocio.ubicacion.latitud, negocio.ubicacion.longitud]).addTo(map);

      // Contenido estilizado del Popup para cada comercio
      const popupHtml = `
        <div style="color: #111; font-family: Inter, sans-serif; padding: 4px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${negocio.nombre || 'Comercio'}</h3>
          <p style="font-size: 12px; color: #555; margin: 0;">${negocio.categoria || 'Convenience'} • ${negocio.direccion?.sector || 'Santo Domingo'}</p>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });

    console.log(`Se cargaron ${listaNegocios.length} negocios correctamente.`);
  } catch (error) {
    console.error("Error al procesar los negocios:", error);
  }
}

// Ejecutar la función al cargar el script
cargarNegocios();
