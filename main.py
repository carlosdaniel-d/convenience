import os
import json
import math
import uuid
import httpx
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="Convenience API - Santo Domingo",
    version="0.5.0",
    description="Super-app de descubrimiento local con IA, clima real, menús, cupones y push"
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

class MenuItemCreate(BaseModel):
    negocio_id: str
    nombre: str
    precio: float
    moneda: str = "DOP"
    categoria: str = "general"
    tags: List[str] = []
    disponible: bool = True

class CuponRedeem(BaseModel):
    codigo: str
    negocio_id: Optional[str] = None

class PushSubscribe(BaseModel):
    endpoint: str
    keys: dict
    user_id: Optional[str] = None

# ====================== DATA HELPERS ======================

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

def cargar_menus():
    if os.path.exists("menus.json"):
        with open("menus.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def guardar_menus(menus):
    with open("menus.json", "w", encoding="utf-8") as f:
        json.dump(menus, f, ensure_ascii=False, indent=2)

def cargar_cupones():
    if os.path.exists("cupones.json"):
        with open("cupones.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def guardar_cupones(cupones):
    with open("cupones.json", "w", encoding="utf-8") as f:
        json.dump(cupones, f, ensure_ascii=False, indent=2)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ====================== CLIMA REAL (Open-Meteo) ======================

async def obtener_clima(lat: float = 18.4861, lon: float = -69.9312):
    """Clima real sin API key via Open-Meteo"""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "timezone": "America/Santo_Domingo",
        "temperature_unit": "celsius"
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            current = data.get("current", {})
            code = current.get("weather_code", 0)
            # Códigos WMO simplificados
            descripcion = {
                0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado", 3: "Nublado",
                45: "Niebla", 48: "Niebla", 51: "Llovizna ligera", 61: "Lluvia ligera",
                63: "Lluvia moderada", 65: "Lluvia fuerte", 80: "Chubascos", 95: "Tormenta"
            }.get(code, "Variable")
            temp = current.get("temperature_2m")
            feels = current.get("apparent_temperature")
            return {
                "ok": True,
                "temperatura": temp,
                "sensacion": feels,
                "humedad": current.get("relative_humidity_2m"),
                "precipitacion": current.get("precipitation", 0),
                "viento": current.get("wind_speed_10m"),
                "codigo": code,
                "descripcion": descripcion,
                "caluroso": temp is not None and temp >= 30,
                "lluvia": current.get("precipitation", 0) > 0 or code in [51,61,63,65,80,95],
                "ciudad": "Santo Domingo"
            }
    except Exception as e:
        return {"ok": False, "error": str(e), "temperatura": None, "caluroso": False, "lluvia": False}

@app.get("/api/clima")
async def clima_endpoint(lat: float = 18.4861, lon: float = -69.9312):
    return await obtener_clima(lat, lon)

# ====================== ENDPOINTS BÁSICOS ======================

@app.get("/health")
async def health_check():
    negocios = cargar_negocios()
    ofertas = cargar_ofertas()
    menus = cargar_menus()
    cupones = cargar_cupones()
    clima = await obtener_clima()
    return {
        "status": "ok",
        "version": "0.5.0",
        "total_negocios": len(negocios),
        "ofertas_activas": len([o for o in ofertas if o.get("activa")]),
        "items_menu": len(menus),
        "cupones_generados": len(cupones),
        "clima": {"temp": clima.get("temperatura"), "desc": clima.get("descripcion")},
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
    return HTMLResponse(content="<h1>Panel Dueño</h1>")

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
    if lat is not None and lon is not None:
        resultados.sort(key=lambda x: x.get("distancia_km", 999))
    else:
        resultados.sort(key=lambda x: (-x.get("rating", 0), -x.get("reviews", 0)))
    return {"total": len(resultados), "negocios": resultados[:80]}

# ====================== MENÚS CON PRECIOS ======================

@app.get("/api/menus")
def listar_menus(negocio_id: Optional[str] = None, max_precio: Optional[float] = None):
    menus = cargar_menus()
    if negocio_id:
        menus = [m for m in menus if m.get("negocio_id") == negocio_id]
    if max_precio is not None:
        menus = [m for m in menus if m.get("precio", 9999) <= max_precio]
    return {"total": len(menus), "items": menus}

@app.post("/api/menus")
def crear_menu_item(item: MenuItemCreate):
    menus = cargar_menus()
    nuevo = {
        "id": f"item_{uuid.uuid4().hex[:8]}",
        "negocio_id": item.negocio_id,
        "nombre": item.nombre,
        "precio": item.precio,
        "moneda": item.moneda,
        "categoria": item.categoria,
        "tags": item.tags,
        "disponible": item.disponible
    }
    menus.append(nuevo)
    guardar_menus(menus)
    return {"status": "ok", "item": nuevo}

@app.get("/api/menus/{negocio_id}")
def menu_por_negocio(negocio_id: str):
    menus = [m for m in cargar_menus() if m.get("negocio_id") == negocio_id and m.get("disponible", True)]
    return {"negocio_id": negocio_id, "total": len(menus), "items": menus}

# ====================== dAcliass IA (mejorado con clima + menús) ======================

@app.post("/api/dacliass")
async def chat_dacliass(query: ChatQuery):
    texto = query.mensaje.lower().strip()
    negocios = cargar_negocios()
    ofertas = [o for o in cargar_ofertas() if o.get("activa")]
    menus = cargar_menus()
    clima = await obtener_clima(query.lat or 18.4861, query.lon or -69.9312)

    palabras_dulce = ["dulce", "helado", "hielo", "frío", "postre", "chocolate", "vainilla", "pistacho", "bon", "nieve"]
    palabras_cafe = ["café", "cafe", "cappuccino", "latte", "espresso", "mañana"]
    palabras_comida = ["pizza", "burger", "hamburguesa", "comida", "almuerzo", "cena", "hambre", "taco", "sancocho", "mofongo"]
    palabras_barato = ["barato", "económico", "menos de", "bajo", "oferta", "descuento", "promo", "$10", "300"]

    es_dulce = any(p in texto for p in palabras_dulce)
    es_cafe = any(p in texto for p in palabras_cafe)
    es_comida = any(p in texto for p in palabras_comida)
    quiere_barato = any(p in texto for p in palabras_barato)

    # Si hace calor y el usuario no especificó, sesgar hacia frío
    if clima.get("caluroso") and not es_dulce and not es_cafe and not es_comida:
        es_dulce = True  # empujar helado en día caluroso

    candidatos = []
    for n in negocios:
        score = 0
        nombre = n.get("nombre", "").lower()
        cat = n.get("categoria", "").lower()
        sub = n.get("subcategoria", "").lower()
        tags = [t.lower() for t in n.get("tags", [])]
        desc = n.get("descripcion", "").lower()

        for palabra in texto.split():
            if len(palabra) < 3: continue
            if palabra in nombre or palabra in cat or palabra in sub or palabra in desc or any(palabra in t for t in tags):
                score += 3

        if es_dulce and ("heladeria" in cat or "helado" in sub or "dulce" in tags or "postre" in tags):
            score += 6
        if es_cafe and ("cafe" in cat or "café" in cat):
            score += 5
        if es_comida and cat in ["restaurante", "comida"]:
            score += 3
        if quiere_barato and n.get("precio") in ["$", "$$"]:
            score += 2
        if n.get("destacado"): score += 1
        if n.get("abierto_ahora", True): score += 1

        # Bonus menú barato
        menu_negocio = [m for m in menus if m.get("negocio_id") == n.get("id") and m.get("disponible")]
        if quiere_barato and any(m.get("precio", 999) <= 350 for m in menu_negocio):
            score += 3

        dist = None
        if query.lat is not None and query.lon is not None and n.get("lat") and n.get("lon"):
            dist = haversine(query.lat, query.lon, n["lat"], n["lon"])
            if dist <= (query.radio_km or 3.0):
                score += max(0, 4 - dist)
            else:
                continue

        if score > 0:
            candidatos.append({"negocio": n, "score": score, "distancia_km": round(dist, 2) if dist is not None else None, "menu": menu_negocio[:3]})

    candidatos.sort(key=lambda x: (-x["score"], x["distancia_km"] or 999))

    if not candidatos:
        clima_txt = f" Ahora hace {clima.get('temperatura')}\u00b0C ({clima.get('descripcion')})." if clima.get("ok") else ""
        return {
            "respuesta": f"🤖 dAcliass: Analicé ‘{query.mensaje}’ en Santo Domingo.{clima_txt} Prueba con ‘helado frío’, ‘café cerca’ o ‘algo por menos de 300 pesos’.",
            "recomendaciones": [],
            "clima": clima,
            "ofertas_activas": len(ofertas)
        }

    top = candidatos[:4]
    recomendaciones = []
    for c in top:
        n = c["negocio"]
        recomendaciones.append({
            "id": n.get("id"),
            "nombre": n.get("nombre"),
            "categoria": n.get("categoria"),
            "rating": n.get("rating"),
            "precio": n.get("precio"),
            "direccion": n.get("direccion"),
            "distancia_km": c["distancia_km"],
            "abierto": n.get("abierto_ahora", True),
            "tags": n.get("tags", [])[:4],
            "menu_muestra": [{"nombre": m["nombre"], "precio": m["precio"]} for m in c.get("menu", [])]
        })

    primero = top[0]["negocio"]
    dist_txt = f" a solo {top[0]['distancia_km']} km" if top[0]["distancia_km"] is not None else ""
    clima_txt = ""
    if clima.get("ok"):
        if clima.get("caluroso"):
            clima_txt = f" Hace {clima['temperatura']}\u00b0C (caliente), perfecto para algo frío."
        else:
            clima_txt = f" Temperatura actual: {clima['temperatura']}\u00b0C, {clima['descripcion']}."

    respuesta = f"🤖 dAcliass: Encontré **{primero['nombre']}**{dist_txt}.{clima_txt} "
    if primero.get("rating"):
        respuesta += f"Rating {primero['rating']}/5. "
    if top[0].get("menu"):
        item = top[0]["menu"][0]
        respuesta += f"Tienen {item['nombre']} a {item['precio']} DOP. "
    if ofertas:
        respuesta += f"Hay {len(ofertas)} ofertas relámpago activas. "
    respuesta += "¿Quieres que te genere un cupón?"

    return {
        "respuesta": respuesta,
        "recomendaciones": recomendaciones,
        "clima": clima,
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

# ====================== SISTEMA DE CUPONES ======================

@app.post("/api/cupones/generar")
def generar_cupon(oferta_id: str = Query(...)):
    ofertas = cargar_ofertas()
    oferta = next((o for o in ofertas if o["id"] == oferta_id and o.get("activa")), None)
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada o inactiva")
    if oferta.get("stock", 0) <= 0:
        raise HTTPException(status_code=400, detail="Sin stock de cupones")

    codigo = f"CONV-{uuid.uuid4().hex[:6].upper()}"
    cupon = {
        "id": f"cup_{uuid.uuid4().hex[:8]}",
        "codigo": codigo,
        "oferta_id": oferta_id,
        "negocio_id": oferta["negocio_id"],
        "titulo": oferta["titulo"],
        "precio_oferta": oferta["precio_oferta"],
        "descuento_porcentaje": oferta["descuento_porcentaje"],
        "generado": datetime.utcnow().isoformat(),
        "expira": oferta.get("expira"),
        "usado": False,
        "usado_en": None,
        "comision_usd": 1.5,
        "estado": "activo"
    }
    cupones = cargar_cupones()
    cupones.append(cupon)
    guardar_cupones(cupones)

    # Reducir stock
    for o in ofertas:
        if o["id"] == oferta_id:
            o["stock"] = max(0, o.get("stock", 1) - 1)
            break
    guardar_ofertas(ofertas)

    return {"status": "ok", "cupon": cupon, "mensaje": f"Cupón {codigo} generado. Muéstralo en caja."}

@app.post("/api/cupones/canjear")
def canjear_cupon(body: CuponRedeem):
    cupones = cargar_cupones()
    cupon = next((c for c in cupones if c["codigo"].upper() == body.codigo.upper()), None)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no existe")
    if cupon.get("usado"):
        raise HTTPException(status_code=400, detail="Este cupón ya fue usado")
    if cupon.get("expira") and cupon["expira"] < datetime.utcnow().isoformat():
        raise HTTPException(status_code=400, detail="Cupón expirado")

    cupon["usado"] = True
    cupon["usado_en"] = datetime.utcnow().isoformat()
    cupon["estado"] = "canjeado"
    guardar_cupones(cupones)

    return {
        "status": "ok",
        "mensaje": f"Cupón {cupon['codigo']} canjeado correctamente",
        "titulo": cupon["titulo"],
        "comision_usd": cupon.get("comision_usd", 1.5),
        "negocio_id": cupon["negocio_id"]
    }

@app.get("/api/cupones")
def listar_cupones(solo_usados: bool = False):
    cupones = cargar_cupones()
    if solo_usados:
        cupones = [c for c in cupones if c.get("usado")]
    return {"total": len(cupones), "cupones": cupones[-50:]}

# ====================== PAGO ======================

@app.post("/api/confirmar-pago")
def confirmar_pago(datos: PagoModel):
    return JSONResponse(status_code=200, content={
        "status": "exitoso",
        "orderID": datos.orderID,
        "mensaje": "Pago procesado y cupón generado correctamente.",
        "comision_estimada": 1.5
    })

# ====================== NOTIFICACIONES + CLIMA ======================

@app.get("/api/notificaciones/sugeridas")
async def notificaciones_sugeridas(
    hora: Optional[int] = None,
    lat: Optional[float] = 18.4861,
    lon: Optional[float] = -69.9312
):
    h = hora if hora is not None else datetime.now().hour
    negocios = cargar_negocios()
    clima = await obtener_clima(lat, lon)
    sugerencias = []

    temp = clima.get("temperatura")
    caluroso = clima.get("caluroso", False)
    lluvia = clima.get("lluvia", False)

    if 7 <= h <= 10:
        cafes = [n for n in negocios if "cafe" in n.get("categoria", "").lower()][:2]
        for c in cafes:
            sugerencias.append({
                "tipo": "antojo_manana",
                "titulo": f"Café recién hecho ☕",
                "cuerpo": f"Sé que te costó levantarte... {c['nombre']} tiene descuento de mañana.",
                "negocio_id": c["id"],
                "accion": "ver_oferta"
            })
    elif caluroso or (13 <= h <= 17):
        helados = [n for n in negocios if "heladeria" in n.get("categoria", "").lower() or "helado" in n.get("nombre", "").lower()][:2]
        for h_ in helados:
            temp_txt = f"Hace {temp}\u00b0C. " if temp else ""
            sugerencias.append({
                "tipo": "antojo_tarde",
                "titulo": f"🍦 Helado relámpago",
                "cuerpo": f"{temp_txt}{h_['nombre']} tiene promo 2x1 por las próximas 2 horas.",
                "negocio_id": h_["id"],
                "accion": "ver_oferta"
            })
    elif 18 <= h <= 22:
        restos = [n for n in negocios if n.get("categoria") == "restaurante" and n.get("destacado")][:2]
        for r in restos:
            sugerencias.append({
                "tipo": "combo_noche",
                "titulo": f"🍔 Combo familiar cerca",
                "cuerpo": f"{r['nombre']} tiene combo especial esta noche.",
                "negocio_id": r["id"],
                "accion": "ver_ruta"
            })

    if lluvia:
        sugerencias.insert(0, {
            "tipo": "clima_lluvia",
            "titulo": "🌧️ Está lloviendo",
            "cuerpo": "Ideal para delivery o algo caliente cerca. Evita mojarte.",
            "accion": "ver_comida"
        })

    # Geofence
    if lat and lon:
        for n in negocios:
            if n.get("lat") and n.get("lon"):
                dist = haversine(lat, lon, n["lat"], n["lon"])
                if dist < 0.08:
                    sugerencias.insert(0, {
                        "tipo": "geofence",
                        "titulo": f"Estás a {int(dist*1000)}m de {n['nombre']}",
                        "cuerpo": "Tienen espacio libre y 15% de descuento si entras en los próximos 10 minutos.",
                        "negocio_id": n["id"],
                        "accion": "entrar_ya"
                    })
                    break

    return {
        "hora": h,
        "clima": clima,
        "sugerencias": sugerencias[:5]
    }

# ====================== PUSH (estructura lista) ======================

@app.post("/api/push/subscribe")
def push_subscribe(sub: PushSubscribe):
    # Guardar suscripción (en producción usar DB + VAPID)
    subs_file = "push_subs.json"
    subs = []
    if os.path.exists(subs_file):
        with open(subs_file, "r") as f:
            subs = json.load(f)
    subs.append({
        "endpoint": sub.endpoint,
        "keys": sub.keys,
        "user_id": sub.user_id,
        "subscribed_at": datetime.utcnow().isoformat()
    })
    with open(subs_file, "w") as f:
        json.dump(subs, f, indent=2)
    return {"status": "ok", "mensaje": "Suscripción guardada. Listo para push real cuando configures VAPID."}
