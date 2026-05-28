// ─── Contenuto Guida Brera Replenishment ─────────────────────────────────────
// Aggiornato automaticamente ad ogni nuova versione dell\'app.
// v13 — Maggio 2026

export const VERSION = 'v24c — Maggio 2026'

export const sections = [
  // ─── INTRODUZIONE ─────────────────────────────────────────────────────────
  {
    id: 'intro',
    icon: 'Home',
    title: "Cos\'è Brera Replenishment",
    subsections: [
      {
        id: 'intro-cosa',
        title: "Obiettivo",
        content: `Brera Replenishment è la workstation operativa per il riordino giornaliero di ricambi auto. Guida l\'operatore dall\'import del report ERP fino all\'ordine sul portale fornitore, con supporto AI in ogni fase.

L\'obiettivo principale è ridurre il tempo di elaborazione da ore a minuti, eliminando errori manuali e costruendo nel tempo una base di conoscenza che migliora automaticamente sessione dopo sessione.`,
      },
      {
        id: 'intro-avvio',
        title: "Avvio dell\'app",
        isNew: false,
        content: `Prima volta (una sola volta):
  cd ~/Downloads && unzip -o brera-replenishment-v13.zip
  cd brera-replenishment && npm install

Ogni volta:
  cd ~/Downloads/brera-replenishment && npm run dev

Poi apri il browser su: http://localhost:5173`,
        code: true,
      },
    ],
  },

  // ─── WORKSTATION ──────────────────────────────────────────────────────────
  {
    id: 'workstation',
    icon: 'Zap',
    title: 'Workstation — Il cuore operativo',
    isNew: true,
    subsections: [
      {
        id: 'ws-cosa',
        title: 'Cos\'è la Workstation',
        content: `La Workstation è la schermata principale di Claudio. Accessibile dal pulsante arancio "Workstation" in navbar.

Permette di elaborare le urgenze una alla volta, con tutto il necessario in una schermata sola:
— Lista urgenze a sinistra (prioritarie prima)
— Dettaglio articolo e offerte al centro
— Riepilogo ordine e azioni a destra
— AI Assistant opzionale come quarto pannello`,
      },
      {
        id: 'ws-flusso',
        title: 'Flusso operativo',
        content: `1. Carica il file Excel da Report
2. Apri la Workstation — le urgenze sono già caricate in coda
3. Clicca il primo articolo — parte automaticamente la ricerca su QRicambi (simulato)
4. Valuta le offerte — la migliore è pre-selezionata dall\'AI
5. Clicca CONFERMA ORDINE oppure APRI PORTALE FORNITORE
6. Passa all\'articolo successivo — automatico dopo la conferma

La barra in cima mostra il progresso della sessione in percentuale.

PROGRESSO PERSISTENTE: se ricarichi la pagina a metà sessione, la Workstation riprende esattamente dove eri — stesso articolo corrente, stessi completati e saltati. Il progresso viene salvato automaticamente in sessionStorage.`,
      },
      {
        id: 'ws-modalita',
        title: 'Modalità Manuale vs ✦ AI',
        isNew: true,
        content: `Il toggle in alto a destra nella Workstation passa tra due modalità:

MANUALE
— Nessuna chiamata API, zero latenza
— Claudio decide tutto autonomamente
— Funziona anche senza connessione internet
— Ideale per operatori esperti che conoscono già i fornitori

✦ AI (Modalità assistita)
— Attiva i 12 moduli AI automaticamente ad ogni ricerca
— Suggerisce il fornitore preferito da Claudio basandosi sullo storico
— Rileva anomalie di prezzo, descrizioni sospette, quantità ottimali
— Richiede API key Anthropic configurata in Impostazioni per le analisi avanzate
— I moduli euristici funzionano sempre, anche senza API key

Lo stato del toggle viene salvato tra sessioni.`,
      },
    ],
  },

  // ─── AI ASSISTANT ─────────────────────────────────────────────────────────
  {
    id: 'ai-assistant',
    icon: 'Sparkles',
    title: 'AI Assistant — Chat e istruzioni',
    isNew: true,
    subsections: [
      {
        id: 'ai-come',
        title: 'Come aprire il pannello AI',
        content: `Nella Workstation, clicca il pulsante "Chiedi AI" in alto a destra.

Si apre un pannello laterale con 3 tab:
— Sul pezzo: chat contestuale sull\'articolo corrente
— Istruzioni generali: regole operative di Brera
— Storico: tutte le domande e risposte precedenti`,
      },
      {
        id: 'ai-pezzo',
        title: 'Chat sul pezzo',
        isNew: true,
        content: `La tab "Sul pezzo" è una chat con Claude che ha già il contesto completo dell\'articolo:
— Codice madre e normalizzato
— Gruppo merceologico e linea richiesta
— Urgenza e giacenza
— Tutte le offerte disponibili con prezzi e logistica

Non devi copiare nulla — Claude vede già tutto.

PROMPT RAPIDI DISPONIBILI:
— "Quale offerta sceglieresti e perché?"
— "Ci sono rischi in queste offerte che non vedo?"
— "Il prezzo è in linea con il mercato?"
— "Conviene fare scorta o ordinare il minimo?"
— "Quale costruttore è più affidabile per questo tipo?"
— "Il lead time è accettabile con questa urgenza?"

Puoi anche scrivere domande libere nel campo in basso.`,
      },
      {
        id: 'ai-generali',
        title: 'Istruzioni generali',
        isNew: true,
        content: `Le istruzioni generali sono le regole operative di Brera che vengono iniettate in OGNI analisi AI come contesto prioritario.

Esempi di regole utili:
— "Per i dischi freno usa sempre Brembo se disponibile in filiale locale"
— "Per i filtri olio preferisco la linea Economico se il prezzo è sotto €3"
— "Evita fornitori con sede solo centrale se urgenza è Prioritaria"
— "Se c\'è promo >30% acquista scorta per 3 mesi anche se non urgente"
— "Per le batterie usa sempre Varta o Bosch, mai economico"

Clicca sui suggerimenti rapidi per aggiungerle in un click, poi premi SALVA.

Le istruzioni vengono salvate permanentemente e non si perdono al refresh.`,
      },
    ],
  },

  // ─── 12 MODULI AI ─────────────────────────────────────────────────────────
  {
    id: 'ai-moduli',
    icon: 'Brain',
    title: '12 Moduli AI — Come funzionano',
    isNew: true,
    subsections: [
      {
        id: 'mod-1',
        title: 'Modulo 1 — Classificazione linea qualitativa',
        content: `PROBLEMA: Quando arriva un articolo da un costruttore sconosciuto, non è immediato capire se è Economico, Primo Equipaggiamento o Originale.

COSA FA: L\'AI guarda il nome del costruttore, la descrizione e la fascia di prezzo e classifica automaticamente la linea qualitativa. Ogni conferma di Claudio viene memorizzata.

COSTRUTTORI ORIGINALI riconosciuti: Brembo, Bosch, Continental, Valeo, LUK, Sachs, Bilstein, Delphi, NGK, Varta, Mann, Mahle, SKF, FAG, Gates, Dayco, ATE, TRW, Ferodo, Textar.

COSTRUTTORI ECONOMICI riconosciuti: Ridex, Blue Print, Kamoka, Japanparts, Ashka, Stark, Topran, Meat, Fispa.

DOVE APPARE: Pannello AI nella Workstation (modalità ✦ AI).`,
      },
      {
        id: 'mod-2',
        title: 'Modulo 2 — Rilevamento complementari intelligente',
        content: `PROBLEMA: QRicambi mescola articoli principali e complementari (mollette, grasso, clip). Ordinarli per errore fa perdere tempo e denaro.

COSA FA: L\'AI legge la descrizione di ogni offerta e identifica automaticamente i complementari, escludendoli dal ranking. Vengono mostrati in fondo con badge rosso "COMPLEMENTARE — escluso".

PAROLE CHIAVE MONITORATE: mollette, clip, grasso, spray, kit bulloni, viti, guarnizione, coprimozzo, cappellotto, antirumore, sensore aggiuntivo, kit accessori.

DOVE APPARE: Direttamente nella lista offerte — gli articoli esclusi appaiono in fondo con opacità ridotta. Toggle "Mostra complementari" per vederli tutti.`,
      },
      {
        id: 'mod-3',
        title: 'Modulo 3 — Apprendimento preferenze Claudio',
        content: `PROBLEMA: Claudio ha preferenze implicite per fornitore e brand per categoria che nessuno ha mai scritto. Ogni giorno le applica mentalmente senza che il sistema le conosca.

COSA FA: Ogni volta che Claudio conferma un ordine, il sistema registra silenziosamente: gruppo merceologico, linea, urgenza, fornitore scelto, prezzo, logistica. Dopo 2+ scelte per la stessa categoria, l\'AI propone già il fornitore che Claudio avrebbe scelto.

ESEMPIO: Se per i filtri olio Claudio sceglie sempre Demauto, dall\'articolo successivo della stessa categoria Demauto appare pre-selezionato con il banner "AI suggerisce: da storico".

LA MEMORIA CRESCE: più Claudio usa la Workstation, più l\'AI diventa precisa. È il meccanismo che nel tempo porta alla surroga automatica.

DOVE APPARE: Banner arancio "AI suggerisce" sopra la lista offerte (modalità ✦ AI).`,
      },
      {
        id: 'mod-4',
        title: 'Modulo 4 — Anomalie prezzo',
        content: `PROBLEMA: Nessuno controlla se il prezzo di oggi è anomalo rispetto a quanto pagato in passato. Una promo si perde, un aumento anomalo passa inosservato.

COSA FA: L\'AI confronta il prezzo corrente con lo storico degli acquisti precedenti per quel codice e fornitore. Segnala con banner colorato:

🎯 BANNER ARANCIO: "Prezzo X% sotto la media storica — possibile promo!" → Valuta di acquistare scorta
⚠ BANNER ROSSO: "Prezzo X% sopra la media storica — verifica prima di ordinare" → Potrebbe essere un errore

LA STORIA SI ACCUMULA: Il sistema registra automaticamente ogni prezzo visto durante le ricerche.

DOVE APPARE: Pannello AI nella Workstation (modalità ✦ AI).`,
      },
      {
        id: 'mod-5',
        title: 'Modulo 5 — Quantità ottimale d\'acquisto',
        content: `PROBLEMA: Il suggerimento ERP è meccanico (copertura mensile base) e non considera promo, lead time lunghi o stagionalità.

COSA FA: L\'AI analizza velocità di rotazione, eventuale promo attiva, lead time del fornitore e propone una quantità ottimale diversa dall\'ERP quando ha senso.

ESEMPI:
— Se c\'è promo >30%: suggerisce 3× il minimo ERP
— Se il lead time è >8 giorni e l\'articolo vende 8/mese: suggerisce anticipo
— Se la rotazione è bassa e non c\'è promo: conferma il minimo ERP

DOVE APPARE: Pannello AI "📦 Qtà ottimale" (modalità ✦ AI).`,
      },
      {
        id: 'mod-6',
        title: 'Modulo 6 — Suggerimento codice figlio',
        content: `PROBLEMA: Quando il codice madre è troppo generico (BRRNOCODE, ZAFFO...), QRicambi restituisce risultati inutili. Bisogna trovare il codice figlio in iDempiere.

COSA FA: Prima di arrendersi, l\'AI cerca nella memoria dei codici già confermati se esiste un codice simile (stesso gruppo, stesso prefisso brand) che potrebbe essere usato come punto di partenza.

ESEMPIO: Se cerchi BRRNOCODE (Brembo, Freni) e in memoria hai già confermato BRR09.A621.11 per i dischi Brembo, il sistema lo suggerisce come riferimento.

DOVE APPARE: Pannello AI "🔍 Codici simili in memoria" (modalità ✦ AI).`,
      },
      {
        id: 'mod-7',
        title: 'Modulo 7 — Alert descrizione anomala',
        content: `PROBLEMA: Uno stesso codice numerico corto può essere usato da brand diversi per articoli completamente diversi (filtri vs pastiglie vs alternatori). Ordinare la cosa sbagliata è un errore costoso.

COSA FA: L\'AI legge la descrizione di ogni offerta e la confronta con il gruppo merceologico atteso. Se cerchi un filtro olio e la descrizione dice "kit distribuzione" — alert immediato in rosso.

MAPPATURA ATTESA:
— Filtro → deve contenere: filtro, filter, olio, aria, abitacolo, carburante
— Freni → disco, pastiglia, brake, pad, disc
— Sospensioni → ammortizzatore, shock, molla, spring
— Distribuzione → cinghia, belt, pompa, timing
— Frizioni → frizione, clutch, volano
— Elettrico → batteria, alternatore, motorino
— Raffreddamento → radiatore, termostato

DOVE APPARE: Banner rosso "⚠ Descrizione sospetta" (modalità ✦ AI).`,
      },
      {
        id: 'mod-8',
        title: 'Modulo 8 — Previsione fabbisogno',
        content: `PROBLEMA: Claudio lavora sempre sulle urgenze (giacenza zero) perché non ha tempo di guardare avanti. Gli articoli che staranno per esaurirsi non vengono anticipati.

COSA FA: Il sistema analizza il campo "Giorni Copertura" dal file Excel e identifica gli articoli con giacenza attuale ma copertura inferiore a 7 giorni. Li segnala nella Overview come "prossime urgenze".

COME LEGGERE: Se un articolo ha 4 giorni di copertura, diventerà urgenza tra 4 giorni. Anticipando l\'ordine oggi si evita il blocco operativo.

DOVE APPARE: Sezione "Prossime urgenze" nella Overview (visibile quando carichi il file Excel).`,
      },
      {
        id: 'mod-9',
        title: 'Modulo 9 — Suggerimento prezzo di vendita',
        content: `PROBLEMA: Determinare il prezzo di vendita richiede di conoscere il prezzo di acquisto, la linea qualitativa e i prezzi dei competitor. Non è immediato, specialmente per i brand non catalogati.

COSA FA: L\'AI calcola automaticamente il range di prezzo di vendita consigliato applicando i margini tipici per linea qualitativa:
— Originale: margine 20-35% sul prezzo di acquisto
— Primo Equipaggiamento: margine 35-55%
— Economico: margine 50-80%

ESEMPIO: Acquisto filtro olio Economico a €0.93 → prezzo vendita suggerito €1.58, range €1.40-€1.67.

DOVE APPARE: Pannello destra nella Workstation, sotto la motivazione AI "💰 Prezzo vendita suggerito" (modalità ✦ AI).`,
      },
      {
        id: 'mod-10',
        title: 'Modulo 10 — Raggruppamento ordini per fornitore',
        content: `PROBLEMA: Fare 20 ordini separati a Demauto nella stessa mattina genera spese di trasporto inutili. Raggruppare conviene ma richiede di tenere traccia manualmente.

COSA FA: Il sistema monitora gli ordini confermati nella sessione. Quando accumuli 3 o più articoli dallo stesso fornitore, appare un alert automatico con il risparmio stimato sulle spese di trasporto.

RISPARMIO STIMATO: ~€2.50 per articolo aggiunto allo stesso ordine (vs ordini separati).

DOVE APPARE: Modal popup automatico dopo la conferma dell\'ordine che raggiunge la soglia (modalità ✦ AI).`,
      },
      {
        id: 'mod-11',
        title: 'Modulo 11 — Articoli sostitutivi',
        content: `PROBLEMA: Quando un codice non viene trovato su QRicambi, il caso viene abbandonato nel backlog. Spesso esiste un equivalente già usato in passato.

COSA FA: Quando la ricerca non produce offerte, l\'AI cerca nella memoria degli articoli già trattati se esiste un sostitutivo dello stesso gruppo merceologico con offerte già registrate.

ESEMPIO: Cerchi ammortizzatore Monroe E6200 — non trovato. In memoria c\'è già E6200-ST (Stark, stesso gruppo) con offerte da Autodis. Il sistema lo suggerisce come alternativa.

DOVE APPARE: Pannello AI "🔄 Sostitutivi trovati in memoria" quando nessuna offerta è disponibile (modalità ✦ AI).`,
      },
      {
        id: 'mod-12',
        title: 'Modulo 12 — Sintesi EOD per il management',
        content: `PROBLEMA: A fine giornata Claudio deve comunicare al management cosa ha fatto, quanto ha speso, quali anomalie ci sono. Farlo manualmente richiede tempo.

COSA FA: Il Report End-of-Day genera automaticamente un testo narrativo in italiano professionale con: ordini confermati, valore totale, saving stimato, top fornitori, anomalie rilevate, articoli in revisione, prossime urgenze.

Il testo è pronto per essere copiato in una email o in una chat aziendale.

DOVE APPARE: Report EOD → tab "Testo" → sezione "Sintesi management".`,
      },
    ],
  },

  // ─── FLUSSO OPERATIVO ──────────────────────────────────────────────────────
  {
    id: 'flusso',
    icon: 'RefreshCw',
    title: 'Flusso operativo — 5 step',
    subsections: [
      {
        id: 'step-1',
        title: 'Step 1 — Import Report Excel',
        content: `Vai su Report nel menu. Trascina il file "Avviso Sottoscorta" nella zona tratteggiata.

Il sistema riconosce automaticamente:
— Urgenza Prioritaria (giacenza zero) vs Sottoscorta
— Articoli venduti a coppie (dischi freno ×2) o set (candele ×4)
— Codici generici da trattare con attenzione
— Prefissi brand da strippare (JPP→Japan Parts, ASH→Ashika, KNE→Knecht...)

Il file sopravvive al refresh grazie alla sessionStorage. Una barra nera in cima conferma il file attivo.

COLONNE ATTESE: Codice Madre, Linea Prodotto, Gruppo Merceologico, SottoGruppo Merceologico, N° Movimenti, Giacenza, Suggerimento Acquisto, Urgenza, Giorni Copertura.`,
      },
      {
        id: 'step-2',
        title: 'Step 2 — Normalizzazione',
        content: `La schermata Normalizzazione mostra la trasformazione Prima→Dopo di ogni codice articolo.

TRASFORMAZIONI AUTOMATICHE:
— Strip prefisso brand 3 lettere (JPP→Japan Parts, ASH→Ashika, KNE→Knecht, TEX→Textar, FER→Ferodo, BRR→Brembo e altri 20+ brand)
— Decompressione trattini (ASH10-03-316 → 1003316)
— Rimozione prefisso magazzino (M-103316 → 103316)
— Rilevamento codici generici (confidence 35%)

REVISIONE MANUALE:
Clicca ✏️ su una riga per aprire il pannello di revisione. Puoi correggere codice normalizzato, brand, famiglia ERP, famiglia TecDoc e aggiungere note.

Clicca "Conferma e salva in memoria" → la revisione viene salvata permanentemente nel localStorage e usata nei file futuri.

BADGE ✨ = dati recuperati dalla Memoria AI (sessioni precedenti).

CONFERMA BULK: il pulsante "Conferma X ad alta conf." nella filter bar esegue la conferma automatica di tutte le righe con confidence ≥ 90% non ancora revisionate. Utile per file con molte righe standard prima di concentrarsi sui casi anomali.

SUGGERIMENTO AI: Se hai la API key configurata, clicca "Suggerimento AI" per ricevere una proposta di normalizzazione da Claude con motivazione e confidence.`,
      },
      {
        id: 'step-3',
        title: 'Step 3 — Coda Fabbisogni',
        content: `La Coda Fabbisogni mostra tutti gli articoli del report, divisi in due sezioni: attivi (richiedono azione) ed esclusi automaticamente (visibili ma non ordinabili).

SEZIONE ATTIVI — articoli da elaborare:
Gli articoli in coda attiva sono ordinati per urgenza (Critica → Alta → Media → Bassa).

SEZIONE ESCLUSI — visibili ma degradati (opacità 55%, codice barrato):
— 🔵 IN TRANSITO: merce in arrivo sufficiente a coprire il fabbisogno
— 🔴 GIÀ ORDINATO: ordine inviato nelle ultime 24h — potenziale duplicato
— 🟡 MISMATCH FAMIGLIA: ERP ≠ TecDoc — revisione umana obbligatoria
— Passa il mouse sul badge per leggere il motivo dettagliato

TOGGLE "Mostra/Nascondi esclusi": pulsante in alto a destra nella barra esclusioni.

REASON CODE AI — etichetta che spiega perché l\'articolo attivo è in coda:
GIACENZA_ZERO → acquisto urgente
SOTTOSCORTA → giacenza insufficiente per il mese
MULTIPLO_x2 → venduto a coppie, quantità moltiplicata
CODICE_GENERICO → usare codice figlio su QRicambi
BASSA_CONF → verificare normalizzazione prima di ordinare
STD_REPLEN → riordino standard

Clicca una riga attiva per andare direttamente allo Scouting.

COERENZA GARANTITA: la logica di esclusione è condivisa tra Coda Fabbisogni, Workstation e Scouting tramite un hook unico (useQueue). Le tre schermate mostrano sempre gli stessi articoli attivi — nessuna divergenza possibile.`,
      },
      {
        id: 'step-4',
        title: 'Step 4 — Scouting Fornitori',
        content: `La schermata Scouting mostra le offerte QRicambi (simulate) per ogni articolo in coda.

AUTOMATICO: Appena selezioni un articolo dalla sidebar sinistra, parte automaticamente la ricerca. Vedi uno skeleton di caricamento per 300-900ms poi appaiono le offerte.

OGNI OFFERTA MOSTRA:
— Fornitore, codice, costruttore, linea qualitativa
— Prezzo netto e listino (o N.D. se non pubblicato)
— Logistica: Filiale Locale (arancio, rapida) o Sede Centrale (grigia)
— Lead time e data consegna stimata
— Fratelli articolo disponibili
— Score AI su 100

FILTRO LINEA: Puoi filtrare per Originale / Primo Equipaggiamento / Economico.

COMPLEMENTARI: Gli articoli complementari sono esclusi automaticamente (toggle per vederli).

COPIA CODICE: clicca il codice normalizzato nell\'header (chip cliccabile con icona copia) per copiarlo negli appunti. L\'icona diventa arancio per 1.8s come conferma. Utile per incollare direttamente nella barra di ricerca di QRicambi.

Nella sidebar sinistra, ogni codice articolo è anch\'esso cliccabile per la copia rapida.

MISMATCH BLOCCANTE: se l\'articolo ha _stato mismatch o confidence < 70%, lo scouting mostra un pannello arancio che blocca la selezione e spiega la divergenza ERP↔TecDoc. Due CTA disponibili: vai a Normalizzazione o apri il Task Board.

PULSANTE QRicambi: Apre il sito reale con la query pre-compilata per verifica manuale.

STATO SIDEBAR: nella lista sinistra, ogni articolo già ordinato nella sessione corrente mostra un'icona verde ✓ e il badge "ordinato". La riga è leggermente sfumata per distinguerla visivamente dagli articoli ancora da elaborare.

NESSUN RISULTATO — 4 strategie automatiche:
Se QRicambi non trova nulla, appare un pannello guidato con:
1. Varianti del codice (senza trattini, senza prefisso brand, solo cifre, codice madre originale) — ogni variante ha il pulsante "Riprova" che rilancia la ricerca
2. Sostitutivi da memoria AI — articoli equivalenti già usati in passato per lo stesso gruppo
3. Codici figlio simili — codici trovati in memoria per il gruppo merceologico
4. Ricerca manuale — campo input per incollare un codice figlio trovato in iDempiere, con CTA verso QRicambi

ALERT LINEA NON DISPONIBILE: se la linea richiesta (es. Originale) non ha offerte ma altre linee sì, appare un banner giallo con le linee disponibili e un pulsante per visualizzarle direttamente.

SPREAD PREZZO ANOMALO: se lo stesso articolo ha prezzi molto diversi tra fornitori (>40% di spread), appare un alert che invita a verificare se si tratta dello stesso articolo (diverso coating, qualità diversa).

ORARIO LIMITE: ogni offerta mostra un badge "Tardi" o "Weekend" se l'ordine potrebbe non essere processato in giornata (filiale: dopo 17:00, sede centrale: dopo 14:00, weekend).

LISTINO ASSENTE: se il fornitore non pubblica il listino, l'app stima il range di prezzo di vendita tipico per quella linea qualitativa (Originale 20-35%, PE 35-55%, Economico 50-80%).`,
      },
      {
        id: 'step-5',
        title: 'Step 5 — Ranking, Ordine ed Esito',
        content: `RANKING: Confronto strutturato con score per dimensione.
Pesi: Famiglia/Codice 30% · Linea Prodotto 20% · Disponibilità+Lead Time 20% · Prezzo Netto 15% · Brand 10% · Listino 5%.

SPIEGAZIONE AI: Per ogni raccomandazione mostra i motivi numerati e perché le alternative sono state scartate.

FINESTRA ORDINE: Simula il portale fornitore con browser integrato. Quantità modificabile, totale calcolato, motivazione AI.

PORTALE CON LOGIN: "Apri portale fornitore" → simula il login automatico con le credenziali configurate in Impostazioni → animazione 4 step → ordine confermato.

LOGIN FALLITO — MODALITÀ MANUALE: se il login automatico non riesce (credenziali scadute, captcha, 2FA), il sistema passa automaticamente alla modalità manuale mostrando:
— Un avviso con indicazione di aggiornare le credenziali in Impostazioni
— Una checklist a 5 passi per completare l'ordine manualmente sul portale
— Il pulsante "Ho ordinato manualmente" registra l'ordine con stato "Manuale"
Aggiornare le credenziali: Impostazioni → Fornitori → Modifica → Test connessione.

BLOCCO MISMATCH: se l\'articolo ha mismatch famiglia, il pulsante CONFERMA ORDINE è disabilitato (opacità 35%, cursore not-allowed) con un pannello arancio esplicativo. L\'unica azione disponibile è "Invia a Revisione". Per sbloccare: risolvi in Normalizzazione.

ESITO: 5 stati possibili:
— Ordine Demo Creato
— Inviato a Revisione
— Ordine Accodato
— Copertura da Transito
— Caso Sospeso`,
      },
    ],
  },

  // ─── MEMORIA AI ───────────────────────────────────────────────────────────
  {
    id: 'memoria',
    icon: 'Save',
    title: 'Memoria AI — Apprendimento permanente',
    subsections: [
      {
        id: 'mem-cosa',
        title: 'Come funziona la memoria',
        content: `La Memoria AI è il meccanismo che trasforma Brera Replenishment da uno strumento a un collaboratore che impara.

COSA VIENE MEMORIZZATO (localStorage — permanente):
— Codice madre → codice normalizzato confermato
— Prefisso brand 3 lettere → nome brand (JPP→Japan Parts)
— Codice madre → famiglia ERP e TecDoc corrette
— Note operative dell\'operatore
— Numero di conferme (aumenta la fiducia)
— Preferenze fornitore per categoria/linea
— Storico prezzi per codice+fornitore
— Classificazioni qualità per costruttore

COSA NON SI PERDE MAI: tutte le revisioni confermate in Normalizzazione.
COSA SI PERDE CHIUDENDO LA SCHEDA: il file Excel caricato (sessionStorage).`,
      },
      {
        id: 'mem-crescita',
        title: 'Come cresce la memoria',
        content: `La memoria cresce automaticamente con l\'uso:

Sessione 1: l\'AI fa errori, Claudio corregge → la memoria registra
Sessione 2: per i codici già corretti, l\'AI propone già il valore giusto
Sessione 10+: la maggior parte dei codici ricorrenti viene normalizzata automaticamente
Sessione 30+: l\'AI conosce le preferenze di fornitore di Claudio per categoria

BADGE ✨ in Normalizzazione = dati già in memoria.
BADGE "da storico" in Workstation = fornitore suggerito dallo storico scelte.

ESPORTAZIONE: Impostazioni → Memoria → Esporta JSON → backup o condivisione con altri operatori.`,
      },
    ],
  },

  // ─── IMPOSTAZIONI ─────────────────────────────────────────────────────────
  {
    id: 'impostazioni',
    icon: 'Settings',
    title: 'Impostazioni',
    subsections: [
      {
        id: 'imp-fornitori',
        title: 'Tab Fornitori',
        isNew: true,
        content: `Configura le credenziali per i 5 portali fornitori:
— Demauto (demauto.it)
— Movidis (movidis.it)
— Rhiag Hub (rhiag.it)
— Autodis Italia (autodis.it)
— Repar (repar.it)

Per ogni fornitore: inserisci username e password, poi clicca "Test connessione". Il badge verde "Connesso" conferma che le credenziali sono valide.

Le credenziali vengono salvate solo nel browser (localStorage) — non vengono mai trasmesse a terzi.

In produzione queste credenziali vengono usate dal backend Node.js per il login automatico sui portali reali.`,
      },
      {
        id: 'imp-api',
        title: 'Tab API & AI',
        content: `Inserisci la tua API key Anthropic (inizia con sk-ant-) per attivare:
— Suggerimenti AI in Normalizzazione
— Chat contestuale "Sul pezzo" nell\'AI Assistant
— Analisi avanzate dei moduli AI (classificazione, quantità ottimale)

Senza API key: tutte le funzioni manuali funzionano, i moduli AI usano le euristiche locali.

La chiave viene salvata nel localStorage del browser — non nel codice sorgente.`,
      },
      {
        id: 'imp-memoria',
        title: 'Tab Memoria',
        content: `Visualizza tutto ciò che la Memoria AI ha imparato:
— Codici normalizzati confermati con data e numero di conferme
— Brand appresi (prefisso → nome)
— Cronologia degli apprendimenti

ESPORTA JSON: scarica un backup completo della memoria.
CANCELLA MEMORIA: rimuove tutto tranne la API key. Da fare con cautela — si perdono tutti gli apprendimenti.`,
      },
    ],
  },

  // ─── TOOL COLLATERALI ─────────────────────────────────────────────────────
  {
    id: 'tool',
    icon: 'Wrench',
    title: 'Tool operativi collaterali',
    subsections: [
      {
        id: 'tool-prompt',
        title: 'Prompt Search Optimizer',
        content: `Accessibile da menu → "Prompt AI". Mostra le strategie di ricerca ottimizzate per i codici più problematici con 3 livelli di affidabilità:
— Verde = Alta affidabilità, usa questa per prima
— Arancio = Media, fallback se la prima non trova nulla
— Rosso = Bassa, genera molti falsi positivi — evita

Ogni variante ha un tasto copia e un tasto "Cerca" che apre QRicambi con quella query.`,
      },
      {
        id: 'tool-task',
        title: 'Task & Booking Board',
        content: `Kanban board con 4 colonne: Da elaborare / In corso / Da fare / Eseguito.

CLICCA UNA CARD → apre il drawer laterale con:
— Descrizione completa, assegnato, scadenza
— Card arancio "Apri Normalizzazione / Scouting / Ranking..." che naviga alla schermata giusta
— Pulsanti per spostare in un\'altra colonna
— Pulsante "Rimuovi task"

MENU ⋯ → dropdown flottante per spostamento rapido senza aprire il drawer.

TASK AUTO-GENERATI AL CARICAMENTO FILE:
Quando carichi un file Excel reale, il sistema analizza automaticamente le righe e crea task per:
— Righe con confidence < 50%: task "Revisione Mapping" priorità Alta
— Righe con confidence 50-70%: task "Verifica Normalizzazione" priorità Media
I task duplicati (stesso reqId già presente) vengono ignorati.

TASK AUTO-GENERATI MANUALMENTE:
— Revisione Mapping: mismatch ERP/TecDoc
— Revisione Anagrafica: descrizione fuorviante
— Listino Mancante: fornitore senza prezzo pubblicato
— Follow-up Ordine: conferma ricezione ordini precedenti
— Ranking Logistico: sede vs filiale con urgenza critica`,
      },
      {
        id: 'tool-eod',
        title: 'Report End-of-Day',
        content: `3 viste disponibili:

DASHBOARD: KPI sessione, distribuzione esiti a barre, top fornitori, qualità ordini, performance AI, anomalie.

OVERVIEW LIVE: le card "Ordini Sessione" e "Valore Ordinato" nella Overview si aggiornano automaticamente ogni 3 secondi riflettendo gli ordini confermati in Workstation o Scouting — senza dover navigare al Report EOD.

TESTO: Report narrativo in italiano professionale pronto per email al management. Include: ordini confermati, valore, saving, anomalie, prossimi passi.

EXPORT: Scarica PDF, CSV ordini, CSV task, CSV anomalie (simulato in demo).`,
      },
    ],
  },

  // ─── RISOLUZIONE PROBLEMI ─────────────────────────────────────────────────
  {
    id: 'troubleshooting',
    icon: 'SlidersHorizontal',
    title: 'Risoluzione problemi',
    subsections: [
      {
        id: 'ts-bianca',
        title: 'Pagina bianca',
        content: `1. Apri la console (CMD+Option+I su Mac, F12 su Windows)
2. Cerca errori in rosso — segnala il testo esatto
3. Prova CMD+SHIFT+R per hard refresh (svuota la cache)
4. Se persiste: CTRL+C nel terminale, poi "npm run dev" di nuovo`,
      },
      {
        id: 'ts-excel',
        title: 'File Excel non caricato',
        content: `— Il file deve essere .xlsx o .xls (non .csv)
— Le colonne devono avere esattamente questi nomi: Codice Madre, Urgenza, Giacenza, Suggerimento Acquisto
— Se le intestazioni sono diverse, rinominale nel file prima di caricare`,
      },
      {
        id: 'ts-ai',
        title: 'AI non risponde / errore CORS',
        content: `L\'errore CORS indica che il browser blocca le chiamate dirette ad api.anthropic.com.

In demo: i moduli AI usano automaticamente le euristiche locali — funziona tutto lo stesso.

Per la chat "Sul pezzo" con Claude API: in produzione serve un backend Node.js che fa da proxy. Il frontend chiama localhost:3001/ai invece di api.anthropic.com direttamente.

Se vedi "API key richiesta": vai in Impostazioni → API & AI → inserisci la chiave sk-ant-...`,
      },
      {
        id: 'ts-dati',
        title: 'Dati persi dopo refresh',
        content: `FILE EXCEL: salvato in sessionStorage → sopravvive al refresh ma non alla chiusura della scheda. Se hai chiuso, ricarica il file da Report.

REVISIONI NORMALIZZAZIONE: salvate in localStorage → non si perdono mai.

PREFERENZE FORNITORE: salvate in localStorage → non si perdono mai.

API KEY: salvata in localStorage → non si perde mai.`,
      },
    ],
  },

  // ─── GLOSSARIO ────────────────────────────────────────────────────────────
  {
    id: 'glossario',
    icon: 'BookOpen',
    title: 'Glossario',
    subsections: [
      {
        id: 'glos-termini',
        title: 'Termini tecnici',
        content: `CODICE MADRE: La radice che identifica una famiglia di articoli simili nell\'ERP iDempiere.
CODICE FIGLIO: Il codice specifico di un singolo articolo, derivato dal codice madre.
CODICE NORMALIZZATO: Il codice pulito, senza prefissi, pronto per la ricerca su QRicambi.
QRICAMBI: Aggregatore di portali fornitori — la piattaforma usata per lo scouting. Non è un e-commerce, non vende direttamente.
iDEMPIERE: Il sistema ERP di Brera — fonte dei dati di riordino.
TECDOC: Banca dati standard del settore per l\'identificazione ricambi auto.
LINEA PRODOTTO: Livello qualitativo — Originale (OEM), Primo Equipaggiamento (aftermarket), Economico.
MISMATCH: Discrepanza tra famiglia ERP e categoria TecDoc per lo stesso codice.
CONFIDENCE: Percentuale di affidabilità della normalizzazione automatica (0-100%).
MULTIPLO: Fattore di vendita — ×2 per dischi freno (coppie), ×4 per candele (set).
SCORE AI: Punteggio 0-100 calcolato per rankare le offerte fornitore.
MEMORIA AI: Base di conoscenza persistente costruita dalle revisioni confermate.
sessionStorage: Memoria del browser per la sessione corrente (svuotata chiudendo la scheda).
localStorage: Memoria permanente del browser (rimane tra sessioni e refresh).
CORS: Errore di sicurezza del browser che blocca chiamate API dirette — risolto in produzione con backend proxy.`,
      },
    ],
  },,
  {
    id: 'ordini',
    icon: 'ClipboardList',
    title: 'Registro Ordini',
    isNew: true,
    subsections: [
      {
        id: 'ord-cosa',
        title: 'Cos\'è il Registro Ordini',
        content: `Il Registro Ordini è la destinazione permanente di tutti gli ordini confermati nella Workstation. Accessibile da menu → Ordini.

Ogni volta che clicchi CONFERMA ORDINE o APRI PORTALE FORNITORE → Ho ordinato manualmente, l\'ordine viene salvato automaticamente in localStorage e rimane disponibile tra sessioni.

COSA VIENE REGISTRATO per ogni ordine:
— ID ordine univoco (ORD-timestamp)
— Data e ora di conferma
— Codice madre e codice normalizzato
— Gruppo merceologico e sottogruppo
— Fornitore, codice fornitore, costruttore
— Quantità, prezzo netto, totale
— Logistica e lead time
— Stato: Confermato / In revisione / Accodato / Manuale
— Note libere modificabili`,
      },
      {
        id: 'ord-stati',
        title: 'Stati ordine',
        content: `Ogni ordine può essere in uno di questi stati, modificabile direttamente dalla tabella:

CONFERMATO: ordine completato correttamente tramite portale automatico
IN REVISIONE: richiede approvazione manuale del buyer prima dell\'invio
ACCODATO: inserito in lista per elaborazione batch
MANUALE: completato manualmente sul portale fornitore (login fallito o preferenza)
ANNULLATO: ordine cancellato — rimane nel registro per storico`,
      },
      {
        id: 'ord-export',
        title: 'Export e integrazione iDempiere',
        content: `ATTENZIONE: gli ordini confermati in Brera NON creano automaticamente Ordini di Acquisto in iDempiere. Questo è un limite noto dell\'attuale implementazione (vedi nota critica 3.3).

WORKAROUND disponibili:

CSV: scarica tutti gli ordini in formato Excel-compatibile con tutte le colonne. Importabile manualmente in qualsiasi sistema.

EXPORT iDempiere: scarica un file JSON nel formato previsto per la futura integrazione API con iDempiere. Contiene: documentNo, dateOrdered, vendor, productCode, qty, priceActual, lineNetAmt, description. Pronto per essere processato quando l\'integrazione API sarà disponibile.

SOLUZIONE FUTURA: il backend Node.js in produzione chiamerà l\'API REST di iDempiere per creare l\'OdA automaticamente al momento della conferma ordine — senza passaggi manuali.`,
      },
      {
        id: 'ord-uso',
        title: 'Come usare il registro',
        content: `AGGIORNARE LO STATO: clicca il dropdown nella colonna Stato per cambiare direttamente dalla tabella.

ANNULLAMENTO ORDINE: selezionando "Annullato" dal dropdown si apre un mini-form inline che richiede il motivo dell'annullamento (obbligatorio). Solo dopo aver inserito il motivo il pulsante Conferma si sblocca. La nota viene salvata con prefisso [ANNULLATO]. Il totale appare barrato in rosso nella tabella.

AGGIUNGERE NOTE: clicca l\'icona matita nella colonna Note, scrivi e premi Invio o il pulsante Salva.

FILTRARE: usa i pill in alto per filtrare per stato, il dropdown per fornitore, la barra di ricerca per codice o costruttore.

TOTALE FILTRATO: viene mostrato in basso a destra il totale degli ordini confermati visibili con i filtri attivi.

ELIMINARE: ogni riga ha un pulsante cestino. Elimina solo dal registro locale — non ha effetti su iDempiere.

SVUOTARE IL REGISTRO: pulsante rosso in fondo alla filter bar. Richiede doppia conferma.`,
      },
    ],
  }
,
  {
    id: 'brand-config',
    icon: 'Tag',
    title: 'Brand Configuration',
    isNew: true,
    subsections: [
      {
        id: 'bc-cosa',
        title: 'Perché configurare i brand',
        content: `Il documento di specifica originale identifica due problemi non risolti dall\'app base:

1. Per ogni tipologia di articolo bisogna definire un brand di riferimento da usare come primo filtro nella ricerca QRicambi
2. I brand concorrenza non sono catalogati — rende difficile determinare se un articolo è Economico, Primo Equipaggiamento o Originale

La schermata Brand Configuration (menu → Brand Config) risolve entrambi.`,
      },
      {
        id: 'bc-riferimento',
        title: 'Brand di riferimento per gruppo',
        isNew: true,
        content: `La tabella Brand di Riferimento associa ogni gruppo merceologico al suo brand principale.

COME VIENE USATO:
— Il mock QRicambi usa il brand di riferimento come primo costruttore nei risultati
— In produzione: il backend Puppeteer filtra i risultati QRicambi privilegiando questo brand
— Il Modulo 7 (alert descrizione anomala) usa il brand di riferimento per validare i risultati

ESEMPI PRECONFIGURATI:
— Freni → Brembo
— Filtrazione → Mann
— Sospensioni → Monroe
— Distribuzione → Continental
— Frizioni → Valeo
— Elettrico → Bosch

COME MODIFICARE: clicca l\'icona matita sulla riga, modifica i campi, clicca Salva.`,
      },
      {
        id: 'bc-concorrenza',
        title: 'Brand concorrenza — classificazione',
        isNew: true,
        content: `La tabella Brand Concorrenza cataloga ogni brand con la sua linea qualitativa.

COME VIENE USATO:
— Il Modulo 9 (prezzo vendita) cerca il costruttore dell\'offerta in questa tabella
— Se trovato: applica i margini specifici per quella linea qualitativa
— Se non trovato: applica i margini default (Primo Equipaggiamento)

LINEE DISPONIBILI:
— Originale: margine 20-35% — brand OEM (Brembo, Bosch, Continental, Valeo...)
— Primo Equipaggiamento: margine 35-55% — aftermarket qualità (Monroe, Textar, Gates...)
— Economico: margine 50-80% — aftermarket budget (Japanparts, Ridex, Kamoka...)

PRECARICATI: 26 brand principali già classificati.

ESPORTA CSV: pulsante in alto a destra per backup o condivisione con altri operatori.

AGGIUNGERE BRAND: clicca il pulsante + Aggiungi, compila brand e linea, salva.`,
      },
    ],
  }

]

