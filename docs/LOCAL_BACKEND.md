# Lokales Backend und Admin-Dashboard

Die App nutzt ausschließlich Node.js und eine private JSON-Datei. Es gibt keine externe Datenbank und keine neuen Laufzeit-Abhängigkeiten.

## Passwort und Konfiguration

Das Admin-Passwort steht ausschließlich in `.env.local`:

```dotenv
ADMIN_PASSWORD=DEIN_EIGENES_LANGES_PASSWORT
ADMIN_COOKIE_SECURE=false
```

Mindestens 16 Zeichen verwenden. Wenn `.env.local` bereits existiert, die Datei beibehalten und nur diese Variablen ergänzen. Wenn sie fehlt, kann `.env.example` als Vorlage dienen. `.env.local` und `data/` werden von Git ignoriert. Das Passwort und die Sitzungssignierung werden nicht ins Frontend übernommen. Eine Passwortänderung samt Serverneustart macht vorhandene Sitzungen ungültig.

Die Anmeldung erfolgt unter `/admin/login`, nur mit Passwort, ohne Konto oder E-Mail-Adresse. Der direkte Aufruf von `/admin` wird serverseitig geprüft und ohne gültige Sitzung zur Anmeldung weitergeleitet. Die Sitzung ist acht Stunden gültig und liegt in einem signierten HttpOnly-/SameSite-Strict-Cookie. Nach zehn fehlgeschlagenen Anmeldungen innerhalb von fünf Minuten wird der Login vorübergehend gesperrt.

Für ein vertrauenswürdiges lokales WLAN über HTTP bleibt `ADMIN_COOKIE_SECURE=false`. Bei HTTPS über einen Reverse Proxy auf `true` setzen. Öffentliches Bereitstellen sollte nur über HTTPS erfolgen, damit auch die Passwortübertragung geschützt ist; es wird hier nichts veröffentlicht oder am Router freigeschaltet.

## Server starten

Für Entwicklung auf dem Server-Laptop:

```sh
npm run dev -- --hostname 0.0.0.0
```

Für einen mehrere Tage laufenden Server ist der Produktionsstart ohne Entwicklungs-Hot-Reload vorgesehen:

```sh
npm run build -- --webpack
npm run start -- --hostname 0.0.0.0
```

Nur **einen** schreibenden Node.js-Prozess pro Bestelldatei betreiben, keine Cluster-Worker und keine mehreren Serverinstanzen auf derselben Datei. Die Datei wird bei Neustarts weiterverwendet. Änderungen an `.env.local` erfordern einen Neustart. Der Server-Laptop muss eingeschaltet bleiben, darf nicht schlafen und der Node.js-Prozess muss laufen.

## Amelie: Zugriff vom anderen Laptop

1. Beide Laptops mit demselben WLAN/LAN verbinden.
2. Die lokale IP-Adresse des Server-Laptops in dessen Netzwerkeinstellungen nachsehen. Auf macOS mit WLAN ist häufig auch `ipconfig getifaddr en0` möglich.
3. Amelie öffnet `http://SERVER-IP:3000`, zum Beispiel bei einer tatsächlichen Server-IP `192.168.1.50` die Adresse `http://192.168.1.50:3000`.
4. Falls macOS nachfragt, eingehende Verbindungen für Node.js im lokalen Netzwerk erlauben. Gast-WLANs können die Kommunikation zwischen Geräten blockieren.

`localhost` auf Amelies Laptop bezeichnet ihren eigenen Laptop und führt nicht zum Server. Amelie benötigt kein Admin-Passwort. Eine Bestellung wird erst beim Klick auf **EINKAUF ABSCHLIESSEN** gespeichert.

Wenn ihr nicht im selben Netzwerk seid, funktioniert die private LAN-Adresse nicht. Dafür wäre ein erreichbarer, dauerhaft laufender Node.js-Server mit beschreibbarem Datenträger oder eine separate private Netzwerkverbindung nötig. Eine solche Verbindung wird durch diese Umsetzung nicht automatisch eingerichtet.

## Dein Admin-Dashboard

- Auf dem Server-Laptop: `http://localhost:3000/admin`.
- Auf deinem anderen Laptop im selben Netzwerk: `http://SERVER-IP:3000/admin`.
- Mit dem Passwort aus `.env.local` anmelden und bei Bedarf **AKTUALISIEREN** klicken.

