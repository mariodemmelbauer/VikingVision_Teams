# VikingVision – Entra / Teams SSO Setup

Tenant: `akaried.onmicrosoft.com`  
Tenant-ID: `1fcb46af-c475-4867-8c22-1ada8dd7cfdf`  
Entra Application (client) ID: `dd10d321-ec5e-425f-897f-1634fcf3c309`

## Noch festzulegen

Für das endgültige Teams-Manifest brauchen wir die HTTPS-Domain des React-Frontends und die HTTPS-Domain der FastAPI-API.

Im Manifest sind deshalb derzeit noch diese Platzhalter enthalten:

- `YOUR-FRONTEND.example.com`
- `YOUR-API.example.com`

## Entra: Expose an API

Sobald die Frontend-Domain feststeht:

1. Entra Admin Center → App registrations → VikingVision → **Expose an API**.
2. Application ID URI auf folgendes Schema setzen:
   `api://<FRONTEND-HOST>/dd10d321-ec5e-425f-897f-1634fcf3c309`
3. Scope anlegen: `access_as_user`.
4. Unter **Authorized client applications** hinzufügen:
   - Teams Desktop/Mobile: `1fec8e78-bce4-4aaf-ab1b-5451cc387264`
   - Teams Web: `5e3ce6c0-2b1f-4285-8d4b-75ee78787346`
5. Für beide Clients den Scope `access_as_user` autorisieren.

Das Feld `webApplicationInfo.resource` im Teams-Manifest muss exakt mit der Application ID URI übereinstimmen.
