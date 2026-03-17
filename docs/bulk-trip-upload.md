## Bulk Trip CSV Upload

This document describes how to prepare and import CSV files for creating trips in bulk and how the app assists you in resolving missing client links after upload. The goal is to keep data clean while minimizing manual work for dispatch.

### 1. Overview of the Flow

The bulk upload flow has two main phases:

1. **CSV-Validierung & Trip-Erstellung**
   - Die CSV wird eingelesen, jede Zeile wird validiert.
   - Nur fehlerfreie Zeilen werden als Fahrten (`trips`) in der Datenbank angelegt.
2. **Fahrgast-Auflösung nach dem Upload (Wizard)**
   - Direkt nach erfolgreichem Upload öffnet sich ein Schritt-für-Schritt-Dialog.
   - Für alle Fahrten ohne verknüpften Kunden (`client_id = null`, aber mit `client_name`) können Sie entscheiden:
     - Fahrgast als **Nicht-Kunden** belassen, oder
     - **Neuen Fahrgast anlegen und mit der Fahrt verknüpfen**.

Wichtig: **Alle gültigen Fahrten werden immer zuerst erstellt.** Der Wizard dient nur dazu, Kunden nachträglich bequem anzulegen bzw. zuzuordnen – Sie verlieren keine Daten, selbst wenn Sie den Dialog abbrechen.

### 2. CSV Header

Verwenden Sie diese exakte Kopfzeile (Reihenfolge ist wichtig):

```text
kostentraeger,abrechnungsart,date,time,firstname,lastname,phone,greeting_style,pickup_street,pickup_zip,pickup_city,pickup_station,dropoff_street,dropoff_zip,dropoff_city,dropoff_station,is_wheelchair,notes,group_id,driver_name
```

### 3. Column Details

- **kostentraeger** (required)  
  Name des Kostenträgers. Dieser wird case-insensitiv gegen `payers.name` gematcht.
  - Beispiel: `AOK`, `BARMER`.
  - Wenn kein Kostenträger mit diesem Namen existiert, wird die Zeile mit `payer_not_found` abgelehnt.

- **abrechnungsart** (optional, aber empfohlen)  
  Name der Abrechnungsart. Diese wird case-insensitiv gegen `billing_types.name` **für den gefundenen Kostenträger** gematcht.
  - Beispiel: `Krankenfahrt`, `Dialyse`.
  - Wenn angegeben, aber keine passende Abrechnungsart für den Kostenträger existiert, erhält die Zeile `billing_type_not_found`.

- **date** (required)  
  Datum der Fahrt im deutschen Format.
  - Erlaubte Formate: `DD.MM.YY` oder `DD.MM.YYYY`  
    Beispiele: `16.03.26`, `16.03.2026`

- **time** (optional)  
  Uhrzeit der Fahrt.
  - Format: `HH:MM` (24h)  
    Beispiele: `08:30`, `14:05`
  - Wenn angegeben, wird `date + time` zu `scheduled_at` kombiniert.
  - Wenn leer: Die Fahrt wird mit `scheduled_at = NULL` und `requested_date = date` angelegt. Sie erscheint automatisch im **Offene Touren**-Widget, wo die Abholzeit nachträglich eingetragen werden kann. Das Datum wird im Widget vorausgefüllt.
  - Ungültiges `date`-Format führt weiterhin zu `invalid_datetime` und die Zeile wird abgelehnt.

- **firstname** (optional)  
  Vorname des Fahrgasts. Wird mit `lastname` zu `client_name` kombiniert.

- **lastname** (optional)  
  Nachname des Fahrgasts. Wird mit `firstname` zu `client_name` kombiniert.

- **phone** (optional)  
  Telefonnummer des Fahrgasts. Wird als `client_phone` gespeichert.

- **greeting_style** (optional)  
  Bevorzugte Anrede des Fahrgasts (z. B. `Herr`, `Frau`). Wird an der Fahrt (`trips.greeting_style`) und beim Anlegen eines neuen Fahrgasts aus dem Wizard an den Client (`clients.greeting_style`) übernommen.

- **pickup_street** (required)  
  Straßenanteil der Abholadresse (mit oder ohne Hausnummer).
  - Beispiel: `Musterstraße 12` oder `Musterstraße`.

- **pickup_zip** (required)  
  Postleitzahl für die Abholadresse. Beispiel: `12345`.

- **pickup_city** (required)  
  Stadt für die Abholadresse. Beispiel: `Berlin`.

- **pickup_station** (optional)  
  Optionale Station / Zusatzinfo zur Abholadresse. Beispiel: `Haus`, `Station 1`.

