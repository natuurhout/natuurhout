/*
 * "Kastanje hekwerk en poort plaatsen", written by Natuurhout (Xander,
 * Oct 2026). Schetsen and steps are his; links point to this site's pages.
 */
export const HEKWERK_PLAATSEN = `
<ul class="nh-steps">
  <li><a href="#nh-materiaal"><span>Stap 1</span>Materiaal</a></li>
  <li><a href="#nh-palen"><span>Stap 2</span>Palen plaatsen</a></li>
  <li><a href="#nh-raster"><span>Stap 3</span>Hekwerk bevestigen</a></li>
  <li><a href="#nh-poort"><span>Stap 4</span>Poort plaatsen</a></li>
  <li><a href="#nh-afwerking"><span>Stap 5</span>Afwerking</a></li>
</ul>

<section class="nh-card" id="nh-materiaal">
  <h2><span class="nh-num">1</span>Benodigd materiaal</h2>
  <div class="nh-cols">
    <div class="nh-box">
      <h3>Van Natuurhout</h3>
      <ul>
        <li><a href="/project/rasterwerk-kastanjehout/">Kastanje hekwerk</a> (rasterwerk op rol)</li>
        <li><a href="/project/kastanjepalen/">Kastanje palen</a> (geschild en aan één kant gepunt)</li>
        <li><a href="/assortiment/poorten/">Kastanje poort</a></li>
        <li><a href="/shop/houtschroeven/">Houtschroeven</a></li>
        <li><a href="/shop/beslag-hang-sluitwerk/">Hang- en sluitwerk</a> (bij de meeste poorten inbegrepen)</li>
      </ul>
    </div>
    <div class="nh-box">
      <h3>Zelf voorzien</h3>
      <ul>
        <li>Boormachine + bits</li>
        <li>Spade of <a href="/shop/grondboor-kopie/">grondboor</a> <span class="nh-badge">te huur of te koop</span></li>
        <li><a href="/shop/tuin-voorhamer/">Slaghamer</a> <span class="nh-badge">te huur of te koop</span></li>
        <li>Spantouw + paaltjes</li>
        <li>Waterpas</li>
        <li>Rolmeter</li>
        <li>(Ketting)zaag <em>(optioneel)</em></li>
      </ul>
      <p class="nh-note"><strong>Huren bij Natuurhout:</strong> een slaghamer of handboor huur je voor €10, met €50 borg die je terugkrijgt bij het terugbrengen.</p>
    </div>
  </div>
  <div class="nh-tip"><p><strong>Hoeveel heb je nodig?</strong> Met onze <a href="/calculator/?keuze=hekwerk">calculator</a> reken je in een paar klikken uit hoeveel rollen, palen en schroeven je nodig hebt, met een richtprijs erbij.</p></div>
</section>

<section class="nh-card" id="nh-palen">
  <h2><span class="nh-num">2</span>Kastanje palen plaatsen</h2>
  <figure class="nh-sketch">
    <svg viewBox="0 0 600 270" role="img" aria-label="Schets: hoekpalen eerst, spantouw ertussen, daarna tussenpalen">
      <rect x="0" y="190" width="600" height="80" fill="#d9cba9"/>
      <line x1="64" y1="78" x2="530" y2="78" stroke="#c0392b" stroke-width="2" stroke-dasharray="7 5"/>
      <polygon points="50,60 64,60 64,241 57,255 50,241" fill="#7a4f27"/>
      <polygon points="530,60 544,60 544,241 537,255 530,241" fill="#7a4f27"/>
      <polygon points="210,62 224,62 224,241 217,255 210,241" fill="none" stroke="#7a4f27" stroke-width="2" stroke-dasharray="5 4"/>
      <polygon points="370,62 384,62 384,241 377,255 370,241" fill="none" stroke="#7a4f27" stroke-width="2" stroke-dasharray="5 4"/>
      <line x1="66" y1="112" x2="135" y2="196" stroke="#c49a6c" stroke-width="9" stroke-linecap="round"/>
      <rect x="550" y="95" width="11" height="70" rx="3" fill="#3f5f3a"/>
      <rect x="552" y="122" width="7" height="16" rx="3" fill="#eef3ea"/>
      <rect x="0" y="190" width="600" height="80" fill="#d9cba9" opacity=".75"/>
      <path d="M512,192 h8 M516,192 V253 M512,253 h8" stroke="#3f5f3a" stroke-width="2" fill="none"/>
      <text x="506" y="227" text-anchor="end" class="nh-lbl">± ⅓ in de grond</text>
      <text x="30" y="48" class="nh-lbl">① hoekpaal</text>
      <text x="470" y="48" class="nh-lbl">① eindpaal</text>
      <text x="250" y="70" class="nh-lbl">② spantouw</text>
      <text x="245" y="130">③ tussenpalen</text>
      <text x="245" y="146">langs het touw</text>
      <text x="96" y="140">steunpaal</text>
      <text x="96" y="155">(optioneel)</text>
      <text x="466" y="135">waterpas</text>
    </svg>
    <figcaption>Eerst hoeken en eindpunten, dan het touw spannen, pas daarna de tussenpalen.</figcaption>
  </figure>
  <ol>
    <li>Begin met de <strong>hoeken en eindpunten</strong>.</li>
    <li>Span een <strong>touw</strong> om de lijn van de omheining te bepalen.</li>
    <li>Zet de palen <strong>loodrecht</strong> met een waterpas.</li>
    <li>Zet de palen ongeveer <strong>⅓ van hun lengte in de grond</strong>.</li>
    <li>Vul aan met aarde en <strong>stamp goed aan</strong>.</li>
    <li>Plaats daarna de <strong>tussenpalen</strong> langs het touw, ongeveer <strong>om de 2 meter</strong>.</li>
  </ol>
  <div class="nh-tip"><p><strong>Tip:</strong> voor extra stevigheid kun je de hoekpalen ondersteunen met een schuine steunpaal.</p></div>
</section>

<section class="nh-card" id="nh-raster">
  <h2><span class="nh-num">3</span>Hekwerk bevestigen</h2>
  <figure class="nh-sketch">
    <svg viewBox="0 0 600 285" role="img" aria-label="Schets: rasterwerk tussen twee palen, vastgeschroefd bij de draden, net boven de grond">
      <defs><pattern id="nh-lat1" width="18" height="10" patternUnits="userSpaceOnUse"><rect x="6" y="0" width="6" height="10" fill="#c49a6c"/></pattern></defs>
      <rect x="0" y="200" width="600" height="85" fill="#d9cba9"/>
      <polygon points="40,45 56,45 56,264 48,278 40,264" fill="#7a4f27"/>
      <polygon points="500,45 516,45 516,264 508,278 500,264" fill="#7a4f27"/>
      <rect x="56" y="62" width="444" height="122" fill="url(#nh-lat1)"/>
      <g stroke="#555" stroke-width="2"><line x1="40" y1="72" x2="516" y2="72"/><line x1="40" y1="123" x2="516" y2="123"/><line x1="40" y1="174" x2="516" y2="174"/></g>
      <g fill="#c0392b"><circle cx="48" cy="72" r="5"/><circle cx="48" cy="123" r="5"/><circle cx="48" cy="174" r="5"/><circle cx="508" cy="72" r="5"/><circle cx="508" cy="123" r="5"/><circle cx="508" cy="174" r="5"/></g>
      <rect x="0" y="200" width="600" height="85" fill="#d9cba9" opacity=".75"/>
      <path d="M486,202 h8 M490,202 V276 M486,276 h8" stroke="#3f5f3a" stroke-width="2" fill="none"/>
      <text x="480" y="244" text-anchor="end" class="nh-lbl">± ⅓ in de grond</text>
      <line x1="530" y1="123" x2="580" y2="123" stroke="#3f5f3a" stroke-width="3"/>
      <polygon points="580,115 594,123 580,131" fill="#3f5f3a"/>
      <text x="62" y="36" class="nh-lbl">① begin aan een eindpaal</text>
      <text x="300" y="36">● = schroef bij elke draadverbinding</text>
      <text x="530" y="108" class="nh-lbl">spannen</text>
      <line x1="300" y1="186" x2="300" y2="198" stroke="#3f5f3a" stroke-width="2"/>
      <text x="310" y="196">net boven de grond</text>
    </svg>
    <figcaption>Schroef bij de draden, span strak naar de volgende paal, laat het raster net vrij van de grond.</figcaption>
  </figure>
  <ol>
    <li>Rol het kastanje hekwerk uit langs de palen.</li>
    <li>Begin aan een <strong>eindpaal</strong> en schroef het eerste latje met houtschroeven tegen de paal.</li>
    <li>Laat het hekwerk indien mogelijk <strong>net boven de grond zweven</strong>.</li>
    <li><strong>Span het hekwerk strak</strong> tussen de palen. Gebruik eventueel een spade als hefboom.</li>
    <li>Schroef telkens vast <strong>bij de draadverbindingen</strong> (waar de draad rond het latje zit).</li>
  </ol>

  <h3>Twee rollen met elkaar verbinden</h3>
  <figure class="nh-sketch">
    <svg viewBox="0 0 600 200" role="img" aria-label="Schets: overschot draad van rol 1 rond het eerste latje van rol 2 draaien">
      <defs><pattern id="nh-lat2" width="18" height="10" patternUnits="userSpaceOnUse"><rect x="6" y="0" width="6" height="10" fill="#c49a6c"/></pattern></defs>
      <rect x="40" y="40" width="216" height="120" fill="url(#nh-lat2)"/>
      <rect x="330" y="40" width="230" height="120" fill="url(#nh-lat2)" opacity=".55"/>
      <rect x="330" y="40" width="7" height="120" fill="#7a4f27"/>
      <g stroke="#555" stroke-width="2" fill="none">
        <line x1="40" y1="50" x2="256" y2="50"/><line x1="40" y1="100" x2="256" y2="100"/><line x1="40" y1="150" x2="256" y2="150"/>
        <path d="M256,50 L330,50 c6,-6 12,0 7,6 c-5,5 -12,0 -7,-6"/>
        <path d="M256,100 L330,100 c6,-6 12,0 7,6 c-5,5 -12,0 -7,-6"/>
        <path d="M256,150 L330,150 c6,-6 12,0 7,6 c-5,5 -12,0 -7,-6"/>
        <line x1="337" y1="50" x2="560" y2="50" opacity=".6"/><line x1="337" y1="100" x2="560" y2="100" opacity=".6"/><line x1="337" y1="150" x2="560" y2="150" opacity=".6"/>
      </g>
      <text x="110" y="30" class="nh-lbl">rol 1</text>
      <text x="430" y="30" class="nh-lbl">rol 2</text>
      <text x="236" y="188">extra draad rond het eerste latje van rol 2 draaien</text>
    </svg>
  </figure>
  <ul>
    <li>Gebruik het <strong>extra ijzerdraad</strong> op het einde van de rol om het eerste latje van de nieuwe rol vast te maken.</li>
    <li>Te weinig draad? Verwijder één latje en verbind de draad op de juiste plek door.</li>
    <li>Of gebruik onze <a href="/shop/hekwerk-draadverbinders/"><strong>draadverbinders</strong></a> voor een nette en stevige verbinding.</li>
  </ul>
  <div class="nh-tip nh-why"><p><strong>Waarom <a href="/shop/houtschroeven/">schroeven</a> in plaats van krammen?</strong> Het is netter, je kunt het hekwerk nog herpositioneren en het werkt vlotter.</p></div>
</section>

<section class="nh-card" id="nh-poort">
  <h2><span class="nh-num">4</span>Kastanje poort plaatsen</h2>
  <figure class="nh-sketch">
    <svg viewBox="0 0 600 295" role="img" aria-label="Schets: eerst hangpaal, dan poort aan de duimen hangen, daarna sluitpaal">
      <defs><pattern id="nh-lat3" width="18" height="10" patternUnits="userSpaceOnUse"><rect x="6" y="0" width="6" height="10" fill="#c49a6c"/></pattern></defs>
      <rect x="0" y="205" width="600" height="90" fill="#d9cba9"/>
      <polygon points="50,208 86,208 92,280 44,280" fill="#a9a59c"/>
      <line x1="60" y1="105" x2="18" y2="205" stroke="#c49a6c" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 12" opacity=".9"/>
      <polygon points="60,40 76,40 76,273 68,287 60,273" fill="#7a4f27"/>
      <g stroke="#7a4f27" stroke-width="7" fill="none" stroke-linecap="round">
        <rect x="96" y="75" width="226" height="115" rx="2"/>
        <line x1="99" y1="187" x2="319" y2="78"/>
      </g>
      <g stroke="#c49a6c" stroke-width="4"><line x1="140" y1="78" x2="140" y2="187"/><line x1="185" y1="78" x2="185" y2="187"/><line x1="230" y1="78" x2="230" y2="187"/><line x1="275" y1="78" x2="275" y2="187"/></g>
      <g fill="#333"><rect x="70" y="84" width="30" height="8" rx="2"/><rect x="70" y="172" width="30" height="8" rx="2"/></g>
      <polygon points="340,55 356,55 356,266 348,280 340,266" fill="#7a4f27"/>
      <rect x="318" y="126" width="26" height="10" rx="2" fill="#333"/>
      <rect x="356" y="85" width="214" height="100" fill="url(#nh-lat3)" opacity=".6"/>
      <rect x="0" y="205" width="600" height="90" fill="#d9cba9" opacity=".6"/>
      <path d="M364,207 h8 M368,207 V280 M364,280 h8" stroke="#3f5f3a" stroke-width="2" fill="none"/>
      <text x="378" y="248" class="nh-lbl">± ⅓ in de grond</text>
      <circle cx="68" cy="24" r="12" fill="#3f5f3a"/><text x="63.5" y="29" fill="#fff" style="fill:#fff;font-weight:700">1</text>
      <circle cx="120" cy="58" r="12" fill="#3f5f3a"/><text x="115.5" y="63" style="fill:#fff;font-weight:700">2</text>
      <circle cx="348" cy="38" r="12" fill="#3f5f3a"/><text x="343.5" y="43" style="fill:#fff;font-weight:700">3</text>
      <text x="84" y="28">hangpaal</text>
      <text x="136" y="62">poort aan de duimen hangen</text>
      <text x="364" y="42">sluitpaal + sluiting</text>
      <text x="96" y="230">snelbeton (optioneel)</text>
    </svg>
    <figcaption>Volgorde: hangpaal → poort ophangen → sluitpaal op exacte maat.</figcaption>
  </figure>

  <h3>4.1 Hangpaal zetten</h3>
  <ul>
    <li>Begin met de <strong>poortpaal</strong> waaraan de poort komt te hangen.</li>
    <li>Maak een <strong>gat</strong> met een grondboor of spade.</li>
    <li>Zet de paal <strong>recht</strong> en voeg eventueel <strong>snelbeton</strong> toe.</li>
    <li>Een schuine <strong>steunpaal</strong> geeft extra stevigheid.</li>
  </ul>
  <h3>4.2 Poort monteren</h3>
  <ul>
    <li>Schroef het <strong>scharnierdeel (duimen)</strong> met houtschroeven aan de paal.</li>
    <li>Hang de poort op en controleer of ze vlot opent en sluit.</li>
    <li>Standaard draait een poort <strong>naar binnen open</strong>, weg van de straat: zo zitten de scharnieren en de sluiting.</li>
  </ul>
  <h3>4.3 Sluitpaal zetten</h3>
  <ul>
    <li>Nu de poort hangt, heb je de <strong>exacte maat</strong> voor de sluitpaal. Zet die op dezelfde manier als de hangpaal.</li>
    <li>Monteer de <strong>sluiting</strong> op de paal en aan de poort.</li>
  </ul>
</section>

<section class="nh-card" id="nh-afwerking">
  <h2><span class="nh-num">5</span>Afwerkingstips</h2>
  <figure class="nh-sketch">
    <svg viewBox="0 0 600 270" role="img" aria-label="Schets: kastanjehekwerk golft mee met oneffen terrein, paaltop gelijk met de bovenste draad, palen een derde in de grond">
      <defs>
        <pattern id="nh-lat4" width="18" height="10" patternUnits="userSpaceOnUse"><rect x="6" y="0" width="6" height="10" fill="#c49a6c"/></pattern>
        <clipPath id="nh-clip4"><path d="M0,80 Q150,20 300,50 Q450,80 600,70 L600,185 Q450,195 300,165 Q150,135 0,195 Z"/></clipPath>
      </defs>
      <rect x="0" y="0" width="600" height="270" fill="url(#nh-lat4)" clip-path="url(#nh-clip4)"/>
      <g stroke="#555" stroke-width="2" fill="none">
        <path d="M0,90 Q150,30 300,60 Q450,90 600,80"/>
        <path d="M0,137.5 Q150,77.5 300,107.5 Q450,137.5 600,127.5"/>
        <path d="M0,185 Q150,125 300,155 Q450,185 600,175"/>
      </g>
      <polygon points="93,60 107,60 107,223 100,237 93,223" fill="#7a4f27"/>
      <polygon points="293,60 307,60 307,223 300,237 293,223" fill="#7a4f27"/>
      <polygon points="493,82 507,82 507,245 500,259 493,245" fill="#7a4f27"/>
      <path d="M0,208 Q150,148 300,178 Q450,208 600,198 L600,270 L0,270 Z" fill="#d9cba9" opacity=".8"/>
      <path d="M484,202 h8 M488,202 V259 M484,259 h8" stroke="#3f5f3a" stroke-width="2" fill="none"/>
      <text x="478" y="235" text-anchor="end" class="nh-lbl">± ⅓ in de grond</text>
      <text x="320" y="32" class="nh-lbl">paaltop = bovenste draad</text>
      <line x1="315" y1="36" x2="306" y2="56" stroke="#3f5f3a" stroke-width="2"/>
      <text x="40" y="258" class="nh-lbl">hekwerk golft mee met het terrein</text>
    </svg>
  </figure>
  <ul>
    <li>Zet de palen op de hoogte van de <strong>bovenste draad</strong> van het hekwerk.</li>
    <li>Gebruik <a href="/project/postsaver-voor-palen/"><strong>postsavers</strong></a> voor een langere levensduur van je palen, ook op de poortpalen.</li>
    <li>Op <strong>oneffen terrein</strong>: laat het hekwerk mee op en neer golven in plaats van het recht te forceren.</li>
  </ul>
</section>

<div class="nh-cta">
  <p><strong>Vragen over je plaatsing?</strong></p>
  <p>Bel <a href="tel:+3252558858">052 55 88 58</a> of <a href="tel:+32473740926">0473 74 09 26</a>, stuur een <a href="https://wa.me/3252558858">WhatsApp</a> of mail <a href="mailto:info@natuurhout.be">info@natuurhout.be</a>.</p>
  <p>Liever niet zelf plaatsen? <a href="/offerte-aanvragen/">Vraag een offerte aan</a>, dan plaatsen wij het voor je.</p>
</div>
`;
