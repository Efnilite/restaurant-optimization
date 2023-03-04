# 2022-2023 Informatica PO 6.2 Modelleren

Naast dit document heb je voor deze praktische opdracht ook de volgende bestanden nodig:
- `inleiding-modelleren.pdf`, een introductie over modelleren en simuleren.
- `horekanjer.html`, de simulatietool.
- `beschrijving-tool.pdf`, een technische beschrijving van de simulatietool.
- `de-rosse-kater.txt`, een model van een restaurant om in de tool te zetten.

# 1 - Inleiding

Bedrijf HoReKanjer verdient geld door advies te geven aan restaurants over hoe ze hun bedrijfsvoering kunnen optimaliseren. Bijvoorbeeld door het personeel een andere taakverdeling te geven waardoor een avond efficiënter verloopt en het restaurant meer gasten kan bedienen.

Vroeger gaf HoReKanjer advies en liet het restaurant de voorgestelde aanpassingen een avond uitproberen, waarop HoReKanjer het advies eventueel aanpaste. Maar in de moderne tijd vinden restauranthouders die aanpak een te hoog risico. Ze willen geen ongeteste aanpassingen doen die mogelijk slechter werken en zodoende winst mislopen.

Om relevant te blijven in deze markt heeft `horekanjer` een simulatietool ontwikkelt, `horekanjer.html`. In die tool modelleren ze de situatie van een restaurant en kunnen door middel van simulaties in mum van tijd talloze verschillende aanpassingen uitproberen. Met de beste aanpassingen gaan ze naar de restauranthouder.

Voor deze praktische opdracht werk je in een tweetal, gedurende vier weken, als tijdelijke medewerkers van HoReKanjer. Je gaat twee soorten opdrachten doen:

- Aspecten van een draaiend restaurant modelleren.
- Aspecten van een draaiend restaurant onderzoeken met behulp van simulaties.

Na die vier werken lever je als tweetal een verslag in met daarin je werk, inclusief onderbouwing. Daarbij lever je ook je gemaakte modellen aan, ieder in een eigen tekstbestand. Zie '3 - inleveren' voor meer detail.

# 2 - Punten scoren

Je begint met cijfer 1. Daarbij kun je tot 9 punten verdienen, tot cijfer 10. De 9 punten zijn verdeeld over drie categorieëen - A, B en C - in oplopende moeilijkheidsgraad. Bij ieder onderdeel staat een naam (a t/m x) en het maximale aantal punten dat je voor dat onderdeel kan scoren.

## A (5 punten)
### a, 1 punt
In de simulatietool is het zo dat iedere klant altijd drinken bestelt. Maar, sommige klanten willen geen drinken bestellen. Modelleer het zo (door de model-configuratietekst links in de simulatietool aan te passen) dat het toch kan voorkomen dat klanten geen drinken bestellen. Beargumenteer ook waarom je antwoord klopt: geef bewijs.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `a.txt`.

### b, 1,5 punt
In de simulatietool is het zo dat als een mederwerker een gerecht bereidt, deze medewerker de volledige bereidingstijd enkel bezig is met die taak. Echter, in het echt zijn koks vaak met meerdere gerechten tegelijk bezig. Verzin een manier om dit fenomeen toch in deze tool te modelleren. Vergelijk resultaten van een simulatie met resulaten die je zou verwachten om je model te verbeteren en uiteindelijk een uitspraak te doen over de mate waarin dit fenomeen correct gemodeleerd kan worden in deze tool.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `b.txt`.

### c, 1 punt

Een stagair bij HoReKanjer heeft van restaurant De Rosse Kater een model gemaakt (zie `de-rosse-kater.txt`). Jij gaat een mening te vormen of de parameters betreffende de verschillende tijdsduren betreffende bestellen, eten en betalen een beetje realistisch zijn. Doe dat minstens door erachter te komen hoe lang een gast in z'n ééntje nodig heeft om de hele 'customer journey' te doorlopen. Bespreek hoe je aan je antwoord komt.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `c.txt`.

