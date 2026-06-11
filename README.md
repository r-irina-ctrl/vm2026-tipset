# VM 2026 Tipset

En registreringsfri webbapp där deltagare kan lämna in VM-tips, se topplista och där admin kan lägga in facit.

## Starta

Öppna `index.html` i en webbläsare.

Appen fungerar direkt med lokal lagring på enheten. För gemensam lagring via JSONBin fyller du i `CLOUD_CONFIG` högst upp i `app.js`:

```js
const CLOUD_CONFIG = {
  masterKey: "DIN_JSONBIN_MASTER_KEY",
  accessKey: "DIN_JSONBIN_ACCESS_KEY",
  binId: "DIN_BIN_ID",
  binName: "vm2026-tipset",
};
```

Adminlösenordet är `vm2026` och kan ändras i `ADMIN_PASSWORD` i `app.js`.

Obs: nycklar som ligger i frontend-kod kan ses av andra. För en publik skarp version är nästa steg att lägga skrivningen bakom en liten backend/proxy.
