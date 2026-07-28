# Datos de envío — Rebe's Way

Formulario para que tus clientas elijan su sucursal real de Correo Argentino
(con autocompletado, provincia + localidad) y te llegue el pedido armado por
WhatsApp y guardado en una planilla.

Las sucursales son reales: se descargan una vez del buscador público de
Correo Argentino (el mismo que usás vos en correoargentino.com.ar) y quedan
guardadas en [`src/data/sucursales.json`](src/data/sucursales.json). No hace
falta ningún token ni acuerdo comercial con Correo Argentino.

## Cómo probarlo en tu compu

```
npm install
npm run dev
```

## Paso 1 — Crear el backend (Google Apps Script)

Esto es solo para que cada pedido te llegue guardado en una planilla además
de por WhatsApp.

1. Andá a [sheets.google.com](https://sheets.google.com) y creá una planilla
   nueva. Ponele de nombre "Envíos Rebe's Way".
2. Arriba, andá a **Extensiones > Apps Script**.
3. Borrá el código de ejemplo que aparece (`function myFunction() {...}`) y
   pegá ahí todo el contenido del archivo [`apps-script/Code.gs`](apps-script/Code.gs)
   de este proyecto.
4. Guardá (ícono de disquete o Ctrl/Cmd+S).
5. Arriba a la derecha, apretá **Implementar > Nueva implementación**.
6. En "Seleccionar tipo", elegí **Aplicación web** (ícono de engranaje).
7. Configurá:
   - Ejecutar como: **Yo (tu cuenta de Google)**
   - Quién tiene acceso: **Cualquier usuario**
8. Apretá **Implementar**. Te va a pedir autorizar permisos la primera vez —
   es tu propio script, es seguro aceptarlo.
9. Te va a dar una URL que termina en `/exec`. Copiala.

## Paso 2 — Conectar el formulario a tu backend

1. Abrí [`src/config.js`](src/config.js).
2. Reemplazá `PEGAR_ACA_LA_URL_DE_APPS_SCRIPT` por la URL que copiaste.
3. Reemplazá `PEGAR_ACA_TU_NUMERO_DE_WHATSAPP` por tu número con código de
   país, sin espacios ni el 0 ni el 15. Ejemplo: si tu celular es
   11 2345-6789, el número es `5491123456789`.
4. Guardá el archivo. Al recargar `npm run dev`, los pedidos ya se guardan en
   tu planilla (revisá la hoja "Envios" que se crea sola) y el botón te va a
   llevar directo a tu WhatsApp con el mensaje ya armado.

## Paso 3 — Publicar el sitio para mandarle el link a tus clientas

El sitio ya está publicado en **https://rebes-way.github.io/envios-correo/**
(repo: [github.com/rebes-way/envios-correo](https://github.com/rebes-way/envios-correo)).
Cada `git push` a `master` lo actualiza solo vía GitHub Actions.

## Actualizar la lista de sucursales

Si con el tiempo Correo Argentino abre o cierra sucursales, podés refrescar
la lista corriendo de nuevo (necesita Python 3, ya viene instalado en Mac):

```
python3 scripts/fetch_sucursales.py
```

Tarda unos 15-20 minutos porque recorre todo el país. Al terminar, subí el
`src/data/sucursales.json` actualizado con `git add`, `git commit` y
`git push` para que se publique solo.