- **dropoff_street** (required)  
  Straßenanteil der Zieladresse.

- **dropoff_zip** (required)  
  Postleitzahl der Zieladresse.

- **dropoff_city** (required)  
  Stadt der Zieladresse.

- **dropoff_station** (optional)  
  Optionale Station / Zusatzinfo zur Zieladresse.

- **is_wheelchair** (optional)  
  Kennzeichnet, ob ein rollstuhlgerechtes Fahrzeug benötigt wird.
  - Der Wert wird uppercased und mit `TRUE` verglichen.
  - `TRUE` → `is_wheelchair = true`  
    Alles andere (inkl. leer) → `is_wheelchair = false`.

- **notes** (optional)  
  Freitext, der als `notes` an der Fahrt gespeichert wird.

- **group_id** (optional)  
  Gruppierungskennzeichen, das mehrere CSV-Zeilen einer logischen Tour zuordnet **und gleichzeitig die Reihenfolge der Stopps definiert**.

  **Neues Format (empfohlen): `<Gruppenname>.<Stoppreihenfolge>`**  
  Der Teil nach dem letzten Punkt ist eine positive ganze Zahl und gibt die Reihenfolge innerhalb der Gruppe an.

  | CSV-Wert      | Gruppe   | Stopp-Nr. | Bedeutung |
  |---------------|----------|-----------|-----------|
  | `1.1`         | `1`      | 1         | Stopp A (erster Halt) |
  | `1.2`         | `1`      | 2         | Stopp B (zweiter Halt) |
  | `1.3`         | `1`      | 3         | Stopp C (dritter Halt) |
  | `tour-abc.1`  | `tour-abc` | 1       | Erster Stopp der Tour „tour-abc" |
  | `tour-abc.10` | `tour-abc` | 10      | Zehnter Stopp der Tour „tour-abc" |

  Alle Zeilen mit demselben Gruppenanteil werden intern auf eine gemeinsame UUID gemappt. Die Stopp-Nummer (`stop_order`) wird zusätzlich an der Fahrt gespeichert und bestimmt überall die Anzeigereihenfolge – in der Fahrtendetail-Ansicht, in gedruckten Tourbüchern und im PDF.

  **Altes Format (weiterhin unterstützt):** Ein einfaches Schlüsselwort ohne Punkt (z. B. `tour-1`, `dialysis-morning`) funktioniert weiterhin. Die Reihenfolge innerhalb der Gruppe wird in diesem Fall durch die Abfahrtszeit (`scheduled_at`) bestimmt.

  > **Wichtig:** Damit Fahrer immer in der richtigen Reihenfolge fahren (Stopp A → B → C), sollte das neue Punktformat verwendet werden, da Zeiten nicht immer bekannt sind.

- **driver_name** (optional, empfohlen)  
  Exakter Fahrername wie in der App angezeigt, zur späteren Fahrermatching-Logik.
  - Gedacht zum Matchen auf `users.name` mit `role = 'driver'` und `is_active = true` (case-insensitiv).
  - Wenn ein Match gefunden wird, kann die Fahrt später automatisch dem richtigen Fahrer zugeordnet werden.

### 4. Validierung & Matching im Upload

Während des Uploads wird jede Zeile in eine interne Struktur `ValidatedTripRow` überführt. Dabei laufen u. a. folgende Prüfungen:

- **Kostenträger (kostentraeger)**
  - Alle Kostenträger (`id`, `name`) werden einmalig geladen.
  - Pro Zeile wird ein case-insensitiver Exact-Match gesucht:
    - `payers.find(p => p.name.toLowerCase() === kostentraeger.toLowerCase())`
  - Wenn nichts gefunden wird oder der Wert leer ist, erhält die Zeile ein `payer_not_found` Issue und wird nicht importiert.

- **Abrechnungsart (abrechnungsart)**
  - Alle Abrechnungsarten (`id`, `name`, `payer_id`) werden einmalig geladen.
  - Wenn `abrechnungsart` gesetzt ist und ein Kostenträger gefunden wurde:
    - Es wird ein case-insensitiver Match **für genau diesen Kostenträger** gesucht:
      - `billing_types.find(b => b.name.toLowerCase() === abrechnungsart.toLowerCase() && b.payer_id === payer.id)`
  - Ohne Treffer erhält die Zeile `billing_type_not_found` und wird nicht importiert.

- **Datum & Uhrzeit**
  - `date` und `time` werden über einen deutschen Parser in ein `Date`-Objekt umgewandelt.
  - Bei Fehlern erhält die Zeile `invalid_datetime` und wird nicht importiert.

