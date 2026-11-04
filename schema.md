# Schema de datos — Convenience

## Negocio (ya existente en negocios.json)

```json
{
  "id": "neg_001",
  "nombre": "El Conuco",
  "categoria": "restaurante",
  "subcategoria": "comida típica",
  "descripcion": "...",
  "lat": 18.4712,
  "lon": -69.9025,
  "direccion": "Calle El Conde 152, Zona Colonial",
  "telefono": "+1 809-682-3919",
  "whatsapp": "+18096823919",
  "horario": "11:00-23:00",
  "rating": 4.6,
  "reviews": 1240,
  "precio": "$$",
  "tags": ["típico", "familiar", "terraza"],
  "imagen": "https://...",
  "destacado": true,
  "abierto_ahora": true
}
```

## Oferta Relámpago (ofertas.json)

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
  "creada": "2026-11-04T14:00:00",
  "expira": "2026-11-04T16:00:00",
  "stock": 15,
  "tipo": "relampago"
}
```

## Ítem de Menú (futuro - menus.json)

```json
{
  "id": "item_001",
  "negocio_id": "neg_001",
  "nombre": "Sancocho Dominicano",
  "precio": 450,
  "moneda": "DOP",
  "categoria": "platos fuertes",
  "tags": ["típico", "caliente", "familiar"],
  "disponible": true,
  "imagen": null
}
```

## Cupón usado (para comisión)

```json
{
  "id": "cupon_001",
  "oferta_id": "oferta_001",
  "negocio_id": "neg_001",
  "usuario_id": "user_xxx",
  "codigo": "CONV-8F3A",
  "usado_en": "2026-11-04T15:22:00",
  "comision_usd": 1.5,
  "estado": "cobrado"
}
```
