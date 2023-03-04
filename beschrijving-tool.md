# HoReKanjer Simulatietool

Zie `horekanjer.html`. Open in een browser. Werkt het best in Firefox.

In dit document vind je een algemene beschrijvingen van de simulatie, van de parameter die je kan instellen en van het resultaat van een simulatie.

## 1 - Algemeen

De mogelijke scenario's om te modelleren in deze tool zijn momenteel beperkt. Zo is de 'customer journey' altijd hetzelfde:

- een groep klanten komt binnen in de entree
- een medewerker komt naar de groep toe
- De mederwerker loopt samen met de groep naar tafel
  - Genoeg zitplekken
  - Zo min mogelijk overtollige zitplekken
  - Dichtst bij
- Een medewerker loopt naar de groep (die inmiddels aan tafel zit) om een bestelling voor drankjes op te nemen en de menukaarten te brengen.
- Iedere gast in de groep bestelt precies 1 drankje.
- Vanaf gaan er twee processen parallel:
  - 1
    - De medewerker die de bestelling opnam brengt de bestelling naar de keuken.
    - In de keuken bereid een medewerker alle drankjes.
    - Wanneer alle drankjes in de bestelling bereid zijn bezorgt een mederwerker alle drankjes in één keer naar tafel.
  - 2
    - de groep bestudeert de menukaart. Na een tijdje geven ze aan een gerecht te willen bestellen.
    - Een medewerker loopt naar de tafel.
    - De medewerker neemt nog een keer een bestelling voor drankjes op. Iedere gast bestelt wederom precies 1 drankje.
    - De mederwerker neemt een bestelling voor gerechten op. Iedere gast bestelt precies 1 gerecht.
    - De medewerker brengt beide bestellingen (de tweede drankbestelling, de gerechtbestelling) naar de keuken.
    - Vanaf hier gaan er twee processen parallel:
      - 1
        - In de keuken bereid een medewerker alle drankjes.
        - Wanneer alle drankjes in de bestelling bereid zijn bezorgt een mederwerker alle drankjes in één keer naar tafel.
      - 2
        - In de keuken bereid een medewerker alle gerechten.
        - Wanneer alle gerechten in de bestellen bereid zijn bezorgt een medewerker alle gerechten in één keer naar tafel.
        - Na het ontvangen van de gerechten beginnen de gasten te eten. Na enige tijd geven ze aan een nagerecht te willen bestellen.
        - Een medewerker komt naar tafel.
        - De mederwerker neemt de bestelling van nagerechten op. Iedere gast bestelt precies 1 nagerecht.
        - De medewerker die de bestelling opnam brengt de bestelling naar de keuken.
        - In de keuken bereid een medewerker alle nagerechten.
        - Wanneer alle nagerechten in de bestelling bereid zijn bezorgt een mederwerker alle gerechten in één keer naar tafel.
        - Na het ontvangen van de nagerechten beginnen de gasten te eten. Na enige tijd geven ze aan te willen betalen.
        - Een mederwerker komt naar tafel.
        - De groep betaalt.
        - De groep verlaat de tafel. De tafel is nu vrij voor een nieuwe groep.
        - De groep loopt naar de entree en verlaat het restaurant.

## 2 - Parameters

### `secondsAcceptingGroups`
Aantal seconden dat nieuwe groepen welkom zijn. Na deze tijd ga de simulatie door tot alle groepen het restaurant hebben verlaten.

### `groupSizes`
Per groep, het aantal gasten in de groep en de kans op een groep van die grootte.Zorg dat de kansen samen 1 zijn.

### `averageGroups`
Het aantal groepen dat gemiddeld gedurende de `secondsAcceptingGroups` het restaurant komt bezoeken. Deze groepen komen verspreid met een Poissonproces over de simulatie het restaurant binnen. Als je niet weet wat een Poissonproces is, zoek het op.

### `initialGroups`
Het aantal groepen dat direct bij het begin van de simulatie het restaurant binnenkomen. Dit telt niet mee voor `averageGroups`. Dit is een een normaalverdeling (zie verderop).

