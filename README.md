# Convenience 🛒

**Super-app de descubrimiento local con IA para Santo Domingo y República Dominicana.**

Convenience no espera a que busques. Te empuja el antojo exacto en el momento exacto usando **hora + clima real + ubicación + historial**.

> “Sé que te acaba de costar levantarte... y creo que necesitas un café recién hecho a 2 minutos de ti.”

---

## 🚀 Estado actual (v0.5)

| Módulo | Estado |
|--------|--------|
| Mapa interactivo (Leaflet) | ✅ |
| 500+ negocios reales SD | ✅ |
| **Clima real (Open-Meteo)** | ✅ |
| dAcliass (IA + clima + menús) | ✅ |
| Ofertas Relámpago | ✅ |
| **Menús con precios** | ✅ |
| **Sistema de cupones + comisión** | ✅ |
| Panel Dueño | ✅ |
| Notificaciones + geofencing | ✅ |
| **Push notifications (Web)** | ✅ (permiso + SW listo) |
| PWA | ✅ |

---

## Nuevas capacidades v0.5

### 1. Clima real
- Endpoint `/api/clima` usa **Open-Meteo** (sin API key).
- dAcliass y las notificaciones se adaptan: día caluroso → empuja helado, lluvia → sugiere delivery/caliente.

### 2. Menús con precios
- `menus.json` + endpoints `/api/menus` y `/api/menus/{negocio_id}`.
- dAcliass muestra ítems reales con precio en DOP.

### 3. Sistema de cupones
- Generar: `POST /api/cupones/generar?oferta_id=...` → código `CONV-XXXXXX`
- Canjear en caja: `POST /api/cupones/canjear` `{ "codigo": "CONV-XXXX" }`
- Cada canje genera comisión de **$1.5 USD** (configurable).

### 4. Push notifications
- Botón “Activar Push” pide permiso.
- Service Worker listo para recibir push reales.
- Notificaciones del sistema cuando hay permiso + toast in-app siempre.

---

## Cómo correr

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- App: http://localhost:8000
- Panel dueño: http://localhost:8000/dueno
- API docs: http://localhost:8000/docs
- Clima: http://localhost:8000/api/clima

---

## Endpoints clave

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clima` | Clima real Santo Domingo |
| POST | `/api/dacliass` | Chat IA contextual |
| GET | `/api/ofertas` | Ofertas activas |
| POST | `/api/ofertas` | Crear oferta relámpago |
| GET | `/api/menus` | Menús |
| POST | `/api/cupones/generar` | Generar cupón |
| POST | `/api/cupones/canjear` | Canjear cupón |
| GET | `/api/notificaciones/sugeridas` | Sugerencias por hora+clima |

---

## Roadmap siguiente

- [ ] Integrar OneSignal / Firebase para push backend real
- [ ] VAPID keys + envío masivo de push
- [ ] Más ítems de menú por negocio
- [ ] Dashboard de comisiones para dueños
- [ ] App nativa (React Native + Expo)

Hecho con ambición desde Santo Domingo 🇩🇴
