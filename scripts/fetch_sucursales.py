#!/usr/bin/env python3
"""
Descarga la lista real de sucursales de Correo Argentino desde el buscador
público de su sitio (https://www.correoargentino.com.ar/formularios/sucursales)
y genera src/data/sucursales.json para usar en el formulario sin depender de
ningún token ni acuerdo comercial.

Para volver a correrlo (por ejemplo si Correo Argentino abre sucursales nuevas):
    python3 scripts/fetch_sucursales.py
"""
import json
import re
import time
import urllib.parse
import urllib.request
import os

ENDPOINT = "https://www.correoargentino.com.ar/sites/all/modules/custom/ca_forms/api/wsFacade.php"
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Referer": "https://www.correoargentino.com.ar/formularios/sucursales",
    "X-Requested-With": "XMLHttpRequest",
}

PROVINCIAS = [
    ("A", "Salta"), ("B", "Buenos Aires"), ("C", "Ciudad Autónoma de Buenos Aires"),
    ("D", "San Luis"), ("E", "Entre Ríos"), ("F", "La Rioja"), ("G", "Santiago del Estero"),
    ("H", "Chaco"), ("J", "San Juan"), ("K", "Catamarca"), ("L", "La Pampa"),
    ("M", "Mendoza"), ("N", "Misiones"), ("P", "Formosa"), ("Q", "Neuquén"),
    ("R", "Río Negro"), ("S", "Santa Fe"), ("T", "Tucumán"), ("U", "Chubut"),
    ("V", "Tierra del Fuego"), ("W", "Corrientes"), ("X", "Córdoba"),
    ("Y", "Jujuy"), ("Z", "Santa Cruz"),
]

SUCURSAL_RE = re.compile(
    r"<strong>(?:SUCURSAL|UNIDAD POSTAL|AGENCIA):\s*([^<]+)</strong><br>\s*([^<]+)<br>\s*([^<]+)</br>"
    r"[\s\S]*?<strong>HORARIOS:\s*</strong>\s*([^<]*)</p>"
)

SLEEP_BETWEEN_REQUESTS = 0.25


def call(action, provincia="", localidad=""):
    data = urllib.parse.urlencode({
        "action": action,
        "provincia": provincia,
        "departamento": "",
        "localidad": localidad,
        "nis": "",
        "servicios": "",
    }).encode()
    req = urllib.request.Request(ENDPOINT, data=data, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8-sig")


def localidades_con_sucursales(provincia_id):
    raw = call("localidadesconsucursales", provincia=provincia_id)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return parsed.get("Localidades", {}).get("lista", [])


def sucursales_de_localidad(provincia_id, localidad_id):
    raw = call("sucursales", provincia=provincia_id, localidad=localidad_id)
    return SUCURSAL_RE.findall(raw)


def main():
    out_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "sucursales.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    resultados = []
    seen = set()

    for provincia_id, provincia_nombre in PROVINCIAS:
        localidades = localidades_con_sucursales(provincia_id)
        print(f"{provincia_nombre} ({provincia_id}): {len(localidades)} localidades con sucursales")
        time.sleep(SLEEP_BETWEEN_REQUESTS)

        for loc in localidades:
            loc_id = loc.get("id")
            loc_nombre = loc.get("nombre", "")
            loc_cp = loc.get("cp", "")
            if not loc_id:
                continue

            try:
                sucursales = sucursales_de_localidad(provincia_id, loc_id)
            except Exception as e:
                print(f"  ! error en {loc_nombre} ({loc_id}): {e}")
                sucursales = []
            time.sleep(SLEEP_BETWEEN_REQUESTS)

            for i, (nombre, direccion, ciudad, horario) in enumerate(sucursales):
                agency_id = f"{provincia_id}-{loc_id}-{i}"
                if agency_id in seen:
                    continue
                seen.add(agency_id)
                resultados.append({
                    "agency_id": agency_id,
                    "agency_name": nombre.strip(),
                    "street_full": direccion.strip(),
                    "city_name": (ciudad.strip() or loc_nombre.strip()),
                    "state_name": provincia_nombre,
                    "state_id": provincia_id,
                    "zip_code": loc_cp,
                    "schedule": horario.strip(),
                })

        # guardado incremental por si se corta a mitad de camino
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(resultados, f, ensure_ascii=False, indent=0)

    print(f"\nListo: {len(resultados)} sucursales guardadas en {out_path}")


if __name__ == "__main__":
    main()
