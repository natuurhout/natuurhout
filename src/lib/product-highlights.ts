/*
 * The "Pluspunten" tab of every product page: what makes this product good
 * (short points, a bold lead and one line of explanation) and what it is used
 * for. Written per product from its own description and Natuurhout's advice,
 * so the tab never falls back to a general company text. Shop pages look up
 * their handle; the WordPress product pages their first price-list product,
 * or their path when they have none.
 */

/** A bold lead, one line of explanation and, optionally, a link to the product it names. */
export type Highlight = [lead: string, text: string, link?: { href: string; label: string }];

export type ProductHighlights = {
  plus: Highlight[];
  uses: string[];
};

const OLD_STOCK_PLUS: Highlight[] = [
  ["Al natuurlijk vergrijsd", "deze rollen lagen een tijd buiten: het hout heeft al de zilvergrijze kleur die kastanje na een paar jaar krijgt."],
  ["Nieuw en ongebruikt", "de vergrijzing is puur uitzicht en doet niets af aan sterkte of levensduur."],
  ["Speciale prijs", "voordeliger dan dezelfde rol uit de nieuwe voorraad. Op = op."],
  ["Natuurlijk duurzaam", "kastanje beschermt zichzelf met looizuur, zonder behandeling."],
];

const HIGHLIGHTS: Record<string, ProductHighlights> = {
  // ── Hekwerk ────────────────────────────────────────────────────────────
  "kastanje-rasterwerk": {
    plus: [
      ["Gekloofde, gepunte latten", "de echte landelijke look; het hout vergrijst mooi zilvergrijs."],
      ["Tot zo’n 25 jaar levensduur", "het natuurlijke looizuur beschermt het kastanjehout, zonder behandeling of onderhoud."],
      ["Dubbel gegalvaniseerd ijzerdraad", "de latten zitten stevig vast en het hekwerk blijft netjes gespannen."],
      ["Hoogtes van 60 tot 180 cm", "met latafstand 4,5/5 cm (rol van 5 m) of 7,5/8 cm (rol van 10 m, de hoge rollen 5 m)."],
      ["Eenvoudig te plaatsen", "de rol volgt bochten en een glooiend terrein; tussen de palen opspannen en vastzetten."],
    ],
    uses: [
      "Tuinafsluiting rond voor- of achtertuin",
      "Weide voor schapen, geiten, ezels of varkens",
      "Kippenren en hondenren",
      "Afscherming rond zwembad, vijver of speelzone",
      "Moestuin of paden afbakenen",
      "Begroeid met klimplanten als groene afscheiding",
    ],
  },
  "robinia-hekwerk": {
    plus: [
      ["Duurzaamheidsklasse 1", "robinia gaat 25 tot 40 jaar mee: de duurzaamste houtsoort van onze drie hekwerken."],
      ["Strakker uitzicht", "geschaafde en geschuurde latten, gladder en rechter dan kastanje hekwerk."],
      ["Geen behandeling nodig", "van nature bestand tegen weer, vocht en insecten."],
      ["Volgt het terrein", "de rol past zich aan bochten en glooiend terrein aan."],
      ["Bijpassende robinia poort", "met dezelfde latten, voor één strak geheel."],
    ],
    uses: [
      "Natuurlijke tuinafsluiting met een strakke, moderne look",
      "Speelplaatsen, scholen en parken",
      "Weides en dierenomheiningen",
      "Decoratieve afbakening in tuin of park",
    ],
  },
  "hazelaar-hekwerk": {
    plus: [
      ["Het voordeligste van onze houten hekwerken", "een landelijke afsluiting tegen een scherpe prijs per rol."],
      ["Ambachtelijk gemaakt", "hazelaarlatten verbonden met gegalvaniseerd ijzerdraad."],
      ["Fijne, landelijke look", "dunne hazelaarlatten met latafstand 3/5 cm (rol van 5 m) of 7/9 cm (rol van 10 m)."],
      ["Zonder onderhoud", "plaats het net boven de grond, dan blijft het jarenlang mooi en stevig."],
      ["Makkelijk aan te passen", "eenvoudig te plaatsen en op maat te maken voor uw tuin."],
    ],
    uses: [
      "Landelijke tuinafsluiting",
      "Kippenhok en kippenren",
      "Bloemenperk of moestuin afbakenen",
      "Samen met een hazelaar poort als complete omheining",
    ],
  },
  "kastanje-hekwerk-1-50m": {
    plus: [
      ...OLD_STOCK_PLUS.slice(0, 3),
      ["1,80 m hoog", "een hoge, stevige afsluiting met latafstand 7/8 cm."],
    ],
    uses: ["Hoge erfafscheiding", "Hondenterrein of hondenren", "Weides en kippenrennen", "Moestuin of paden afbakenen"],
  },
  "kastanje-hekwerk-100cm-4-5cm": {
    plus: [...OLD_STOCK_PLUS, ["Smalle latafstand (4/5 cm)", "houdt ook kleine dieren goed binnen. Rol van 5 m."]],
    uses: ["Tuinafsluiting van 1 m hoog", "Kippenren en moestuin", "Borders en paden afbakenen"],
  },
  "kastanje-hekwerk-100cm-7-9cm": {
    plus: [...OLD_STOCK_PLUS, ["Open latafstand (7/8 cm)", "luchtig en landelijk. Rol van 5 m."]],
    uses: ["Tuinafsluiting van 1 m hoog", "Weide voor schapen of geiten", "Landelijke afbakening van tuin of erf"],
  },

  // ── Poorten ────────────────────────────────────────────────────────────
  "kastanje-poorten": {
    plus: [
      ["Pen-en-gatverbindingen", "ambachtelijk gemaakt en zeer stevig: onze sterkste kastanje poort."],
      ["Compleet geleverd", "met 2 kastanje poortpalen en het hang- en sluitwerk: meteen klaar om te plaatsen."],
      ["Zelfde stijl als het hekwerk", "gekloofde kastanje latten, past naadloos bij kastanje rasterwerk."],
      ["Onbehandeld en duurzaam", "duurzaamheidsklasse 2, bestand tegen weer en wind zonder onderhoud."],
      ["Ook op maat", "andere breedtes en hoogtes maken we op bestelling."],
    ],
    uses: [
      "Toegang in een kastanje hekwerk",
      "Tuinpoort voor voortuin of tuinpad",
      "Ingang van weide of erf",
      "Twee poorten samen als dubbele poort voor een oprit",
    ],
  },
  "maatwerk-poort": {
    plus: [
      ["Op maat gemaakt", "standaard tot 2,10 m breed en 1,80 m hoog, andere (exacte) maten op aanvraag."],
      ["Pen-en-gatverbindingen", "ambachtelijk en zeer stevig, in dezelfde stijl als het rasterwerk."],
      ["Compleet geleverd", "met ronde kastanje plantpalen en degelijk hang- en sluitwerk."],
      ["Onbehandeld kastanjehout", "natuurlijk duurzaam, zonder onderhoud."],
    ],
    uses: [
      "Doorgang met een afwijkende breedte",
      "Hoge poort naast de woning of over het tuinpad",
      "Dubbele poort voor een oprit of aanhangwagen",
      "Toegang in een kastanje hekwerk",
    ],
  },
  "kastanje-poort-geschroefd": {
    plus: [
      ["Budgetvriendelijk", "een voordeliger alternatief voor de Kastanje Poort Premium."],
      ["Lichter, toch stabiel", "geschroefd in plaats van met pen en gat, zonder in te boeten aan stevigheid."],
      ["Compleet geleverd", "met 2 poortpalen en het hang- en sluitwerk."],
      ["Onderhoudsvrij", "onbehandeld kastanjehout, bestand tegen vocht, schimmels en insecten."],
      ["Maatwerk tot 2 m breed", "vraag het ons via mail of telefoon."],
    ],
    uses: [
      "Toegang in een tuinomheining",
      "Kippenhok of kippenren",
      "Laag poortje voor moestuin of border",
      "Landelijke afsluiting van tuin of erf",
    ],
  },
  "robinia-poort": {
    plus: [
      ["Pen-en-gatverbindingen", "een frame van geschaafde robinia profielen van 7x5 cm."],
      ["Zelfde latten als het robinia hekwerk", "voorgeboord en vastgeschroefd, voor een strak geheel."],
      ["Met hang- en sluitwerk", "scharnieren en sluiting zijn inbegrepen."],
      [
        "Palen apart",
        "de poortpalen zitten er niet standaard bij. Wij raden vierkant gezaagde robinia palen aan: strak en even duurzaam als de poort.",
        { href: "/shop/vierkant-gezaagde-robinia-palen/", label: "Gezaagde robinia palen" },
      ],
      ["Extreem duurzaam", "robinia is van nature heel goed bestand tegen vocht en rot."],
    ],
    uses: [
      "Toegang in een robinia hekwerk",
      "Tuinpoort met een strakke, natuurlijke look",
      "Weide- of dierenomheining",
      "Speelzones en wandelpaden",
    ],
  },
  "hazelaar-poort": {
    plus: [
      ["Compleet geleverd", "met stevige kastanje poortpalen en hang- en sluitwerk."],
      ["Standaard met sluiting", "praktisch en veilig, meteen in gebruik."],
      ["Scherpe prijs", "de voordeligste houten tuinpoort in ons gamma."],
      ["Past bij elk hekwerk", "mooi met hazelaar hekwerk én met kastanje rasterwerk."],
    ],
    uses: ["Toegang in een hazelaar hekwerk", "Moestuin of kippenren", "Landelijke voortuin", "Doorgang tussen twee tuindelen"],
  },
  "kastanje-kaderpoort": {
    plus: [
      ["Kader zonder latten", "150 cm hoog en 168 cm breed; u vult hem zelf met latten of een stuk hekwerk."],
      ["Compleet geleverd", "met hang- en sluitwerk en poortpalen."],
      ["Latten laten monteren kan", "tegen een meerprijs zetten wij ze erop."],
    ],
    uses: ["Brede doorgang in een kastanje hekwerk", "Poort in dezelfde stijl als uw rasterwerk", "Ingang van tuin of weide"],
  },
  "cleft-field-poorten": {
    plus: [
      ["Robuust kader van 7 cm", "steviger en natuurlijker dan een standaard Engelse veldpoort."],
      ["Pen-en-gatverbindingen", "traditioneel vakmanschap in massief Europees kastanjehout."],
      ["Breedtes van 90 tot 360 cm", "van tuinpoortje tot brede inrit."],
      ["Voordeliger dan eik of hardhout", "even duurzaam en vergrijst net zo mooi, zonder behandeling."],
    ],
    uses: [
      "Veldpoort voor weide of paardenwei",
      "Oprit of erf",
      "Landelijke tuin, samen met post & rail",
      "Op vierkante eiken palen met ons beslag voor veldpoorten",
    ],
  },
  "hardhouten-veldpoort": {
    plus: [
      ["Sterk hardhout", "Meranti, Padouk, Afzelia of Iroko: van nature bestand tegen vocht, schimmels en insecten."],
      ["Breed", "2,10 m, 2,40 m of 3,00 m: ook voor voertuigen."],
      ["Vergrijst natuurlijk", "past mooi bij kastanje of hazelaar hekwerk."],
    ],
    uses: ["Inrit of oprit", "Ingang van weide of erf", "Op vierkante eiken palen met beslag voor veldpoorten"],
  },
  "/project/boerenlandhekken/": {
    plus: [
      ["Eiken schaaldelen", "de natuurlijke lijnen en de schors van de boom blijven zichtbaar."],
      ["Robuust en landelijk", "nauwelijks bewerkt hout met veel karakter."],
      ["Enkel of dubbel", "van 1 tot 4 m breed, of als dubbele poort."],
    ],
    uses: ["Oprit of erf", "Ingang van een weide", "Landelijke tuin"],
  },

  // ── Palen ──────────────────────────────────────────────────────────────
  palen: {
    plus: [
      ["Geschild en gepunt", "rond, aan één kant gepunt: makkelijk in de grond te kloppen."],
      ["Onze aanrader: ø 8-10 cm", "stevig genoeg voor elk hekwerk. De ø 6-8 cm doen goed dienst als schoorpaal."],
      ["Zo’n 10 jaar in de grond", "voor een paal van ø 8-10 cm, afhankelijk van de grond en de omstandigheden."],
      ["Langer mee met een postsaver", "wij raden hem altijd aan: hij beschermt de paal op de overgang tussen lucht en grond, waar hij het eerst rot."],
      ["Onbehandeld kastanjehout", "het looizuur beschermt tegen rot en schimmel, zonder chemische behandeling."],
      ["Veel maten", "van 100 tot 300 cm lang, ø 6-8, 8-10 of 10-12 cm; zelfde hout als het kastanje hekwerk."],
    ],
    uses: [
      "Palen voor kastanje of hazelaar hekwerk (ø 8-10 cm)",
      "Schoorpalen om hoek- en eindpalen te steunen (ø 6-8 cm)",
      "Weideafrastering voor schapen, geiten of kippen",
      "Poortpalen (de dikkere maten)",
      "Palenwand als afsluiting of eyecatcher",
    ],
  },
  "robinia-palen": {
    plus: [
      ["Duurzaamheidsklasse 1", "25 tot 35 jaar in contact met de grond."],
      ["Onbehandeld en ecologisch", "uit verantwoord beheerde Europese bossen."],
      ["Rustiek", "natuurlijke kromming en knoesten, elke paal is anders."],
      ["Langer mee dan kastanje", "de beste keuze voor palen die lang in de grond moeten staan."],
    ],
    uses: [
      "Palen voor robinia, kastanje of hazelaar hekwerk",
      "Paardenweides en moestuinomheiningen",
      "Speelterreinen en speeltoestellen",
      "Natuurlijke constructies in parken",
    ],
  },
  "vierkant-gezaagde-robinia-palen": {
    plus: [
      ["Vierkant gezaagd", "7x7 of 8x8 cm: strak en robuust, voor een moderne of landelijke afsluiting."],
      ["Duurzaamheidsklasse 1", "25 à 30 jaar in de grond, zonder behandeling."],
      ["Harder dan eik", "sterk, vormvast en bestand tegen vocht, insecten en schimmels."],
      ["Europees hout", "een milieuvriendelijk alternatief voor tropisch hardhout."],
    ],
    uses: [
      "Tuinafsluitingen en houten hekken",
      "Steunpalen bij kastanje of robinia hekwerk",
      "Poortpalen voor de robinia poort (onze aanrader)",
      "Weides, moestuinen en boomgaarden",
    ],
  },
  "halfronde-palen": {
    plus: [
      ["Vlakke achterzijde", "makkelijk en stabiel te bevestigen tegen een muur of in een rechte lijn."],
      ["Ronde voorkant", "aan de buitenkant blijft de echte kastanjelook."],
      ["Onbehandeld kastanjehout", "natuurlijk beschermd tegen rot en schimmel."],
    ],
    uses: [
      "Vlechtwerk en schuttingen monteren",
      "Hekwerk tegen een muur of bestaande constructie",
      "Decoratieve tuinprojecten",
    ],
  },
  "eiken-palen": {
    plus: [
      ["Vierkant en zwaar", "10x10 tot 15x15 cm, 200 of 250 cm lang: stevig genoeg voor zware poorten."],
      ["Duurzaamheidsklasse 2", "15 tot 25 jaar levensduur."],
      ["FSC® en PEFC gecertificeerd", "uit duurzaam beheerde bossen."],
      ["Ook met postsaver", "op aanvraag brengen wij er een postsaver op aan."],
    ],
    uses: [
      "Poortpalen voor Cleft & Field poorten en veldpoorten",
      "Poortpalen voor kastanje poorten",
      "Steunpalen tussen vlechtschermen",
    ],
  },
  "kastanje-palen-copy": {
    plus: [
      ["Postsaver al aangebracht", "geen gasbrander nodig: meteen plaatsen."],
      ["Tot dubbele levensduur", "beschermt de paal waar hij het eerst rot: de overgang tussen lucht en grond."],
      ["Waterdicht", "een huls van polyethyleen met bitumen binnenin, strak om de paal."],
      ["Bespaart op termijn", "palen hoeven veel minder snel vervangen te worden."],
    ],
    uses: [
      "Hoek-, eind- en poortpalen",
      "Alle palen van een hekwerk dat lang moet meegaan",
      "Natte of zware grond",
    ],
  },
  "kastanje-paal-met-postsaver": {
    plus: [
      ["Tot dubbele levensduur", "beschermt houten palen op het kwetsbaarste punt, de overgang tussen lucht en grond."],
      ["Zelf aan te brengen", "met een gasbrander krimpt de huls strak om de paal."],
      ["Per paaldikte", "voor ronde palen ø 6-8, 8-10 en 10-12 cm, of als Wrap & Tack-rol van 5 m voor alle maten."],
      ["Waterdicht", "polyethyleen buitenlaag met bitumen binnenin."],
    ],
    uses: [
      "Nieuwe kastanje, robinia of eiken palen beschermen",
      "Poortpalen en hoekpalen die lang moeten meegaan",
      "Palen in natte grond",
    ],
  },

  // ── Vlechtschermen en tuinbakken ───────────────────────────────────────
  "hazelaar-vlechtscherm-hasseltre": {
    plus: [
      ["Handgemaakt en geschroefd", "smalle hazelaarlatten vastgeschroefd op verticale latten: stevig en strak."],
      ["Twee hoogtes", "150 of 180 cm, in 150 of 180 cm breed."],
      ["Onbehandeld", "natuurlijk en ecologisch."],
      ["Makkelijk te bevestigen", "aan ronde kastanje palen of vierkante eiken palen."],
    ],
    uses: [
      "Afscheiding tussen tuinen",
      "Beschutting rond terras of zithoek",
      "Composthoek, afvalbakken of berging afschermen",
    ],
  },
  "hazelaar-scherm-trepanel": {
    plus: [
      ["Echt gevlochten", "robuuste hazelaartakken met de hand gevlochten: elk scherm is uniek."],
      ["Twee hoogtes", "150 of 180 cm, 180 cm breed."],
      ["Natuurlijk materiaal", "onbehandelde hazelaar, ideaal voor milieubewuste tuiniers."],
      ["Makkelijk te bevestigen", "aan kastanje palen, eiken palen of palen van ander materiaal."],
    ],
    uses: [
      "Landelijke afscheiding in tuin of op terras",
      "Beschutting rond een zithoek",
      "Composthoek, afvalbakken of berging afschermen",
    ],
  },
  "hazelaar-vlechtscherm-80cm-hoog-x-150cm-breed": {
    plus: [
      ["Laag scherm", "80 cm hoog en 150 cm breed: afbakenen zonder het zicht te nemen."],
      ["Handgemaakt hazelaar", "dezelfde uitvoering als de Hasseltre schermen."],
      ["Laatste stuks", "nog enkele op voorraad."],
    ],
    uses: ["Moestuin of border afbakenen", "Lage afscheiding rond terras", "Plantvakken afzomen"],
  },
  "tuinbakken-hazelaar": {
    plus: [
      ["Alles inbegrepen", "worteldoek, schroeven en instructies: snel in elkaar gezet."],
      ["Stevig frame", "dikke staanders en een gevlochten hazelaar wand."],
      ["Verhoogd", "50 of 60 cm hoog: werken zonder diep te bukken."],
      ["Vier maten", "van 70x70 tot 120x120 cm."],
    ],
    uses: ["Moestuin op hoogte", "Kruidentuin bij de keuken", "Bloemen op terras of in de tuin"],
  },
  "plantenbak-cortenstaal": {
    plus: [
      ["Onderhoudsvrij", "de roestlaag beschermt het staal en bladdert nooit af."],
      ["Weerbestendig", "2 mm cortenstaal, bestand tegen vorst, regen en wind."],
      ["Makkelijk te monteren", "5 panelen met hoekbeugels en roestvaste schroeven in één doos."],
      ["Vijf maten", "vierkant of rechthoekig, van 40 tot 120 cm."],
    ],
    uses: ["Terras of patio", "Voortuin of oprit", "Heesters en kleine bomen", "Moderne of industriële tuin"],
  },

  // ── Post & Rail en gaas ────────────────────────────────────────────────
  "post-rail-omheining": {
    plus: [
      ["Pen-gatverbinding", "de liggers schuiven in de gaten van de palen: stevig en robuust."],
      ["Twee of drie liggers", "palen met 2 of 3 gaten, naar gelang de dieren."],
      ["Onbehandeld kastanjehout", "natuurlijk duurzaam en weerbestendig."],
      ["Te combineren met gaas", "voor kleinere dieren zoals schapen, geiten of kippen."],
    ],
    uses: [
      "Paardenweide en boerderij",
      "Koeien en alpaca’s",
      "Decoratieve afbakening van tuin of oprit",
      "Met schapengaas voor kleinvee",
    ],
  },
  kippengaas: {
    plus: [
      ["Verzinkt zeskantgaas", "goed bestand tegen roest en weer."],
      ["Rol van 25 m, 50 cm hoog", "andere hoogtes of lengtes op aanvraag."],
      ["Makkelijk te verwerken", "flexibel en eenvoudig op maat te knippen."],
    ],
    uses: ["Kippenren of konijnenhok", "Moestuin beschermen", "Planten beschermen tegen vraat", "Lichte afrastering"],
  },
  "nexum-x": {
    plus: [
      ["Stevige X-knoop", "horizontale en verticale draden blijven vast verbonden."],
      ["Sterke draad", "2,5 mm met een treksterkte van 1100–1300 N/mm²."],
      ["Zwaar verzinkt", "245 g/m² zink tegen roest."],
      ["Diervriendelijk", "glad en huid- en vachtvriendelijk; volgens EN-normen."],
    ],
    uses: ["Schapen en ander vee", "Weilanden en landbouw", "Met kastanje of robinia palen"],
  },
  "schapengaas-fx": {
    plus: [
      ["FX-knoop", "sterk en stabiel, ook bij zware belasting."],
      ["Crapal®2-coating", "zink en aluminium: twee keer langer mee dan gewoon verzinkt."],
      ["2,5 mm draad", "maaswijdte 7,5 of 15 cm, rol van 50 m."],
      ["Diervriendelijk", "geen scherpe randen, volgens EN 10223-5."],
    ],
    uses: ["Paardenweides", "Rundvee en schapen", "Wildafrastering", "Grote weilanden"],
  },
  "schapengaas-nexum-zwaar": {
    plus: [
      ["Ons zwaarste gaas", "kop- en voetdraad 3,7 mm, tussendraden 3,0 mm."],
      ["Dikke zinklaag", "ca. 255 g/m², voor natte of open gebieden."],
      ["Rol van 50 m", "80 tot 140 cm hoog, volgens EN-normen."],
    ],
    uses: ["Schapen, geiten en kleinvee bij intensief gebruik", "Open weilanden", "Met zware kastanje, eiken of robinia palen"],
  },
  "schapengaas-nexum-basic": {
    plus: [
      ["Scherpe prijs", "betaalbaar voor grote weideprojecten."],
      ["Licht hanteerbaar", "soepele draad (2,3 / 1,8 mm), eenvoudig te plaatsen."],
      ["Rol van 50 m", "80, 100 of 120 cm hoog."],
    ],
    uses: ["Weilanden afbakenen", "Schapen, geiten en kleinvee", "Landelijke tuinen"],
  },
  "schapengaas-nexum-licht": {
    plus: [
      ["Zware zinklaag", "245 g/m², voor een lange levensduur."],
      ["Goede prijs-kwaliteit", "draad 2,4 / 1,9 mm, stevig en eenvoudig te plaatsen."],
      ["Rol van 50 m", "80, 100 of 120 cm hoog."],
      ["Alternatief voor plastiek", "een milieuvriendelijkere afrastering."],
    ],
    uses: ["Weiland voor schapen of geiten", "Kleinvee", "Akker- en tuinbouw", "Met kastanje of robinia palen"],
  },

  // ── Plaatsing en materiaal ─────────────────────────────────────────────
  grondboor: {
    plus: [
      ["Precies passende gaten", "voor ronde palen: ze staan sneller en steviger."],
      ["Spiraal van 8 cm", "de boorkop van 32 cm haalt de aarde in één keer boven."],
      ["Stevig staal", "ook geschikt voor harde grond."],
    ],
    uses: ["Gaten voor hekwerkpalen", "Voorboren voor poortpalen", "Palen in harde of stenige grond"],
  },
  "grondboor-kopie": {
    plus: [
      ["Lang", "1250 mm: diepe gaten zonder veel inspanning."],
      ["Ø 7,5 of 9 cm", "voor palen van kastanje en robinia."],
      ["Brede handgreep", "350 mm voor een goede grip."],
      ["Ook te huur", "€10, met €50 borg die u terugkrijgt."],
    ],
    uses: ["Gaten voor kastanje of robinia palen", "Diepe gaten voor poortpalen", "Eenmalig project? Huur hem"],
  },
  "tuin-voorhamer": {
    plus: [
      ["Spaart de paalkop", "houten of rubberen kop: de paal splijt niet."],
      ["Gemaakt voor houten palen", "veilig en efficiënt kloppen."],
      ["Ook te huur", "€10, met €50 borg die u terugkrijgt."],
    ],
    uses: ["Kastanje en robinia palen inkloppen", "Hekwerk plaatsen", "Eenmalig project? Huur hem"],
  },
  "beslag-hang-sluitwerk": {
    plus: [
      ["Alles voor de poort", "scharnieren, sluitingen, grendel en grondpen."],
      ["Voor tuinpoort én veldpoort", "aparte sets per type poort."],
    ],
    uses: ["Cleft & Field poorten en hardhouten veldpoorten", "Tuinpoorten", "Versleten beslag vervangen"],
  },
  "hekwerk-draadverbinders": {
    plus: [
      ["RVS", "roestvrij en onderhoudsvrij, ook in regen en vocht."],
      ["Snel vast", "twee stelschroeven per draad, inbussleutel meegeleverd."],
      ["Naadloos", "twee rollen lopen strak in elkaar over."],
    ],
    uses: ["Twee rollen kastanje hekwerk aan elkaar koppelen", "Hekwerk op maat inkorten en weer verbinden"],
  },
  "paalhouder-met-punt-rond": {
    plus: [
      ["Paal staat boven de grond", "geen contact met natte aarde, dus geen rot."],
      ["Vuurverzinkt", "2 tot 2,5 mm wanddikte, roestbestendig."],
      ["Vier maten", "voor ronde palen van ø 81 tot 101 mm."],
    ],
    uses: ["Zachte of natte grond", "Tijdelijke palen", "Palen die lang moeten meegaan"],
  },
  houtschroeven: {
    plus: [
      ["Zelfborende punt", "speciaal voor hout."],
      ["200 per doos", "met TX-20 bit."],
      ["Voor buiten", "Ultimate of Shield Outdoor."],
    ],
    uses: ["Latten van het hekwerk op de palen schroeven", "Vlechtschermen aan palen bevestigen", "Houten constructies buiten"],
  },
  snelbeton: {
    plus: [
      ["Niet vooraf mengen", "hoeft niet eerst gemengd te worden: snel klaar."],
      ["Snel hard", "ook bij lage temperaturen (5 tot 30 °C)."],
      ["Zak van 25 kg", "webercel easy van Weber."],
    ],
    uses: ["Poortpalen", "Hoek- en eindpalen", "Palen die extra stevig moeten staan"],
  },
  "lariks-planken-delen": {
    plus: [
      ["Schaaldelen", "met de natuurlijke ronde rand van de stam: rustiek en ambachtelijk."],
      ["Betaalbaar", "een voordelig alternatief voor hardhout."],
      ["Warme kleur", "roodbruin, vergrijst later zilvergrijs."],
      ["Vier lengtes", "2 tot 5 m, ca. 20 cm breed en 22 mm dik."],
    ],
    uses: ["Gevelbekleding", "Tuinwanden en schuttingen", "Tuinhuizen, bijgebouwen en carports", "Landelijke constructies"],
  },
};

/** The pluspunten for a product handle or (for a page without one) a WordPress path. */
export function productHighlights(key: string | undefined): ProductHighlights | undefined {
  return key ? HIGHLIGHTS[key] : undefined;
}
