import os
import json
import math
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="Convenience API - Santo Domingo",
    version="0.4.0",
    description="Super-app de descubrimiento local con IA, ofertas relámpago y panel dueño"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================== MODELS ======================

class ChatQuery(BaseModel):
    mensaje: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    radio_km: Optional[float] = 3.0

class PagoModel(BaseModel):
    orderID: str
    monto: Optional[str] = None

class OfertaCreate(BaseModel):
    negocio_id: str
    titulo: str
    descripcion: str = ""
    descuento_porcentaje: int = Field(ge=5, le=80)
    precio_original: float
    precio_oferta: float
    minutos_activo: int = 120
    stock: int = 20
    tipo: str = "relampago"

class MenuItem(BaseModel):
    id: str
    negocio_id: str
    nombre: str
    precio: float
    moneda: str = "DOP"
    categoria: str = "general"
    tags: List[str] = []
    disponible: bool = True

# ====================== DATA ======================

def cargar_negocios():
    if os.path.exists("negocios.json"):
        with open("negocios.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("negocios", data if isinstance(data, list) else [])
    return []

def cargar_ofertas():
    if os.path.exists("ofertas.json"):
        with open("ofertas.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def guardar_ofertas(ofertas):
    with open("ofertas.json", "w", encoding="utf-8") as f:
        json.dump(ofertas, f, ensure_ascii=False, indent=2)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ====================== ENDPOINTS BÁSICOS ======================

@app.get("/health")
def health_check():
    negocios = cargar_negocios()
    ofertas = cargar_ofertas()
    return {
        "status": "ok",
        "version": "0.4.0",
        "total_negocios": len(negocios),
        "ofertas_activas": len([o for o in ofertas if o.get("activa")]),
        "ciudad": "Santo Domingo"
    }

@app.get("/", response_class=HTMLResponse)
def home():
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8") as file:
            return HTMLResponse(content=file.read())
    return HTMLResponse(content="<h1>Convenience Online</h1>")

@app.get("/dueno", response_class=HTMLResponse)
def panel_dueno():
    if os.path.exists("dueno.html"):
        with open("dueno.html", "r", encoding="utf-8") as file:
            return HTMLResponse(content=file.read())
    return HTMLResponse(content="<h1>Panel Dueño - Convenience</h1><p>Archivo dueno.html no encontrado</p>")

@app.get("/manifest.json")
def get_manifest():
    if os.path.exists("manifest.json"):
        return FileResponse("manifest.json", media_type="application/json")
    return JSONResponse(status_code=404, content={"error": "Manifest no encontrado"})

@app.get("/service-worker.js")
def get_sw():
    if os.path.exists("service-worker.js"):
        return FileResponse("service-worker.js", media_type="application/javascript")
    return JSONResponse(status_code=404, content={"error": "Service Worker no encontrado"})

@app.get("/api/negocios")
def obtener_negocios(
    categoria: Optional[str] = None,
    q: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radio_km: float = 5.0,
    solo_abiertos: bool = False,
    solo_destacados: bool = False
):
    negocios = cargar_negocios()
    resultados = []

    for n in negocios:
        if solo_abiertos and not n.get("abierto_ahora", True):
            continue
        if solo_destacados and not n.get("destacado", False):
            continue
        if categoria and categoria.lower() not in n.get("categoria", "").lower() and categoria.lower() not in n.get("subcategoria", "").lower():
            continue
        if q:
            texto = f"{n.get('nombre','')} {n.get('descripcion','')} {n.get('categoria','')} {' '.join(n.get('tags',[]))}".lower()
            if q.lower() not in texto:
                continue

        item = dict(n)
        if lat is not None and lon is not None and n.get("lat") and n.get("lon"):
            dist = haversine(lat, lon, n["lat"], n["lon"])
            if dist > radio_km:
                continue
            item["distancia_km"] = round(dist, 2)
            item["distancia_texto"] = f"{int(dist*1000)} m" if dist < 1 else f"{dist:.1f} km"

        resultados.append(item)

    # Ordenar por distancia si hay coords, sino por rating
    if lat is not None and lon is not None:
        resultados.sort(key=lambda x: x.get("distancia_km", 999))
    else:
        resultados.sort(key=lambda x: (-x.get("rating", 0), -x.get("reviews", 0)))

    return {"total": len(resultados), "negocios": resultados[:80]}

# ====================== dAcliass IA ======================

@app.post("/api/dacliass")
def chat_dacliass(query: ChatQuery):
    texto = query.mensaje.lower().strip()
    negocios = cargar_negocios()
    ofertas = [o for o in cargar_ofertas() if o.get("activa")]

    # Keywords de intención
    palabras_dulce = ["dulce", "helado", "hielo", "frío", "postre", "chocolate", "vainilla", "pistacho", "bon", "nieve"]
    palabras_cafe = ["café", "cafe", "cappuccino", "latte", "espresso", "mañana"]
    palabras_comida = ["pizza", "burger", "hamburguesa", "comida", "almuerzo", "cena", "hambre", "taco", "sancocho", "mofongo"]
    palabras_barato = ["barato", "económico", "menos de", "bajo", "oferta", "descuento", "promo"]
    palabras_cerca = ["cerca", "cerca de mí", "aquí", "rápido", "ya"]

    es_dulce = any(p in texto for p in palabras_dulce)
    es_cafe = any(p in texto for p in palabras_cafe)
    es_comida = any(p in texto for p in palabras_comida)
    quiere_barato = any(p in texto for p in palabras_barato)
    quiere_cerca = any(p in texto for p in palabras_cerca) or query.lat is not None

    candidatos = []

    for n in negocios:
        score = 0
        nombre = n.get("nombre", "").lower()
        cat = n.get("categoria", "").lower()
        sub = n.get("subcategoria", "").lower()
        tags = [t.lower() for t in n.get("tags", [])]
        desc = n.get("descripcion", "").lower()

        # Match directo por palabras del mensaje
        for palabra in texto.split():
            if len(palabra) < 3:
                continue
            if palabra in nombre or palabra in cat or palabra in sub or palabra in desc or any(palabra in t for t in tags):
                score += 3

        if es_dulce and ("heladeria" in cat or "helado" in sub or "dulce" in tags or "postre" in tags):
            score += 5
        if es_cafe and ("cafe" in cat or "café" in cat or "cafeteria" in cat):
            score += 5
        if es_comida and cat in ["restaurante", "comida", "fast food"]:
            score += 3

        if quiere_barato and n.get("precio") in ["$", "$$"]:
            score += 2

        if n.get("destacado"):
            score += 1
        if n.get("abierto_ahora", True):
            score += 1

        dist = None
        if query.lat is not None and query.lon is not None and n.get("lat") and n.get("lon"):
            dist = haversine(query.lat, query.lon, n["lat"], n["lon"])
            if dist <= (query.radio_km or 3.0):
                score += max(0, 4 - dist)  # más cerca = más score
            else:
                continue  # fuera de radio

        if score > 0:
            candidatos.append({
                "negocio": n,
                "score": score,
                "distancia_km": round(dist, 2) if dist is not None else None
            })

    candidatos.sort(key=lambda x: (-x["score"], x["distancia_km"] or 999))

    if not candidatos:
        # Fallback genérico inteligente
        return {
            "respuesta": f"🤖 dAcliass: Analicé tu búsqueda ‘{query.mensaje}’ en Santo Domingo. Tengo 500+ comercios con precios transparentes y ofertas relámpago. Prueba con ‘helado frío’, ‘café cerca’ o ‘pizza barata’.",
            "recomendaciones": [],
            "ofertas_activas": len(ofertas)
        }

    top = candidatos[:4]
    recomendaciones = []
    for c in top:
        n = c["negocio"]
        dist_txt = f" a {c['distancia_km']} km" if c["distancia_km"] is not None else ""
        recomendaciones.append({
            "id": n.get("id"),
            "nombre": n.get("nombre"),
            "categoria": n.get("categoria"),
            "rating": n.get("rating"),
            "precio": n.get("precio"),
            "direccion": n.get("direccion"),
            "distancia_km": c["distancia_km"],
            "abierto": n.get("abierto_ahora", True),
            "tags": n.get("tags", [])[:4]
        })

    # Construir respuesta natural
    primero = top[0]["negocio"]
    dist_txt = f" a solo {top[0]['distancia_km']} km" if top[0]["distancia_km"] is not None else ""

    respuesta = f"🤖 dAcliass: Encontré **{primero['nombre']}**{dist_txt}. "
    if primero.get("rating"):
        respuesta += f"Rating {primero['rating']}/5. "
    if primero.get("precio"):
        respuesta += f"Rango {primero['precio']}. "
    if ofertas:
        respuesta += f"Hay {len(ofertas)} ofertas relámpago activas ahora mismo. "
    respuesta += "Te dejé las mejores opciones abajo. ¿Quieres que te arme la ruta?"

    return {
        "respuesta": respuesta,
        "recomendaciones": recomendaciones,
        "ofertas_activas": len(ofertas),
        "query_original": query.mensaje
    }

# ====================== OFERTAS RELÁMPAGO ======================

@app.get("/api/ofertas")
def listar_ofertas(solo_activas: bool = True):
    ofertas = cargar_ofertas()
    if solo_activas:
        ahora = datetime.utcnow().isoformat()
        ofertas = [o for o in ofertas if o.get("activa") and o.get("expira", "9999") > ahora]
    return {"total": len(ofertas), "ofertas": ofertas}

@app.post("/api/ofertas")
def crear_oferta(oferta: OfertaCreate):
    ofertas = cargar_ofertas()
    nueva = {
        "id": f"oferta_{len(ofertas)+1:03d}",
        "negocio_id": oferta.negocio_id,
        "titulo": oferta.titulo,
        "descripcion": oferta.descripcion,
        "descuento_porcentaje": oferta.descuento_porcentaje,
        "precio_original": oferta.precio_original,
        "precio_oferta": oferta.precio_oferta,
        "moneda": "DOP",
        "activa": True,
        "creada": datetime.utcnow().isoformat(),
        "expira": (datetime.utcnow() + timedelta(minutes=oferta.minutos_activo)).isoformat(),
        "stock": oferta.stock,
        "tipo": oferta.tipo
    }
    ofertas.append(nueva)
    guardar_ofertas(ofertas)
    return {"status": "ok", "oferta": nueva}

@app.post("/api/ofertas/{oferta_id}/desactivar")
def desactivar_oferta(oferta_id: str):
    ofertas = cargar_ofertas()
    for o in ofertas:
        if o["id"] == oferta_id:
            o["activa"] = False
            guardar_ofertas(ofertas)
            return {"status": "ok", "mensaje": "Oferta desactivada"}
    raise HTTPException(status_code=404, detail="Oferta no encontrada")

# ====================== PAGO / CUPÓN ======================

@app.post("/api/confirmar-pago")
def confirmar_pago(datos: PagoModel):
    return JSONResponse(
        status_code=200,
        content={
            "status": "exitoso",
            "orderID": datos.orderID,
            "mensaje": "Pago procesado y cupón generado correctamente.",
            "comision_estimada": 1.5
        }
    )

# ====================== NOTIFICACIONES SIMULADAS ======================

@app.get("/api/notificaciones/sugeridas")
def notificaciones_sugeridas(
    hora: Optional[int] = None,
    lat: Optional[float] = 18.4861,
    lon: Optional[float] = -69.9312
):
    """Simula el motor de notificaciones por hora + ubicación"""
    h = hora if hora is not None else datetime.now().hour
    negocios = cargar_negocios()

    sugerencias = []

    if 7 <= h <= 10:
        # Mañana → café
        cafes = [n for n in negocios if "cafe" in n.get("categoria", "").lower() or "café" in n.get("nombre", "").lower()][:3]
        for c in cafes:
            sugerencias.append({
                "tipo": "antojo_manana",
                "titulo": f"Café recién hecho cerca de ti ☕",
                "cuerpo": f"Sé que te costó levantarte... {c['nombre']} tiene descuento de mañana.",
                "negocio_id": c["id"],
                "accion": "ver_oferta"
            })
    elif 13 <= h <= 16:
        # Tarde calurosa → helado
        helados = [n for n in negocios if "heladeria" in n.get("categoria", "").lower() or "helado" in n.get("nombre", "").lower()][:3]
        for h_ in helados:
            sugerencias.append({
                "tipo": "antojo_tarde",
                "titulo": f"🍦 Helado relámpago",
                "cuerpo": f"Día caluroso. {h_['nombre']} tiene promo 2x1 por las próximas 2 horas.",
                "negocio_id": h_["id"],
                "accion": "ver_oferta"
            })
    elif 18 <= h <= 22:
        # Noche → comida
        restos = [n for n in negocios if n.get("categoria") == "restaurante" and n.get("destacado")][:3]
        for r in restos:
            sugerencias.append({
                "tipo": "combo_noche",
                "titulo": f"🍔 Combo familiar cerca",
                "cuerpo": f"{r['nombre']} tiene combo especial esta noche. Ruta lista.",
                "negocio_id": r["id"],
                "accion": "ver_ruta"
            })

    # Geofence simulado (negocios muy cerca)
    if lat and lon:
        for n in negocios:
            if n.get("lat") and n.get("lon"):
                dist = haversine(lat, lon, n["lat"], n["lon"])
                if dist < 0.08:  # ~80 metros
                    sugerencias.insert(0, {
                        "tipo": "geofence",
                        "titulo": f"Estás a {int(dist*1000)}m de {n['nombre']}",
                        "cuerpo": "Tienen espacio libre y 15% de descuento si entras en los próximos 10 minutos.",
                        "negocio_id": n["id"],
                        "accion": "entrar_ya"
                    })
                    break

    return {"hora": h, "sugerencias": sugerencias[:5]}
