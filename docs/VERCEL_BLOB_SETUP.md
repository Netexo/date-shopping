# Private Bestellungen mit Vercel Blob

Die App speichert jede abgeschlossene Bestellung als eigene JSON-Datei im privaten Blob Store. Checkout, Admin-Passwort und Dashboard bleiben erhalten. Die Laufzeit verwendet `data/orders.json` nicht mehr und benötigt kein beschreibbares lokales Dateisystem.

## 1. Privaten Store anlegen und verbinden

1. Öffne dein Date-Shopping-Projekt im Vercel-Dashboard und gehe zu **Storage**.
2. Erstelle einen **Blob Store**. Wähle ausdrücklich **Private**, nicht Public. Ist bereits ein öffentlicher Store vorhanden, erstelle einen neuen privaten Store; die Zugriffsart lässt sich nachträglich nicht umstellen.
3. Verbinde den Store mit diesem Projekt. Wähle **Production** und nach Bedarf **Preview** und **Development** als Zielumgebungen.
4. Prüfe in den Projekt-Einstellungen die Umgebungsvariable **`BLOB_READ_WRITE_TOKEN`**. Falls du beim Verbinden einen anderen Variablen-Präfix gewählt hast, muss der Token für diese App unter genau diesem Namen vorhanden sein.

Die App reicht den Token explizit an das SDK weiter. Er gehört ausschließlich in die Server-Umgebung, niemals in eine `NEXT_PUBLIC_`-Variable, den Quellcode oder einen Chat. Es werden keine öffentlichen oder signierten Download-Links erzeugt und keine Browser-Uploads freigeschaltet.

Offizielle Anleitung: [Vercel Blob einrichten](https://vercel.com/docs/vercel-blob/using-blob-sdk#getting-started), [Private Storage](https://vercel.com/docs/vercel-blob/private-storage).

## 2. Admin-Zugang beibehalten

Setze im Vercel-Projekt zusätzlich:

```dotenv
ADMIN_PASSWORD=DEIN_BESTEHENDES_ADMIN_PASSWORT
ADMIN_COOKIE_SECURE=true
```

`ADMIN_PASSWORD` bleibt serverseitig und muss mindestens 16 Zeichen haben. Das lokale Passwort wird nicht automatisch zu Vercel übertragen. Die vorhandene signierte HttpOnly-/SameSite-Strict-Sitzung und der serverseitige Schutz von `/admin` und `GET /api/orders` bleiben bestehen. Auf Vercel über HTTPS soll das Cookie zusätzlich Secure sein.

## 3. Lokal verwenden

Behalte deine bestehende `.env.local` bei und ergänze den echten Token des privaten Stores:

```dotenv
BLOB_READ_WRITE_TOKEN=DEIN_PRIVATER_BLOB_TOKEN
```

Den echten Wert selbst lokal eintragen. `.env.local` wird von Git ignoriert. Die unverbindlichen Variablennamen stehen in `.env.example`.

Danach den Entwicklungsserver neu starten:

```sh
npm run dev
```

Auch lokal werden Bestellungen jetzt im verbundenen Blob Store gespeichert. Ohne gültigen Token erscheint beim Abschluss eine Fehlermeldung; es wird keine Bestellung in einer lokalen Datei oder ausschließlich im Browser gespeichert. Für getrennte Testbestellungen kannst du Development/Preview mit einem separaten privaten Store verbinden.

## 4. Änderung später bewusst aktivieren

Diese Umsetzung führt **kein Deployment** aus. Neue Umgebungsvariablen und der neue Code gelten für ein bereits laufendes Vercel-Deployment erst nach einem von dir ausgelösten neuen Deployment. Das Veröffentlichen bleibt deine Entscheidung.

Nach deiner Einrichtung prüfen:

1. Datum, Uhrzeit und Produkte wählen, zum Checkout gehen.
2. Erst **EINKAUF ABSCHLIESSEN** erstellt den Blob. Die Erfolgsansicht erscheint erst nach erfolgreicher Speicherung bzw. bestätigter Wiederholung derselben Bestellung.
3. `/admin` öffnen, mit dem vorhandenen Admin-Passwort anmelden und aktualisieren. Neueste Bestellungen stehen oben.
4. Ein erneuter Abschluss derselben Auswahl mit derselben Bestellkennung darf keinen weiteren Blob erzeugen.
5. Abgemeldet muss `GET /api/orders` mit 401 abgelehnt werden. Der direkte Blob-Link darf ohne Token keine Bestelldaten liefern.

Ohne eingerichteten echten Blob Store können Netzwerkzugriff und Berechtigungen gegen dein Vercel-Konto noch nicht geprüft werden. Lokal sind Store-Logik und Fehlerfälle mit einer simulierten SDK-Schnittstelle getestet; echte Tokens werden dabei nicht benötigt.

## Daten und Wiederholungen

- Pfad: `date-shopping/orders/v1/<Bestellkennung>.json`.
- Inhalt: Bestell-ID, Datum/Uhrzeit, Produkt-Snapshot einschließlich Restaurantvariante und Credits, Summe, Restguthaben, Abschlusszeitpunkt, Status und interne Idempotenzdaten.
- Serverseitige Preisprüfung und das Limit von 100 Credits bleiben unverändert.
- Der Dateiname ist für dieselbe Kennung identisch. Uploads verwenden `access: 'private'`, `addRandomSuffix: false` und `allowOverwrite: false`. Es gibt keine gemeinsame Indexdatei, deren Änderungen verloren gehen könnten.
- Bei einer parallelen Anfrage oder verlorenen Uploadantwort liest der Server den bereits geschriebenen Blob mit `useCache: false` und liefert dessen Beleg zurück. Abweichende Auswahlen unter derselben Kennung werden abgelehnt.
- Der Admin-Abruf prüft die Sitzung **vor** dem Zugriff auf Blob. Er liest alle SDK-Listenseiten, sortiert nach Abschlusszeitpunkt und liefert wie bisher jeweils 25 Bestellungen. Blob-URLs, Token, interne Hashes und Retry-Kennungen werden nicht an das Dashboard ausgegeben.
- localStorage hält weiterhin Warenkorb, Retry-Kennungen und bereits bestätigte Belege. Die eigentlichen Bestellungen liegen im privaten Blob Store.

Die Browser-Ablage wechselt zu `date-shopping.checkout.v4`. Alte Belege der lokalen Dateispeicherung zählen nicht als Blob-Bestätigung. Bestehende `data/orders.json`-Dateien bleiben unangetastet, werden aber nicht automatisch hochgeladen oder im neuen Dashboard mit angezeigt. Vorhandene Bestandsdaten deshalb als Sicherung behalten; für deren Übernahme ist ein gesonderter, bewusster Import nötig.

## Prüfungen

```sh
node --test tests/*.test.mjs
npm run build -- --webpack
```

Der Build benötigt keinen Token. Ein Test mit echten Bestellungen benötigt einen korrekt verbundenen privaten Store.