### `secondsOrdering`
### `secondsDecidingFood`
### `secondsEatingFood`
### `seacondsEatingDesert`
### `secondsPaying`
Dit zijn respectievelijk
- hoe lang een groep per persoon doet over een bestelling doorgeven aan een medewerker (zowel voedsel als gerechten als nagerechten)
- hoe lang een groep (niet per persoon) doet over het kiezen van een gerecht na het krijgen van de menukaart
- hoelang een groep (niet per persoon) doet over het eten van alle gerechten
- hoelang een groep (niet per persoon) doet over het eten van alle nagerechten
- hoelang een groep (niet per persoon) doet over betalen

In tegenstelling tot de bereidingstijd van drank, gerechten en nagerechten zijn deze tijden niet altijd hetzelfde, maar normaal verdeeld. Als je niet weet wat normaal verdeeld is zoek je dat op.
`{mean : gemiddelde in seconden, standardDeviation : standaard afwijking in seconden}`

Als in de simulatietool een groep in arriveert worden deze vijf waarden voor deze specifieke groep vastgelegd.

### `entrance`
De `[x, y]` coordinaten, in centimeters, van de ingang. Hier komen gasten binnen en gaan gasten weer naar buiten.

### `kitchen`
De `[x, y]` coordinaten, in centimers, van de keuken. Hier worden bestellingen van tafels naartoe gebracht en en hiervandaan wordt voedsel naar tafel gebracht. Het bereiden van voedsel gebeurt ook op deze plek.

### `tables`
De tafels. Per tafel:
`[x, y, max aantal mensen]`

### `staff`
De medewerkers. Per medewerker:
`[x, y, tafelnummers, uurloon in euro's, verwelkomen, bestellingenOpnemen, voedselBezorgen, drankBereiden, gerechtBereiden, nagerechtBereiden]`
x en y samen de coordinaten, in centimeters, waar medewerker gaat staan indien niet me taak bezig.
tafels, array [] met tafelnummers. relevant voor verwelkomen, bestellingen opnemen, voedsel bezorgen.
verwelkomen, bestellingenOpnemen, voedselBezorgen, drankBereiden, gerechtBereiden, nagerechtBereiden
true of false, of de medewerker deze taken zal oppaken ja of nee.

### `drinks`
### `foods`
### `deserts`
De drie groepen menu-items: dranken, gerechten, nagerechten. Per item binnen een groep:
`[naam, kans op kiezen, winstmarge in euro's, bereidingstijd in seconden]`

### `staffSendsOrdersRemotely`
Indien `true` hoeft de mederwerker die een bestelling aan tafel opneemt de bestelling niet naar de keuken te brengen.

## 3 - Resultaat

Nadat een simulatie klaar is (bij lang genoeg wachten na 'Play' of 'Result only') worden er gegevens over de simulatie in de console van de browser geprint. Om deze console te openen, druk tegelijkertijd de toetsen Ctrl, Shift en I in. Indien dit niet werkt, zoek op hoe je voor de browser die je gebruikt de console opent.

### `totalSeconds`
Het totale aantal seconden die gesimuleerd zijn.

### `totalHMS`
Het totale aantal seconden die gesimuleerd zijn uitgedrukt in een leesbaar uren:minuten:seconden format.

### `totalGroups`
Het totale aantal groepen die behandeld zijn.

### `totalGuests`
Het totale aantal mensen die behandeld zijn (de som van de groottes van de groepen die behandeld zijn).

### `income`
De inkomsten uit bestellingen.

### `wages`
Het betaalde salaris over de tijd aangegeven in `secondsAcceptingGroups` , NIET over de tijd gerapporteerd als `totalSeconds`.

### `staff`
Per medewerker een `id` en `uptime`: hoeveel tijd ze bezig zijn geweest met taken, tussen 0 (nooit bezig geweest met taken) en 1 (de hele tijd bezig geweest met taken).