- **Client-Matching (Bestandskunden)**
  - Für das Unternehmen werden vorhandene `clients` vorgeladen.
  - Aus `firstname` und `lastname` wird ein vollständiger Name gebildet.
  - Wenn genau ein Client mit demselben (normalisierten) Vollnamen gefunden wird:
    - Die Fahrt erhält direkt `client_id` und `client_name` des gefundenen Clients.
  - Wenn kein eindeutiger Match gefunden wird:
    - `client_id` bleibt `null`.
    - `client_name` wird aus den CSV-Namen gebildet (falls vorhanden).

Wenn eine Zeile irgendein **blocking issue** hat (z. B. fehlender Kostenträger, ungültiges Datum), wird sie **nicht** in die Datenbank geschrieben.

### 5. Angelegte Trip-Daten & Flags

Für jede **valide** Zeile wird ein `InsertTrip`-Payload aufgebaut und als Fahrt gespeichert. Dabei werden u. a. gesetzt:

- `payer_id`, `billing_type_id` (falls gematcht)
- `client_id` (falls ein bestehender Client eindeutig gefunden wurde)
- `client_name` (aus Clientdaten oder `firstname` + `lastname`)
- `client_phone` (aus `phone`)
- `scheduled_at` (kombiniert aus `date` + `time`; `NULL` wenn keine Uhrzeit angegeben)
- `requested_date` (ISO-Datum aus `date`, gesetzt wenn `time` fehlt; `NULL` wenn `time` vorhanden)
- `pickup_address`, `pickup_station`
- `dropoff_address`, `dropoff_station`
- `is_wheelchair`
- `notes`
- `company_id`, `created_by`
- `group_id` (aus `group_id` der CSV auf interne UUID gemappt)
- `stop_order` (Stopp-Nummer aus dem Punktformat, z. B. `1.2` → `2`; `NULL` bei altem Format)
- `status = 'pending'`
- `stop_updates = []`

Zusätzlich werden für alle per CSV erstellten Fahrten folgende Flags gesetzt:

- `has_missing_geodata = true`  
  CSV-Dateien enthalten keine Geokoordinaten. Fahrten werden daher zunächst als „fehlende Geodaten“ markiert und können später geocodiert werden.

- `needs_driver_assignment = false` (initial)  
  Dieses Flag kann später auf `true` gesetzt werden, wenn keine Fahrerzuordnung möglich ist bzw. nachgelagert verarbeitet wird.

- `ingestion_source = 'csv_bulk_upload'`  
  Damit können CSV-Importe separat gefiltert und ausgewertet werden.

### 6. Abrechnungsart-Verhaltensregeln (Behavior Rules)

Wenn eine Abrechnungsart ein konfiguriertes `behavior_profile` hat, werden diese Regeln **automatisch beim Import angewendet**. Es gelten dieselben Regeln wie beim manuellen Erstellen einer Fahrt:

| Regel | Wirkung beim Import |
|---|---|
| `lockPickup` + Standard-Abholadresse | CSV-Abholadresse wird mit der konfigurierten Standardadresse **überschrieben** |
| `lockDropoff` + Standard-Zieladresse | CSV-Zieladresse wird mit der konfigurierten Standardadresse **überschrieben** |
| `prefillDropoffFromPickup` | Zieladresse wird von der (ggf. überschriebenen) Abholadresse kopiert |
| `returnPolicy = 'time_tbd'` oder `'exact'` | Eine **Rückfahrt** wird automatisch angelegt: Adressen werden getauscht, `scheduled_at = NULL`, `link_type = 'return'`. Die Rückfahrt erscheint im **Offene Touren**-Widget. |
| `returnPolicy = 'none'` | Keine Rückfahrt wird angelegt |

**Hinweis:** Bei `returnPolicy = 'exact'` kann die exakte Zeit aus einer CSV nicht ermittelt werden – die Rückfahrt wird daher analog zu `time_tbd` behandelt und muss im Widget nachgeplant werden.

Die Import-Zusammenfassung im Dialog zeigt nach dem Upload:
- Anzahl automatisch erstellter Rückfahrten
- Anzahl durch Regeln überschriebener Adressen

Weitere Details: siehe [`docs/bulk-upload-behavior-rules.md`](./bulk-upload-behavior-rules.md).

### 7. Client-Resolution-Wizard nach dem Upload


Direkt nach einem erfolgreichen Upload passiert Folgendes:

