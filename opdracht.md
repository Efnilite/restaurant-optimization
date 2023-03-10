# 2022-2023 Informatica PO 6.2 Modelleren

Naast dit document heb je voor deze praktische opdracht ook de volgende bestanden nodig:
- `introductie-modelleren.pdf`, een introductie over modelleren en simuleren.
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

Belangrijk om te weten: een model is nooit perfect. Het beste wat je kan doen is een model maken dat aardig in de buurt komt. Als je een model maakt is het daarom belangrijk dat je met onderbouwing komt waarom het aardig in de buurt komt.

### a, 1 punt
In de simulatietool is het zo dat iedere klant altijd drinken bestelt. Maar, sommige klanten willen geen drinken bestellen. Modelleer het zo (door de model-configuratietekst links in de simulatietool aan te passen) dat het toch kan voorkomen dat klanten geen drinken bestellen.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `a.txt`.

### b, 1,5 punt
In de simulatietool is het zo dat als een mederwerker een gerecht bereidt, deze medewerker de volledige bereidingstijd enkel bezig is met die taak. Echter, in het echt zijn koks vaak met meerdere gerechten tegelijk bezig. Verzin een manier om dit fenomeen toch in deze tool te modelleren. Vergelijk resultaten van een simulatie met resulaten die je zou verwachten om je model te verbeteren en uiteindelijk een uitspraak te doen over de mate waarin dit fenomeen correct gemodeleerd kan worden in deze tool.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `b.txt`.

### c, 1 punt

Een stagair bij HoReKanjer heeft van restaurant De Rosse Kater een model gemaakt (zie `de-rosse-kater.txt`). Jij gaat een mening vormen over of de parameters betreffende de verschillende tijdsduren (bestellen, eten, betalen...) een beetje realistisch zijn. Doe dat minstens door erachter te komen hoe lang een gast in z'n ééntje nodig heeft om de hele 'customer journey' te doorlopen. Bespreek hoe je aan je antwoord komt.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `c.txt`.

### d, 1,5 punt
In het model van De Rosse Kater worden gedurende vier uur nieuwe groepen geaccepteerd. Toch duurt de hele simulatie soms wel 14 uur!

Zoek uit waar dit aan ligt en kom met een oplossing door het model aan te passen. De parameters `secondsAcceptingGroups` tot en met `tables` mag je niet aanpassen.

Bespreek welke simulatietijd je zou verwachten, wat mogelijk oorzaken zijn, laat zien hoe je onderzoekt wat mogelijke oorzaken daadwerkelijk zijn, kom met een oplossing en bespreek de consequenties voor het restaurant.

Zet het model dat je bij deze opdracht maakt in een bestand met de naam `d.txt`.

## B (2 punten)

In vergelijking met categorie A zijn de opdrachten in categorie B meer open. Je zal zelf moeten nadenken over hoe je een onderzoeksvraag op een waardevolle manier beantwoord en hoe je de lezer overtuigd van een degelijke aanpak.

### e, 0,5 punt
Zoals het niets willen bestellen in opdracht a, en het werken van een kok aan meerdere gerechten tegelijk in opdracht b, verzin zelf een fenomeen waar de tool niet direct ondersteuning voor biedt maar met een beetje omdenken ongeveer te modelleren is.

Beschrijf het fenomeen en hoe je het hebt gemodelleerd. Vergelijk je model met het fenomeen uit de echte wereld en doe een onderbouwde uitspraak over de mate van correctheid waarin dat fenomeen toch te modelleren is in de tool.

### f, 0,5 punt

Onderzoek welk effect het verdelen van tafels onder het bedienend personeel heeft op de efficiëntie van een restaurant.

### g, 0,5 punt

Bij restaurantketen Happy Italy is er bedienend personeel dat bestellingen opneemt, en bedienend personeel dat geen bestellingen opneemt maar enkel uitserveert. Een argument hiervoor is dat het uitserverend personeel goedkoper kan worden ingehuurd omdat het geen Nederlands hoeft te spreken.

Onderzoek hoeveel goedkoper dergelijk bedienend personeel moet zijn om deze splitsing in taken economisch voordelig te maken.

### h, 0,5 punt

Opdrachten f en g zijn voorbeelden van onderzoek dat je doet met behulp van de simulatietool. Verzin nu zelf een onderzoeks om te doen met de simulatietool, van minstens hetzelfde kaliber als opdrachten f en g.

## C (totaal 2 punten)

### i, 1,5 punt
Voor deze opdracht stuurt HoReKanjer je naar een nieuwe klant. Je gaat een echt bestaand restaurant zo goed mogelijk proberen te modelleren in de tool.

Je kiest dat restaurant zelf uit. Let op: de gang van zaken in het restaurant moet niet te gek afwijken van wat de simulatietool ondersteunt. Wijkt het te ver af, dan weet je van te voren al dat je met je model niet eens in de buurt gaat komen van het echte restaurant.

Beschrijf het restaurant (onder andere de naam, locatie, plattegrond, personeelsbestand, menukaart), welke aspecten van het restaurant te modelleren zijn en hoe je ze gemodelleerd hebt.

Bespreek ook de aspecten die niet te modelleren zijn en waarom. Wat mist er aan de tool, en waarom is dit niet toch ongeveer te modelleren met wat de tool wel aanbiedt?

Laat ook zien hoe je de mate van correctheid van je model bepaalt door de resultaten van een simulatie te vergelijken met daadwerkelijk behaalde cijfers. Doe van die cijfers een redelijke schatting (met toelichting), of vraag aan de restauranthouder naar deze cijfers.

Om tot een steeds correcter model te komen zul je moeten itereren. Laat je iteraties zien en bespreek je keuzeproces met betrekking tot het aanpassen van een iteratie om tot een verbeterde iteratie te komen.

### j, 0,5 punt
Je krijgt een model. Een aantal parameters mag je niet aanpassen. Pas de andere parameters aan om een zo hoog mogelijke winst te veroorzaken. Je scoort punten op basis van hoe je winst is ten opzichte van de andere groepen.

Het model waar deze wedstrijd mee gehouden gaat worden volgt maandag 6 maart. Werk vast aan de andere opdrachten.

# 3 - Inleveren

Je levert in op itslearning in een verslag (een `.pdf` bestand) en één of meerdere modellen, ieder model in een eigen `.txt` bestand. Kopieëer de gehele configuratie van een model (alle tekst links in de simulietool) en zet deze in zo'n `.txt` bestand. Bij het nakijken wordt de inhoud van zo'n `.txt` bestand in de simulatietool geplakt; zorg er dus voor dat dat zeker werkt!

Je hoeft **geen** geprinte versie in te leveren.

Het verslag bevat de volgende elementen in deze volgorde:

- De titel `2022-2023 Informatica PO 6.2 Modelleren`.
- De namen van de groepsleden
- Per opdracht waar je punten voor wil scoren:
  - De naam van de opdracht (a, b, c, ...)
  - Indien van toepassing, de naam het het `.txt` waar het bijbehorende model in staat.
  - De verdere uitwerking van de opdracht
- Individueel per groepslid verdeel je het hypothetische cijfer 7,5 over beide groepsleden, bijvoorbeeld 7,5:7,5 of 7:8. In een kort stukje tekst licht je je keuze toe.