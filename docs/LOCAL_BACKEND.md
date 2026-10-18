# Speicherung wurde auf private Vercel-Blobs umgestellt

Die frühere Speicherung in `data/orders.json` ist nicht mehr aktiv. Es gibt keinen automatischen Rückfall auf das lokale Dateisystem. Vorhandene Bestelldateien bleiben als Sicherung erhalten und werden nicht automatisch hochgeladen.

Einrichtung und Betrieb sind in [VERCEL_BLOB_SETUP.md](./VERCEL_BLOB_SETUP.md) beschrieben. Der vorhandene Admin-Passwortschutz, Checkout und Dashboard bleiben erhalten. Es wurde nichts veröffentlicht.