### d, 1,5 punt
In het model van De Rosse Kater worden gedurende vier uur nieuwe groepen geaccepteerd. Toch duurt de hele simulatie soms wel 14 uur!

Zoek uit waar dit aan ligt en kom met een oplossing door het model aan te passen. De parameters `secondsAcceptingGroups` tot en met `tables` mag je niet aanpassen.

Bespreek welke simulatietijd je zou verwachten, wat mogelijk oorzaken zijn, laat zien hoe je onderzoekt wat mogelijke oorzaken daadwerkelijk zijn, kom met een oplossing en bespreek de consequenties voor het restaurant.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `d.txt`.

## B (2 punten)

Volgt in de loop van donderdag 2 maart.

### e, 0,5 punt
Zoals het niets willen bestellen in opdracht a en het werken van kok aan meerdere gerechten tegelijk, verzin zelf fenomeen waar de tool niet direct ondersteuning voor biedt maar met een beetje omdenken ongeveer te modelleren is. Beschrijf het fenomeen, hoe je het hebt gemodelleerd. Vergelijk je model met de echte wereld en doe een onderbouwde uitspraak over de mate van correctheid waarin dat fenomeen toch te modelleren is in de tool.

### f, 0,5 punt
Verzin en voer uit een onderzoek in een eigen gekozen setting waarin je dat op afstand bestelling naar de keuken sturen gebruikt.

### g, 0,5 punt
Verzin en voer uit een onderzoek in een eigen gekozen setting waarbij je het toewijzen van tafels aan personeel gebruikt.

### h, 0,5 punt
Al zou een restaurant precies zo werken als gemodelleerd (deze klantreis, deze functiegroepen), welke aspecten van de tool voorzie je als bronnen van incorrectheid en hoe zou je de mate van incorrectheid kunnen toetsen?

## C (totaal 2 punten)

- 1,5 punten. Modeleer een bestaand restaurant.
  - Doel is om een zo correct mogelijk (gegeven de tool) model te maken van een restaurant. Gegeven de menuitems, winstmarges, zitmogelijkheden, vind configuratie van de andere parameters (zoals kansen en hoe het personeel verdeeld wordt) om een resultaat (betalende klanten) te behalen dat in de buurt komt van een het echte resultaat.
  - beschrijving restaurant in kwest, ie
  - beschrijving van welke aspecten van restaurant direct, deels met een omweg (zoals opdracht b), of zeker niet te modelleren zijn.
  - welke parameters staan redelijk vast, welke zul je moeten 
  - bespreek waar het aan 
- 0,5 punt. relatieve score optimalisaties.
  - winst
  - duur simulatie (zo kort mogelijk)
  - bezettingsgraad personeel (gewogen, zo hoog mogelijk: dus optimaal gebruikmakend van uitgegeven salaris)

# 3 - Inleveren

Je levert in op itslearning in een verslag (een `.pdf` bestand) en één of meerdere modellen, ieder model in een eigen `.txt` bestand. Kopieëer de gehele configuratie van een model (alle tekst links in de simulietool) en zet deze in zo'n `.txt` bestand. Bij het nakijken wordt de inhoud van zo'n `.txt` bestand in de simulatietool geplakt; zorg er dus voor dat dat zeker werkt!

Je hoeft **geen** geprinte versie in te leveren.

Het verslag bevat de volgende elementen in deze volgorde:

- De titel `2022-2023 Informatica PO 6.2 Modelleren`.
- De namen van de groepsleden
- Per opdracht waar je punten voor wil scoren:
  - De naam van de opdracht (a, b, ..., n)
  - Indien van toepassing, de naam het het `.txt` waar het bijbehorende model in staat.
  - De verdere uitwerking van de opdracht
- Individueel per groepslid verdeel je het hypothetische cijfer 7,5 over beide groepsleden, bijvoorbeeld 7,5:7,5 of 7:8. In een kort stukje tekst licht je je keuze toe.