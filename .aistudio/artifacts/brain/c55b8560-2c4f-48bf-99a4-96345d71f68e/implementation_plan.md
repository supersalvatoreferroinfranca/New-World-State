# Gestione Articoli in Evidenza e Anteprime Social Multilingue Immediate

Consente di mettere in evidenza o rimuovere dall'evidenza qualsiasi articolo approvato in qualunque momento tramite una comoda icona a stella nelle schede e nella vista di dettaglio, e ripristina la generazione istantanea e affidabile delle anteprime social (OpenGraph, Twitter Cards, immagine 1200x630 e titolo tradotto nella lingua corretta) per qualsiasi URL condiviso su social network e app di messaggistica.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisioni confermate dall'utente nella fase di chiarimento:
> - **Pulsante rapido con stella**: Collocato direttamente in evidenza sulle schede notizia (`NewsPortal`, `HomepageNewsSection`) e nella barra delle azioni della vista di dettaglio (`ArticleDetailModal`), accessibile per impostare o togliere lo stato "In Evidenza" in qualsiasi momento per tutti gli articoli approvati.
> - **Anteprime social localizzate**: Quando un URL viene condiviso in una lingua specifica (es. `?lang=en`, `?lang=es`, o slug localizzato), i crawler social (Facebook, WhatsApp, Twitter/X, Telegram, LinkedIn) ricevono immediatamente il titolo tradotto, il sommario estratto e l'immagine principale ad alta risoluzione 1200x630.
> - **Sincronizzazione Cloud e Edge Cache**: L'aggiornamento dello stato (in evidenza) e delle traduzioni/metadati viene memorizzato istantaneamente nel database Cloud (`nws_news_articles`) e nei proxy SSR/Edge Worker, garantendo la disponibilità immediata ai crawler senza ritardi o cache stale.

---

## 1. Overview & Core Concept

- **Cosa fa**:
  1. **Controllo Evidenza Immediato**: Aggiunge un'interazione a stella (toggle a 1 clic con animazione e feedback visivo) sia sulle singole schede articolo sia nell'intestazione della vista di dettaglio, permettendo a curatori/amministratori e custodi di mettere o togliere in evidenza qualunque articolo già approvato, riordinando dinamicamente il carosello delle notizie in prima pagina e le sezioni in evidenza.
  2. **Risoluzione e Generazione Anteprime Social Multilingue**: Risolve il problema delle anteprime con titolo errato o mancata immagine quando si condivide un link:
     - Normalizza e valida gli URL delle immagini dell'articolo (risolvendo path relativi, formati non standard, e convertendoli in URL assoluti sicuri con dimensioni 1200x630).
     - Riconosce il parametro linguistico (`?lang=`, `?hl=`) e la lingua richiesta dai crawler: se le traduzioni per quella lingua non sono ancora memorizzate, attiva una traduzione on-demand istantanea persistita su database Neon/PostgreSQL `nws_news_articles`.
     - Inietta nei tag OpenGraph (`og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height`, `og:image:secure_url`) e Twitter Card (`twitter:title`, `twitter:description`, `twitter:image`) i metadati corretti e leggibili da WhatsApp, Facebook, Telegram, Discord e Twitter/X.
- **Destinatari**: Giornalisti, redattori, custodi digitali e lettori del portale che condividono notizie sui canali social o gestiscono la priorità editoriale.
- **Valore Chiave**: Massima visibilità e autorevolezza delle notizie condivise all'esterno con anteprime ricche e coerenti in tutte le 11 lingue ufficiali, oltre a una flessibilità editoriale totale per gli articoli in evidenza.

---

## 2. User Experience & Visual Design

### Flussi Utente Principali

1. **Mettere / Togliere in Evidenza dalla Scheda Notizia**:
   - Nella vista griglia di `NewsPortal` e nella `HomepageNewsSection`, ogni articolo approvato mostra sul banner media in alto a destra un'icona a stella:
     - Stella dorata piena (`text-amber-400 fill-amber-400`) con badge "In Evidenza" se l'articolo è attualmente in primo piano.
     - Stella sagomata (`text-white/80 hover:text-amber-300`) con sfondo semitrasparente se l'articolo è normale.
   - Cliccando sulla stella, lo stato cambia istantaneamente con micro-animazione, aggiorna l'ordine delle notizie e salva le modifiche in locale e sul server Cloud.
2. **Mettere / Togliere in Evidenza dal Dettaglio Articolo**:
   - Nella barra superiore di `ArticleDetailModal`, accanto al pulsante di condivisione e modifica, compare il pulsante rapido stella con etichetta contestuale ("In Evidenza" / "Metti in Evidenza").
3. **Condivisione Social e Generazione Anteprima**:
   - L'utente seleziona una delle 11 lingue nel dettaglio o clicca su "Condividi Notizia" con la lingua attiva.
   - Il link generato (es. `https://newworldstate.cloud/notizie/slug-notizia?lang=fr`) quando incollato su WhatsApp, Facebook, LinkedIn o Twitter mostra:
     - Titolo nella lingua selezionata (es. francese).
     - Sommario/estratto conciso nella lingua selezionata.
     - Immagine di copertina reale dell'articolo, nitida e centrata.
     - Nome del sito ufficiale: *New World State News Authority*.

### Tema Visivo & Token Tailwind

