# Convenience 🛒

**Super-app de descubrimiento local con IA para Santo Domingo y República Dominicana.**

Convenience no espera a que busques. Te empuja el antojo exacto en el momento exacto usando **hora + clima + ubicación + historial**.

> “Sé que te acaba de costar levantarte... y creo que necesitas un café recién hecho a 2 minutos de ti.”

---

## 🚀 Estado actual (v0.4)

| Módulo | Estado |
|--------|--------|
| Mapa interactivo (Leaflet) | ✅ Funcional |
| 500+ negocios reales SD | ✅ Cargados |
| API FastAPI | ✅ Mejorada |
| dAcliass (IA contextual) | ✅ Mejorada (filtros reales) |
| Ofertas Relámpago | ✅ Estructura + endpoints |
| Panel Dueño (básico) | ✅ `/dueno` |
| Notificaciones simuladas | ✅ Frontend |
| Geofencing simulado | ✅ |
| PWA | ✅ |

---

## 🎯 Visión del producto

### 1. Motor de Notificaciones Inteligentes
- Hora del día + clima + antojos previos
- Ejemplos reales del pitch:
  - 8:00 AM → café cerca
  - 2:00 PM día caluroso → helado 2x1
  - Viernes 19:30 → combo familiar
  - Geofence 50m → “Estás a 50 metros de...”

### 2. Motor de Atracción y Descubrimiento
- Mapa con ruta y tiempo exacto
- Catálogo transparente con precios
- Descuentos dinámicos relámpago (el dueño los activa cuando el local está solo)

### 3. dAcliass — Asistente 24/7
- Texto o voz: “Tengo antojo de algo dulce y frío por menos de $10 cerca”
- Filtra menús, precios, rating, distancia, tags

### 4. Monetización
- Featured / pay-per-click / impresión
- Comisión por cupón usado ($1-2 USD)
- Suscripción dueños para analytics + posición preferente

---

## 📋 Roadmap

### Fase 1 — MVP mágico (actual → 2-3 semanas)
- [x] Mejorar dAcliass con filtrado real de negocios
- [x] Estructura de ofertas relámpago + menús
- [x] Panel dueño básico
- [x] Notificaciones y geofencing simulados
- [ ] Integrar clima real (OpenWeather)
- [ ] Persistencia de preferencias de usuario
- [ ] QR / código de cupón para comisión

### Fase 2 — Monetización
- [ ] Sistema de featured
- [ ] Tracking de cupones usados
- [ ] Dashboard analytics para dueños
- [ ] Stripe / PayPal para comisiones

### Fase 3 — Diferenciadores
- [ ] Notificaciones push reales (FCM / OneSignal)
- [ ] Geofencing nativo
- [ ] Integración WhatsApp Business para atención
- [ ] App nativa (React Native + Expo)
- [ ] Voz (Web Speech API + backend)

---

## 🔧 Stack técnico

- **Frontend**: HTML + Tailwind + Leaflet (PWA)
- **Backend**: FastAPI (Python)
- **Datos**: `negocios.json` (500+ negocios reales de Santo Domingo)
- **Mapas**: Leaflet + CartoDB
- **IA**: Reglas inteligentes + keywords (próximo: embeddings)

---

## 🚀 Cómo correr local

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Abre http://localhost:8000

- Usuario: `/`
- Panel dueño: `/dueno`
- API docs: `/docs`

---

## 📊 Estructura de datos clave

### Negocio (existente)
```json
{
  "id": "neg_001",
  "nombre": "El Conuco",
  "categoria": "restaurante",
  "lat": 18.4712,
  "lon": -69.9025,
  "rating": 4.6,
  "precio": "$$",
  "tags": ["típico", "familiar"],
  "abierto_ahora": true,
  "destacado": true
}
```

### Oferta Relámpago (nueva)
```json
{
  "id": "oferta_001",
  "negocio_id": "neg_001",
  "titulo": "2x1 Helado de Pistacho",
  "descripcion": "Válido solo las próximas 2 horas",
  "descuento_porcentaje": 50,
  "precio_original": 350,
  "precio_oferta": 175,
  "moneda": "DOP",
  "activa": true,
  "expira": "2026-11-04T18:00:00",
  "stock": 15,
  "tipo": "relampago"
}
```

### Ítem de menú (nueva estructura)
```json
{
  "id": "item_001",
  "negocio_id": "neg_001",
  "nombre": "Sancocho Dominicano",
  "precio": 450,
  "moneda": "DOP",
  "categoria": "platos fuertes",
  "tags": ["típico", "caliente"],
  "disponible": true
}
```

---

## 👤 Contribución

Este repo es el corazón de Convenience. Cualquier mejora en dAcliass, ofertas o UX se sube aquí.

Hecho con cariño y ambición desde Santo Domingo 🇩🇴