Beide Geräte laden die Bestellungen vom gleichen Server, nicht aus ihrem eigenen localStorage. Neueste Bestellungen stehen oben. Die Übersicht zeigt Datum/Uhrzeit, Produktnamen einschließlich Restaurantart, Credits je Produkt, Ausgaben, Restguthaben, Bestell-ID und Abschlusszeitpunkt. Der Eingangszeitpunkt wird in Europe/Paris dargestellt.

## Speicherort und Sicherung

Standardmäßig liegt die Datei unter:

```text
data/orders.json
```

Sie wird beim ersten Speichern oder ersten autorisierten Abruf automatisch angelegt, ebenso der Ordner. Sie liegt **nicht** in `public/` und ist nicht als öffentliche Datei abrufbar. Lesezugriff über `GET /api/orders` ist nur nach Admin-Anmeldung möglich. Die Runtime-Datei gehört nicht in Git.

Jede Bestellung enthält ID, Idempotenzkennung, serverseitigen Inhalts-Hash, geplantes Datum/Uhrzeit, Produkt-Snapshot mit Credits, Ausgaben, Restguthaben, Abschlusszeitpunkt und Status. Produktnamen und Preise werden beim Abschluss aus dem aktuellen Server-Katalog übernommen; historische Bestellungen werden durch spätere Katalogänderungen nicht umgeschrieben.

Für ein Backup `data/orders.json` auf dem **Server** kopieren, am besten bei kurz gestopptem Server. Die Datei nicht von Hand bearbeiten, während Bestellungen eingehen. Bei beschädigtem JSON meldet die App einen Fehler und überschreibt die Datei nicht. Die Schreibrechte für den Projektordner müssen für den Node.js-Prozess vorhanden sein.

Optional kann `ORDERS_FILE` in `.env.local` auf einen anderen privaten, absoluten Dateipfad zeigen, etwa auf einen dauerhaft eingebundenen Datenträger. Der Standard bleibt `data/orders.json`; ein Pfad unter `public/` wird abgelehnt.

## API und Checkout

- `POST /api/orders`: öffentlich für den Shop. Erwartet nur Datum, Uhrzeit, Produkt-/Varianten-IDs und eine zufällige Bestellkennung. Preise, Credit-Limit und doppelte Produkte werden serverseitig geprüft. Ungültige Auswahlen werden vollständig abgelehnt.
- `GET /api/orders`: nur mit serverseitig geprüfter Admin-Sitzung. Liefert die Zusammenfassung, neueste zuerst, in Seiten mit 25 Bestellungen. Interne Retry-Kennungen und Hashes werden nicht an das Dashboard ausgegeben.
- `POST /api/admin/login` und `/logout`: erstellen bzw. entfernen die signierte Sitzung. Schreibende Anfragen müssen von derselben Origin kommen.

Schreibvorgänge werden innerhalb eines Node.js-Prozesses serialisiert. Die vollständige neue Datei wird zunächst privat in denselben Ordner geschrieben, synchronisiert und dann atomar umbenannt. Wiederholungen derselben Kennung liefern dieselbe Bestellung; eine andere Auswahl unter derselben Kennung wird abgelehnt. Fehler beim Schreiben erzeugen keine Erfolgsbestätigung.

localStorage dient weiterhin dem persönlichen Warenkorb und den Retry-Kennungen/Bestätigungsbelegen. Die eigentlichen Bestellungen stehen auf dem Server. Die neue Browser-Ablage `date-shopping.checkout.v3` verhindert, dass alte Belege aus einer früheren Speicherlösung als erfolgreiche lokale Dateibestellungen gelten. Es wird nichts automatisch aus alten Browserdaten importiert: Erst ein erneuter Abschluss sendet eine Bestellung an den Dateiserver.

## Wichtig zu Vercel

**Diese JSON-Speicherung funktioniert auf Vercel nicht dauerhaft.** Vercel Functions bieten dafür kein dauerhaftes, zwischen Aufrufen geteiltes lokales Dateisystem. localStorage löst dieses Problem nicht und wird nicht als Ersatz verwendet. Diese Lösung ist für einen dauerhaft laufenden Node.js-Server mit beschreibbarem, persistentem Dateisystem vorgesehen.

Quelle: [Vercel: lokales Dateisystem und Serverless Functions](https://vercel.com/guides/why-does-my-serverless-function-work-locally-but-not-when-deployed).

## Prüfungen

```sh
node --test tests/*.test.mjs
npm run build -- --webpack
```

Die Tests arbeiten mit temporären Dateien und Test-Passwörtern, nicht mit echten Bestellungen oder dem persönlichen Admin-Passwort.