- **Accenti Dorati Istituzionali**: `text-amber-400`, `fill-amber-400`, `border-[#c5a880]`, `bg-[#0a1c3e]`.
- **Badge di Stato & Anteprima**: Micro-badge con backdrop blur (`bg-black/50 backdrop-blur-md`) per garantire massima leggibilità della stella su qualsiasi immagine di copertina.
- **Tipografia**: Titoli in serif istituzionale per la preview editoriale e font-mono/tech per le indicazioni di data e stato.

---

## 3. Decisioni di Prodotto & Trade-Off

- **Decisione 1: Toggle Featured Diretto senza Ricaricamento Pagina**
  - *Scelta*: Permettere il toggle sia con chiamata ottimistica sul client (aggiornamento stato React immediato) sia con persistenza simultanea tramite `/api/news/moderate` (action: `toggle_featured`) e `/api/news/sync`.
  - *Perché*: L'utente non deve aprire form complessi o passare obbligatoriamente dal pannello di moderazione per una decisione di visualizzazione frequente.
  - *Alternative scartate*: Limitare la modifica al solo pannello moderatori o richiedere riapertura del form bozza (troppo macchinoso).

- **Decisione 2: Risoluzione Anteprime Social sia su Express (server.ts) sia su Cloudflare (worker.js)**
  - *Scelta*: Allineare rigorosamente la logica di estrazione dei metadati OpenGraph e immagini in entrambi i gateway server/edge, gestendo tutti i formati di URL (`/notizie/:slug`, `/news/:slug`, `/?tab=news&slug=...` e parametro `?lang=...`).
  - *Perché*: A seconda del deployment e del routing DNS, le richieste dei crawler possono passare dal Worker o dal server Node; entrambi devono restituire i tag OpenGraph perfetti senza discrepanze.
  - *Alternative scartate*: Affidarsi solo al client-side SPA (i crawler come Facebook, WhatsApp e LinkedIn non eseguono JavaScript ed estrarrebbero tag errati o generici).

- **Decisione 3: Traduzione Automatica On-Demand e Caching Istantaneo**
  - *Scelta*: Se un crawler o un utente condivide un link con lingua non ancora tradotta, il server esegue la traduzione automatica del titolo e del sommario per quella lingua e la salva immediatamente nel record JSONB su PostgreSQL.
  - *Perché*: Assicura che anche articoli pubblicati di recente abbiano anteprime perfette in tutte le 11 lingue al primo share.

---

## 4. Architettura Tecnica & Flusso Dati

```
┌────────────────────────────────────────────────────────────────────────┐
│                   INTERFACCIA UTENTE (REACT SPA)                       │
│                                                                        │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   News Cards (Grid)    │  │       ArticleDetailModal             │  │
│  │  [★ Stella Featured]   │  │   [★ In Evidenza] [Condividi (Lang)] │  │
│  └───────────┬────────────┘  └──────────────────┬───────────────────┘  │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │                                  │
               ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   NEWS SERVICE & API CLIENT                            │
│  - moderateArticle(id, 'toggle_featured')                              │
│  - Local Storage cache update (optimistic UI)                          │
│  - POST /api/news/moderate & POST /api/news/sync                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               GATEWAY SSR & SOCIAL CRAWLER HANDLERS                    │
│                                                                        │
│  ┌───────────────────────────────────┐  ┌───────────────────────────┐  │
│  │     server.ts (Node/Express)      │  │     worker.js (Cloudflare)│  │
│  │ - handleHtmlRequest               │  │ - Dynamic News SSR Router │  │
│  │ - injectArticleMetaTags           │  │ - Meta tag generator      │  │
│  │ - Multilingual fallback & lookup  │  │ - Multilingual fallback   │  │
│  └─────────────────┬─────────────────┘  └─────────────┬─────────────┘  │
└────────────────────┼──────────────────────────────────┼────────────────┘
                     │                                  │
                     ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│               DATABASE CLOUD & PERSISTENZA GLOBALE                     │
│  - PostgreSQL / Neon: tabella nws_news_articles (id, slug, data)       │
│  - Persistenza immediata di isFeatured = true/false                    │
│  - Persistenza traduzioni (translations[lang].title, intro, content)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Componenti e Mappatura Modifiche

1. **`src/components/news/NewsPortal.tsx` & `HomepageNewsSection.tsx`**:
   - Aggiunta del pulsante stella interattivo sulle schede articolo con gestione click `stopPropagation()`, stato locale e sincronizzazione tramite `moderateArticle`.
2. **`src/components/news/ArticleDetailModal.tsx`**:
   - Aggiunta del pulsante rapido stella nella barra superiore per commutare lo stato in evidenza dell'articolo visualizzato.
   - Generazione del link di condivisione con parametro di lingua esplicito e testata di condivisione arricchita.
3. **`server.ts`**:
   - Perfezionamento di `injectArticleMetaTags` per:
     - Estrarre la copertina corretta (`article.images[0].url`, `article.image`, o immagine tematica con priorità all'immagine reale) garantendo URL assoluto con `https://newworldstate.cloud`.
     - Risolvere la lingua richiesta dal query param `?lang=` o `?hl=` con traduzione fallback se mancante.
     - Fornire tutti i tag specifici per WhatsApp, Facebook, Twitter, Telegram, LinkedIn.
     - Gestire anche percorsi alternativi come `/?tab=news&slug=...` e `/news?slug=...`.
4. **`worker.js`**:
   - Sincronizzazione della medesima logica SSR nei percorsi del Worker di Cloudflare, garantendo uniformità su qualsiasi dominio di instradamento e crawler edge.

---