// ─── Quick Start ──────────────────────────────────────────────────────────────
export const quickStart = {
  title: 'Quick Start — Operativo in 5 minuti',
  steps: [
    {
      n: 1,
      icon: 'FolderOpen',
      title: 'Carica il file Excel',
      action: 'Vai su Report → trascina il file Avviso Sottoscorta.xlsx',
      result: 'Vedi 689 righe caricate, barra nera in cima con il nome file',
      time: '10 secondi',
    },
    {
      n: 2,
      icon: 'Zap',
      title: 'Apri la Workstation',
      action: 'Clicca il pulsante arancio "Workstation" in navbar',
      result: 'Vedi la coda urgenze a sinistra, già ordinata per priorità',
      time: '5 secondi',
    },
    {
      n: 3,
      icon: 'Sparkles',
      title: 'Attiva la modalità AI',
      action: 'Toggle in alto a destra: clicca "✦ AI"',
      result: 'I 12 moduli AI si attivano — il sistema inizia ad analizzare le offerte automaticamente',
      time: '2 secondi',
    },
    {
      n: 4,
      icon: 'Search',
      title: 'Elabora il primo articolo',
      action: 'Clicca il primo articolo in coda — la ricerca parte automaticamente',
      result: 'In 1-2 secondi vedi le offerte rankate, quella migliore già pre-selezionata',
      time: '2 secondi',
    },
    {
      n: 5,
      icon: 'ShoppingCart',
      title: 'Conferma o vai sul portale',
      action: 'Clicca CONFERMA ORDINE per registrare, oppure APRI PORTALE per simulare il login',
      result: 'L\'articolo passa a "Fatto", il sistema passa automaticamente al prossimo',
      time: '3 secondi',
    },
  ],
  tips: [
    { icon: 'Lightbulb', text: 'Prima sessione? Vai in Impostazioni → Fornitori e configura le credenziali dei tuoi portali' },
    { icon: 'Settings', text: 'Configura le Istruzioni Generali AI (pannello AI → tab Istruzioni) per far conoscere le regole di Brera al sistema' },
    { icon: 'Brain', text: 'Più usi la Workstation, più l\'AI impara le tue preferenze. Già dalla seconda sessione vedrai i suggerimenti migliorare' },
    { icon: 'Radar', text: 'Vuoi rivedere come funziona l\'app? Clicca "Rivedi il tour guidato" qui sopra o il pulsante "Tour guidato" in fondo alla sidebar.' },
    { icon: 'Key', text: 'Senza API key Anthropic i moduli AI usano le euristiche locali — funziona tutto lo stesso, solo senza la chat "Sul pezzo"' },
  ],
}

