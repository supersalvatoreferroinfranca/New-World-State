# Guida alla Distribuzione su Cloudflare Pages

Questa applicazione è configurata per funzionare sia su un server Express tradizionale che su **Cloudflare Pages** tramite le **Pages Functions**.

## Come funziona
Le API sono state duplicate nella cartella `functions/api/`. Quando carichi il codice su Cloudflare Pages, queste verranno automaticamente distribuite come Workers "edge".

## Passaggi per la Configurazione su Cloudflare

### 0. Configurazione Wrangler (Novità)
Abbiamo aggiunto un file `wrangler.jsonc`. Questo file dice a Cloudflare che:
- La cartella dei file statici è `dist`.
- Deve usare la compatibilità `nodejs_compat` (necessaria per il driver di Neon).

Se ricevi un errore di **conflitto git** su `wrangler.jsonc` su GitHub:
1. Accetta la versione del repository (quella creata dall'AI).
2. Assicurati che il file contenga `"pages_build_output_dir": "dist"`.

### 1. Variabili d'Ambiente (Secrets)
Cloudflare Pages richiede che le variabili siano configurate nella sua dashboard.
1. Apri la dashboard di Cloudflare.
2. Vai su **Workers & Pages** -> seleziona il tuo progetto.
3. Clicca su **Settings** -> **Functions** (o **Environment Variables** se è un progetto statico appena convertito).
4. Sotto **Environment variables**, clicca su **Add variable**.
5. Aggiungi `DATABASE_URL` con la tua stringa di Neon.
6. Clicca su **Save** e **rifai il deploy**.

### 2. Driver Database
Abbiamo installato `@neondatabase/serverless` che è necessario per connettere Neon dall'ambiente "Edge" di Cloudflare. Le funzioni nella cartella `functions/` usano già questo driver.

### 3. Build Command
Il comando di build su Cloudflare Pages deve rimanere:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

## Problemi Comuni
### Errore: "Variables cannot be added to a Worker that only has static assets"
Se vedi questo errore nella dashboard di Cloudflare, significa che Cloudflare non ha ancora rilevato la cartella `functions` nel tuo ultimo deploy.
1. Carica (Push) il codice su GitHub assicurandoti che la cartella `functions` sia presente.
2. Attendi il completamento della build.
3. Una volta completata, Cloudflare "sbloccherà" la sezione Variables sotto **Settings > Functions**.
4. Inserisci i tuoi segreti e **avvia un nuovo deploy** (le variabili vengono iniettate solo durante la fase di build).

### Errore: "The name 'ASSETS' is reserved"
Questo errore accade quando si prova a configurare manualmente il binding degli asset in un progetto che Cloudflare riconosce già come Pages.
- Abbiamo risolto semplificando `wrangler.jsonc` e usando un file `_redirects` nella cartella `public/` per gestire il routing SPA.

### Errore: "Unsupported platform for tapable (win32)"
Se vedi questo errore durante la build:
1. Ho eliminato il file `package-lock.json`. 
2. Al prossimo commit su GitHub, Cloudflare genererà un nuovo lock file compatibile con l'ambiente Linux del server di build.
