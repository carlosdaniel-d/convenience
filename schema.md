# Schema de datos — Convenience v0.5

## Negocio
```json
{
  "id": "neg_001",
  "nombre": "El Conuco",
  "categoria": "restaurante",
  "lat": 18.4712,
  "lon": -69.9025,
  "rating": 4.6,
  "precio": "$$",
  "tags": ["típico"],
  "abierto_ahora": true,
  "destacado": true
}
```

## Oferta Relámpago
```json
{
  "id": "oferta_001",
  "negocio_id": "neg_001",
  "titulo": "2x1 Helado",
  "descuento_porcentaje": 50,
  "precio_original": 350,
  "precio_oferta": 175,
  "activa": true,
  "expira": "2026-11-04T18:00:00",
  "stock": 15
}
```

## Ítem de Menú
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

## Cupón
```json
{
  "id": "cup_xxx",
  "codigo": "CONV-A1B2C3",
  "oferta_id": "oferta_001",
  "negocio_id": "neg_001",
  "titulo": "2x1 Helado",
  "precio_oferta": 175,
  "generado": "2026-11-04T15:00:00",
  "usado": false,
  "comision_usd": 1.5,
  "estado": "activo"
}
```

## Clima (Open-Meteo)
Endpoint: `GET /api/clima?lat=18.48&lon=-69.93`
Devuelve temperatura real, sensación, lluvia, código WMO, flag `caluroso`.

## Endpoints nuevos v0.5
- `GET /api/clima`
- `GET /api/menus` / `GET /api/menus/{negocio_id}` / `POST /api/menus`
- `POST /api/cupones/generar?oferta_id=...`
- `POST /api/cupones/canjear` { "codigo": "CONV-XXXX" }
- `GET /api/cupones`
- `POST /api/push/subscribe`