// ─── Cosa puoi fare con l\'AI ─────────────────────────────────────────────────
export const aiCapabilities = {
  title: 'Tutto quello che puoi fare con l\'AI',
  subtitle: 'Brera Replenishment integra 12 moduli AI + una chat contestuale. Ecco una mappa completa di tutto ciò che l\'AI può fare per te.',
  categories: [
    {
      id: 'analisi',
      icon: 'FlaskConical',
      title: 'Analisi automatica',
      color: '#F97316',
      items: [
        { title: 'Classificazione linea qualitativa', desc: 'L\'AI classifica automaticamente ogni costruttore sconosciuto in Originale / Primo Equipaggiamento / Economico', trigger: 'Automatico in modalità ✦ AI durante lo scouting', modulo: 1 },
        { title: 'Rilevamento complementari', desc: 'Esclude automaticamente mollette, clip, kit accessori dai risultati QRicambi', trigger: 'Automatico su ogni ricerca', modulo: 2 },
        { title: 'Alert descrizione anomala', desc: 'Avvisa se una descrizione non corrisponde al gruppo merceologico cercato — evita ordini sbagliati', trigger: 'Automatico in modalità ✦ AI', modulo: 7 },
        { title: 'Anomalie prezzo', desc: 'Confronta il prezzo corrente con lo storico e segnala promo o aumenti anomali', trigger: 'Automatico dopo 2+ acquisti per lo stesso codice', modulo: 4 },
      ],
    },
    {
      id: 'suggerimenti',
      icon: 'Lightbulb',
      title: 'Suggerimenti decisionali',
      color: '#0F0F0F',
      items: [
        { title: 'Fornitore preferito da Claudio', desc: 'Suggerisce il fornitore che Claudio sceglierebbe basandosi sullo storico scelte per quella categoria', trigger: 'Automatico dopo 2+ scelte per categoria', modulo: 3 },
        { title: 'Quantità ottimale d\'acquisto', desc: 'Propone una quantità diversa dall\'ERP quando c\'è una promo, lead time lungo o alta rotazione', trigger: 'Automatico in modalità ✦ AI', modulo: 5 },
        { title: 'Codice figlio da memoria', desc: 'Quando il codice è generico, suggerisce codici simili già confermati in sessioni precedenti', trigger: 'Automatico quando confidence < 40%', modulo: 6 },
        { title: 'Prezzo di vendita suggerito', desc: 'Calcola il range di prezzo vendita consigliato con margine per linea qualitativa', trigger: 'Automatico quando è selezionata un\'offerta (modalità ✦ AI)', modulo: 9 },
        { title: 'Raggruppamento ordini', desc: 'Segnala quando conviene raggruppare più articoli dello stesso fornitore per risparmiare sul trasporto', trigger: 'Alert automatico al 3° articolo dello stesso fornitore', modulo: 10 },
        { title: 'Articoli sostitutivi', desc: 'Se nessuna offerta trovata, cerca in memoria un equivalente già utilizzato', trigger: 'Automatico quando la ricerca non produce risultati', modulo: 11 },
      ],
    },
    {
      id: 'anticipazione',
      icon: 'Radar',
      title: 'Anticipazione e previsione',
      color: '#F97316',
      items: [
        { title: 'Previsione fabbisogno 7 giorni', desc: 'Identifica gli articoli con giacenza attuale ma copertura < 7 giorni — permette di anticipare le urgenze prima che arrivino', trigger: 'Visibile in Overview quando carichi il file Excel', modulo: 8 },
        { title: 'Storico preferenze Claudio', desc: 'Accumula nel tempo le scelte operative di Claudio costruendo un modello decisionale che migliora ad ogni sessione', trigger: 'Sempre attivo — si arricchisce con ogni conferma ordine', modulo: 3 },
      ],
    },
    {
      id: 'chat',
      icon: '💬',
      title: 'Chat contestuale — Sul pezzo',
      color: '#0F0F0F',
      items: [
        { title: 'Analisi offerta specifica', desc: '"Quale offerta sceglieresti e perché?" — Claude risponde con il contesto completo dell\'articolo già caricato', trigger: 'Pulsante "Chiedi AI" → tab "Sul pezzo"', requires: 'API key Anthropic' },
        { title: 'Valutazione rischi nascosti', desc: '"Ci sono rischi in queste offerte che non vedo?" — identifica anomalie non evidenti', trigger: 'Chat libera con contesto articolo', requires: 'API key Anthropic' },
        { title: 'Verifica congruenza prezzo', desc: '"Il prezzo è in linea con il mercato?" — confronto contestuale', trigger: 'Chat libera', requires: 'API key Anthropic' },
        { title: 'Calcolo convenienza scorta', desc: '"Conviene fare scorta o ordinare il minimo?" — analisi make-or-buy con dati reali', trigger: 'Chat libera', requires: 'API key Anthropic' },
        { title: 'Valutazione costruttore', desc: '"Quale costruttore è più affidabile per questo tipo di articolo?" — expertise di settore', trigger: 'Chat libera', requires: 'API key Anthropic' },
        { title: 'Compatibilità urgenza-logistica', desc: '"Il lead time di questo fornitore è accettabile con questa urgenza?" — valutazione operativa', trigger: 'Chat libera', requires: 'API key Anthropic' },
        { title: 'Domanda libera', desc: 'Qualsiasi domanda operativa sull\'articolo — Claude vede già codice, offerte, prezzi, urgenza, giacenza', trigger: 'Campo libero nella chat', requires: 'API key Anthropic' },
      ],
    },
    {
      id: 'regole',
      icon: 'ClipboardList',
      title: 'Regole operative personalizzate',
      color: '#0F0F0F',
      items: [
        { title: 'Istruzioni generali per l\'AI', desc: 'Scrivi una volta le regole di Brera (brand preferiti, soglie prezzo, criteri logistica) — vengono iniettate in ogni analisi come contesto prioritario', trigger: 'Pannello AI → tab "Istruzioni generali" → Salva', requires: 'API key Anthropic' },
        { title: 'Apprendimento automatico delle regole', desc: 'Ogni scelta confermata da Claudio diventa una regola implicita che l\'AI usa nei suggerimenti futuri — senza bisogno di scriverla', trigger: 'Automatico ad ogni conferma ordine', modulo: 3 },
      ],
    },
    {
      id: 'reportistica',
      icon: '📊',
      title: 'Reportistica intelligente',
      color: '#F97316',
      items: [
        { title: 'Sintesi EOD per il management', desc: 'Genera automaticamente un testo in italiano professionale con ordini del giorno, saving, anomalie e prossimi passi — pronto per email', trigger: 'Report EOD → tab "Testo"', modulo: 12 },
        { title: 'Dashboard performance AI', desc: 'Mostra % articoli risolti automaticamente, media tentativi ricerca, task creati, saving stimato', trigger: 'Report EOD → tab "Dashboard"', modulo: 12 },
      ],
    },
    {
      id: 'memoria',
      icon: 'Brain',
      title: 'Memoria e apprendimento',
      color: '#0F0F0F',
      items: [
        { title: 'Normalizzazione codici da memoria', desc: 'I codici già corretti vengono riconosciuti automaticamente nelle sessioni successive — confidence 98%', trigger: 'Automatico quando il codice è in memoria', modulo: null },
        { title: 'Brand appresi automaticamente', desc: 'Ogni prefisso brand confermato (JPP→Japan Parts) viene memorizzato e applicato a tutti i codici futuri con lo stesso prefisso', trigger: 'Automatico alla conferma in Normalizzazione', modulo: null },
        { title: 'Famiglie ERP/TecDoc corrette', desc: 'Le correzioni di famiglia merceologica vengono ricordate e pre-applicate nei file futuri', trigger: 'Automatico alla conferma in Normalizzazione', modulo: null },
        { title: 'Storico prezzi per anomalie', desc: 'Ogni prezzo visto viene registrato — alimenta il Modulo 4 per il rilevamento anomalie', trigger: 'Automatico durante lo scouting', modulo: 4 },
      ],
    },
  ],
}