1. Die App speichert alle **erfolgreichen** Fahrten in der Datenbank.
2. Aus den gespeicherten Fahrten wird eine Liste `unresolvedRows` gebildet:
   - Definition: Fahrten mit
     - `client_id IS NULL`,
     - aber `client_name IS NOT NULL`,
     - und `ingestion_source = 'csv_bulk_upload'`.
3. Wenn `unresolvedRows` leer ist:
   - Der Dialog zeigt einen „Import abgeschlossen“-Hinweis und kann automatisch geschlossen werden.
4. Wenn `unresolvedRows` **mindestens einen Eintrag** enthält:
   - Der Dialog wechselt in den Modus **„Fahrgäste auflösen“**.
   - Es öffnet sich ein Schritt-für-Schritt-Wizard innerhalb desselben Dialogs.

#### 7.1. Was im Wizard angezeigt wird

Pro Eintrag in `unresolvedRows` sehen Sie:

- Den Namen des Fahrgasts aus der CSV bzw. der Fahrt (`client_name`).
- Abholadresse (`pickup_address`) und Zieladresse (`dropoff_address`).
- Einen Fortschrittsindikator, z. B. „2 von 5 Fahrgästen“.

#### 7.2. Ihre Optionen pro Fahrgast

Für jeden ungelösten Fahrgast gibt es zwei Hauptaktionen:

- **„Als Nicht-Kunde verwenden“**  
  - Die Fahrt bleibt ohne `client_id`.
  - `client_name` aus der CSV bleibt erhalten.
  - Der Wizard springt zum nächsten Eintrag (oder beendet sich, wenn es der letzte war).

- **„Neuen Fahrgast anlegen & verknüpfen“**  
  - Im Dialog wird ein eingebettetes Formular geöffnet (kein neuer Modal).
  - Felder (so weit wie möglich vorbefüllt):
    - `first_name`, `last_name` – aus CSV / `client_name`.
    - `phone` – aus `client_phone`.
    - Heimadresse:
      - Radio-Button: **Abholadresse** vs. **Zieladresse** als Basis.
      - Textfelder für `street`, `street_number`, `zip_code`, `city`, vorbefüllt aus der gewählten Adresse.
  - Beim Speichern:
    1. Es wird ein neuer `client` mit diesen Daten und der aktuellen `company_id` angelegt.
    2. Die zugehörige Fahrt wird aktualisiert:
       - `client_id = newClient.id`
       - `client_name = "<Vorname Nachname>"` aus dem neuen Client.
    3. Der Wizard springt automatisch zum nächsten Eintrag (oder beendet sich).

#### 7.3. Abschluss („Done“-State)

Wenn alle `unresolvedRows` durchlaufen sind, wechselt der Dialog in den **„Import abgeschlossen“**-Zustand:

- Kurzer Hinweis: „Alle Fahrgäste aus diesem Upload wurden bearbeitet.“
- Buttons:
  - „Zur Fahrtenübersicht“ bzw. `router.refresh()` (je nach Implementierung).
  - „Dialog schließen“, um den Wizard zu verlassen.

Sie können den Dialog jederzeit schließen; bereits erstellte Fahrten und ggf. angelegte Clients bleiben erhalten.

### 7. Fahrer-Verhalten (High Level)

Die Spalte `driver_name` ist dafür gedacht, Fahrten automatisch Fahrern zuzuordnen:

- `driver_name` wird genutzt, um Fahrer anhand des angezeigten Namens zu finden (case-insensitiv).
- Wenn ein passender Fahrer gefunden wird:
  - Die Fahrt kann `driver_id` erhalten und `needs_driver_assignment` bleibt `false`.
- Wenn kein Match gefunden wird:
  - Die Fahrt bleibt ohne `driver_id`.
  - `needs_driver_assignment` kann genutzt werden, um offene Zuordnungen in der Disposition sichtbar zu machen.

### 8. Fehleranzeige im UI

Nach dem Upload zeigt die Oberfläche eine Zusammenfassung:

- Anzahl der erfolgreich analysierten bzw. erstellten Fahrten.
- Eine scrollbare Liste mit Zeilenfehlern, z. B.:
  - `Zeile 5: Kostenträger "XYZ" nicht gefunden.`
  - `Zeile 7: Abrechnungsart "ABC" für Kostenträger "AOK" nicht gefunden.`
  - `Zeile 10: Ungültiges Datum/Uhrzeit Format (erwartet DD.MM.YY HH:mm): "32.13.2026 25:99"`.

Nur Zeilen ohne blocking issues werden in die Datenbank geschrieben. Der anschließende Client-Wizard arbeitet **ausschließlich** mit den bereits erfolgreich erstellten Fahrten.

