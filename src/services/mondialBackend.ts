import crypto from 'crypto';

export type BarterCategory = 
  | 'Cibo & Agricoltura'
  | 'Servizi & Consulenze'
  | 'Beni & Artigianato'
  | 'Cultura & Formazione'
  | 'Aiuto Reciproco'
  | 'Altro Baratto Solidale';

export const BARTER_CATEGORIES: BarterCategory[] = [
  'Cibo & Agricoltura',
  'Servizi & Consulenze',
  'Beni & Artigianato',
  'Cultura & Formazione',
  'Aiuto Reciproco',
  'Altro Baratto Solidale'
];

export interface MondialWallet {
  id?: number;
  citizen_id: number;
  citizen_code: string;
  citizen_name?: string;
  balance: number;
  has_pin: boolean;
  referral_count: number;
  referral_bonus_awarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface MondialTransaction {
  id?: number;
  tx_hash: string;
  sender_citizen_id: number | null;
  sender_code: string;
  sender_name: string;
  receiver_citizen_id: number;
  receiver_code: string;
  receiver_name: string;
  amount: number;
  category: BarterCategory;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface PublicLedgerEntry {
  tx_hash: string;
  masked_sender: string;
  masked_receiver: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

// In-memory fallbacks per garantire disponibilità immediata e resilienza
const memoryWallets: Map<string, {
  citizen_id: number;
  citizen_code: string;
  citizen_name: string;
  balance: number;
  pin_hash: string | null;
  referral_count: number;
  referral_bonus_awarded: boolean;
  created_at: string;
  updated_at: string;
}> = new Map();

const memoryTransactions: MondialTransaction[] = [];
const memoryReferrals: Array<{ referrer_id: number; referred_id: number; created_at: string }> = [];

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin + '_nws_mondial_salt_2026').digest('hex');
}

export function maskCitizenCode(code: string): string {
  if (!code) return 'NWS-***';
  const clean = code.trim();
  if (clean.toUpperCase().includes('SYSTEM') || clean.toUpperCase().includes('SISTEMA')) {
    return 'FONDO SOLIDALE NWS';
  }
  if (clean.length <= 6) {
    return clean.slice(0, 2) + '***' + clean.slice(-1);
  }
  return clean.slice(0, 4) + '***' + clean.slice(-4);
}

/**
 * Inizializza le tabelle del circuito Mondial (Ɱ)
 */
export async function ensureMondialTables(dbPool: any): Promise<void> {
  if (!dbPool) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS nws_mondial_wallets (
        id SERIAL PRIMARY KEY,
        citizen_id INT UNIQUE,
        citizen_code TEXT NOT NULL UNIQUE,
        balance NUMERIC(14,2) DEFAULT 5000.00,
        pin_hash TEXT,
        referral_count INT DEFAULT 0,
        referral_bonus_awarded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mondial_wallets_code ON nws_mondial_wallets(LOWER(citizen_code));

      CREATE TABLE IF NOT EXISTS nws_mondial_transactions (
        id SERIAL PRIMARY KEY,
        tx_hash VARCHAR(64) UNIQUE NOT NULL,
        sender_citizen_id INT,
        sender_code TEXT NOT NULL,
        sender_name TEXT,
        receiver_citizen_id INT,
        receiver_code TEXT NOT NULL,
        receiver_name TEXT,
        amount NUMERIC(14,2) NOT NULL,
        category VARCHAR(60) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mondial_tx_sender ON nws_mondial_transactions(sender_code);
      CREATE INDEX IF NOT EXISTS idx_mondial_tx_receiver ON nws_mondial_transactions(receiver_code);
      CREATE INDEX IF NOT EXISTS idx_mondial_tx_created ON nws_mondial_transactions(created_at DESC);

      CREATE TABLE IF NOT EXISTS nws_citizen_referrals (
        id SERIAL PRIMARY KEY,
        referrer_citizen_id INT NOT NULL,
        referred_citizen_id INT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cit_referrals_referrer ON nws_citizen_referrals(referrer_citizen_id);
    `);
    console.log('[MONDIAL] Circuit tables verified and initialized.');
  } catch (err: any) {
    console.warn('[MONDIAL] ensureMondialTables warning:', err.message);
  }
}

/**
 * Ottiene o crea il portafoglio Mondial per il cittadino con credito iniziale di 5.000 Ɱ
 */
export async function getOrCreateWallet(
  dbPool: any,
  citizenId: number,
  citizenCode: string,
  citizenName: string
): Promise<{ wallet: MondialWallet; transactions: MondialTransaction[] }> {
  const normCode = (citizenCode || `NWS-CIT-${citizenId}`).trim().toUpperCase();

  let walletData: any = null;
  let txList: MondialTransaction[] = [];

  if (dbPool) {
    try {
      // Cerca portafoglio esistente
      const res = await dbPool.query(
        `SELECT id, citizen_id, citizen_code, balance, pin_hash, referral_count, referral_bonus_awarded, created_at, updated_at
         FROM nws_mondial_wallets
         WHERE citizen_id = $1 OR citizen_code = $2`,
        [citizenId, normCode]
      );

      if (res.rows.length > 0) {
        walletData = res.rows[0];
      } else {
        // Creazione nuovo wallet con credito iniziale di 5000.00 Mondial
        const ins = await dbPool.query(
          `INSERT INTO nws_mondial_wallets (citizen_id, citizen_code, balance, referral_count, referral_bonus_awarded)
           VALUES ($1, $2, 5000.00, 0, FALSE)
           RETURNING *`,
          [citizenId, normCode]
        );
        walletData = ins.rows[0];

        // Registra accredito iniziale nei record
        const initialTxHash = `TX-Ɱ-INIT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        await dbPool.query(
          `INSERT INTO nws_mondial_transactions 
           (tx_hash, sender_citizen_id, sender_code, sender_name, receiver_citizen_id, receiver_code, receiver_name, amount, category, description, status)
           VALUES ($1, NULL, 'NWS-SISTEMA', 'Anagrafe Centrale NWS', $2, $3, $4, 5000.00, 'Aiuto Reciproco', 'Accredito di benvenuto istituzionale per la partecipazione al baratto solidale', 'completed')`,
          [initialTxHash, citizenId, normCode, citizenName || 'Cittadino Sovrano']
        );
      }

      // Verifica referrals per il bonus dei 50 iscritti
      const refCountRes = await dbPool.query(
        `SELECT COUNT(*) as count FROM nws_citizen_referrals WHERE referrer_citizen_id = $1`,
        [citizenId]
      );
      const actualRefCount = parseInt(refCountRes.rows[0]?.count || '0', 10);

      // Se ha raggiunto 50 iscrizioni e non ha ancora avuto il bonus di 5000 Ɱ
      if (actualRefCount >= 50 && !walletData.referral_bonus_awarded) {
        const bonusTxHash = `TX-Ɱ-BONUS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        const updated = await dbPool.query(
          `UPDATE nws_mondial_wallets
           SET balance = balance + 5000.00, referral_count = $1, referral_bonus_awarded = TRUE, updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [actualRefCount, walletData.id]
        );
        walletData = updated.rows[0];

        await dbPool.query(
          `INSERT INTO nws_mondial_transactions 
           (tx_hash, sender_citizen_id, sender_code, sender_name, receiver_citizen_id, receiver_code, receiver_name, amount, category, description, status)
           VALUES ($1, NULL, 'NWS-SISTEMA', 'Comunità Solidale NWS', $2, $3, $4, 5000.00, 'Aiuto Reciproco', 'Premio Solidale per aver favorito l''adesione di oltre 50 cittadini sovrani', 'completed')`,
          [bonusTxHash, citizenId, normCode, citizenName || 'Cittadino Sovrano']
        );
      } else if (actualRefCount !== walletData.referral_count) {
        // Aggiorna solo il contatore referrals
        await dbPool.query(
          `UPDATE nws_mondial_wallets SET referral_count = $1, updated_at = NOW() WHERE id = $2`,
          [actualRefCount, walletData.id]
        );
        walletData.referral_count = actualRefCount;
      }

      // Recupera le ultime transazioni personali
      const txRes = await dbPool.query(
        `SELECT * FROM nws_mondial_transactions
         WHERE sender_code = $1 OR receiver_code = $1
         ORDER BY created_at DESC
         LIMIT 60`,
        [normCode]
      );
      txList = txRes.rows.map((r: any) => ({
        id: r.id,
        tx_hash: r.tx_hash,
        sender_citizen_id: r.sender_citizen_id,
        sender_code: r.sender_code,
        sender_name: r.sender_name || 'Cittadino NWS',
        receiver_citizen_id: r.receiver_citizen_id,
        receiver_code: r.receiver_code,
        receiver_name: r.receiver_name || 'Cittadino NWS',
        amount: parseFloat(r.amount),
        category: r.category as BarterCategory,
        description: r.description,
        status: r.status,
        created_at: r.created_at
      }));
    } catch (err: any) {
      console.warn('[MONDIAL] DB lookup error, falling back to memory store:', err.message);
    }
  }

  // Fallback in memoria
  if (!walletData) {
    if (!memoryWallets.has(normCode)) {
      const now = new Date().toISOString();
      memoryWallets.set(normCode, {
        citizen_id: citizenId,
        citizen_code: normCode,
        citizen_name: citizenName || 'Cittadino Sovrano',
        balance: 5000.00,
        pin_hash: null,
        referral_count: 0,
        referral_bonus_awarded: false,
        created_at: now,
        updated_at: now
      });

      // Transazione iniziale in memoria
      memoryTransactions.push({
        tx_hash: `TX-Ɱ-INIT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        sender_citizen_id: null,
        sender_code: 'NWS-SISTEMA',
        sender_name: 'Anagrafe Centrale NWS',
        receiver_citizen_id: citizenId,
        receiver_code: normCode,
        receiver_name: citizenName || 'Cittadino Sovrano',
        amount: 5000.00,
        category: 'Aiuto Reciproco',
        description: 'Accredito di benvenuto istituzionale per la partecipazione al baratto solidale',
        status: 'completed',
        created_at: now
      });
    }

    const mem = memoryWallets.get(normCode)!;
    walletData = {
      id: 1,
      citizen_id: mem.citizen_id,
      citizen_code: mem.citizen_code,
      balance: mem.balance,
      pin_hash: mem.pin_hash,
      referral_count: mem.referral_count,
      referral_bonus_awarded: mem.referral_bonus_awarded,
      created_at: mem.created_at,
      updated_at: mem.updated_at
    };

    txList = memoryTransactions.filter(
      t => t.sender_code === normCode || t.receiver_code === normCode
    ).slice(-60).reverse();
  }

  const resultWallet: MondialWallet = {
    id: walletData.id,
    citizen_id: walletData.citizen_id,
    citizen_code: walletData.citizen_code,
    citizen_name: citizenName || 'Cittadino Sovrano',
    balance: parseFloat(walletData.balance),
    has_pin: !!walletData.pin_hash,
    referral_count: walletData.referral_count || 0,
    referral_bonus_awarded: !!walletData.referral_bonus_awarded,
    created_at: walletData.created_at,
    updated_at: walletData.updated_at
  };

  return { wallet: resultWallet, transactions: txList };
}

/**
 * Imposta o modifica il PIN di sicurezza di 4 o 6 cifre per autorizzare i trasferimenti
 */
export async function setWalletPin(
  dbPool: any,
  citizenId: number,
  pin: string
): Promise<{ success: boolean; message: string }> {
  if (!pin || pin.trim().length < 4 || !/^\d+$/.test(pin.trim())) {
    throw new Error('Il PIN deve contenere almeno 4 cifre numeriche.');
  }

  const pHash = hashPin(pin.trim());

  if (dbPool) {
    try {
      await dbPool.query(
        `UPDATE nws_mondial_wallets SET pin_hash = $1, updated_at = NOW() WHERE citizen_id = $2`,
        [pHash, citizenId]
      );
      return { success: true, message: 'PIN di sicurezza salvato con successo.' };
    } catch (err: any) {
      console.warn('[MONDIAL] setWalletPin DB error:', err.message);
    }
  }

  for (const [, val] of memoryWallets.entries()) {
    if (val.citizen_id === citizenId) {
      val.pin_hash = pHash;
      val.updated_at = new Date().toISOString();
      break;
    }
  }

  return { success: true, message: 'PIN di sicurezza salvato con successo.' };
}

/**
 * Esegue un trasferimento di valore solidale in Mondial con verifica atomica, PIN e causale obbligatoria
 */
export async function executeMondialTransfer(
  dbPool: any,
  params: {
    senderCitizenId: number;
    senderCode: string;
    senderName: string;
    receiverCode: string;
    amount: number;
    category: BarterCategory;
    description: string;
    pin?: string;
  }
): Promise<{ success: boolean; transaction: MondialTransaction; newBalance: number }> {
  const { senderCitizenId, senderCode, senderName, receiverCode, amount, category, description, pin } = params;

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Importo di baratto non valido: deve essere maggiore di 0 Ɱ.');
  }
  if (!description || description.trim().length < 3) {
    throw new Error('La causale del baratto (descrizione del bene o servizio) è obbligatoria.');
  }
  if (!category || !BARTER_CATEGORIES.includes(category)) {
    throw new Error('Seleziona una categoria di baratto valida.');
  }

  const normSenderCode = senderCode.trim().toUpperCase();
  const normReceiverCode = receiverCode.trim().toUpperCase();

  if (normSenderCode === normReceiverCode) {
    throw new Error('Non è possibile trasferire Mondial a se stessi.');
  }

  const txHash = `TX-Ɱ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  if (dbPool) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Verifica mittente
      const sRes = await client.query(
        `SELECT id, balance, pin_hash FROM nws_mondial_wallets WHERE citizen_id = $1 OR citizen_code = $2 FOR UPDATE`,
        [senderCitizenId, normSenderCode]
      );

      if (sRes.rows.length === 0) {
        throw new Error('Portafoglio del mittente non trovato.');
      }

      const senderRow = sRes.rows[0];
      const currentSenderBal = parseFloat(senderRow.balance);

      if (currentSenderBal < amount) {
        throw new Error(`Saldo insufficiente: disponi di ${currentSenderBal.toFixed(2)} Ɱ ma l'importo richiesto è ${amount.toFixed(2)} Ɱ.`);
      }

      // Verifica PIN se impostato
      if (senderRow.pin_hash) {
        if (!pin) {
          throw new Error('PIN di sicurezza richiesto per autorizzare il trasferimento.');
        }
        if (hashPin(pin.trim()) !== senderRow.pin_hash) {
          throw new Error('PIN di sicurezza non corretto.');
        }
      }

      // 2. Verifica destinatario
      let receiverCitizenId = 0;
      let receiverName = 'Cittadino NWS';

      // Cerca nei cittadini
      const citRes = await client.query(
        `SELECT id, "citizenCode", "firstName", surname FROM citizens WHERE UPPER("citizenCode") = $1 OR UPPER(username) = $1 LIMIT 1`,
        [normReceiverCode]
      );

      if (citRes.rows.length > 0) {
        receiverCitizenId = citRes.rows[0].id;
        const fn = citRes.rows[0].firstName || '';
        const sn = citRes.rows[0].surname || '';
        receiverName = `${fn} ${sn}`.trim() || 'Cittadino Sovrano';
      }

      // Cerca o crea portafoglio destinatario
      const rRes = await client.query(
        `SELECT id, balance FROM nws_mondial_wallets WHERE citizen_code = $1 FOR UPDATE`,
        [normReceiverCode]
      );

      if (rRes.rows.length === 0) {
        // Crea nuovo wallet per destinatario con 5000 iniziale + accredito
        await client.query(
          `INSERT INTO nws_mondial_wallets (citizen_id, citizen_code, balance, referral_count)
           VALUES ($1, $2, $3, 0)`,
          [receiverCitizenId || null, normReceiverCode, 5000.00 + amount]
        );
      } else {
        await client.query(
          `UPDATE nws_mondial_wallets SET balance = balance + $1, updated_at = NOW() WHERE citizen_code = $2`,
          [amount, normReceiverCode]
        );
      }

      // 3. Scala saldo al mittente
      const updatedSenderRes = await client.query(
        `UPDATE nws_mondial_wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2 RETURNING balance`,
        [amount, senderRow.id]
      );
      const newSenderBalance = parseFloat(updatedSenderRes.rows[0].balance);

      // 4. Salva la transazione
      const cleanDesc = description.trim();
      const insTx = await client.query(
        `INSERT INTO nws_mondial_transactions 
         (tx_hash, sender_citizen_id, sender_code, sender_name, receiver_citizen_id, receiver_code, receiver_name, amount, category, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed')
         RETURNING *`,
        [txHash, senderCitizenId, normSenderCode, senderName || 'Cittadino Mittente', receiverCitizenId || null, normReceiverCode, receiverName, amount, category, cleanDesc]
      );

      await client.query('COMMIT');

      const txRow = insTx.rows[0];
      const completedTx: MondialTransaction = {
        id: txRow.id,
        tx_hash: txRow.tx_hash,
        sender_citizen_id: txRow.sender_citizen_id,
        sender_code: txRow.sender_code,
        sender_name: txRow.sender_name,
        receiver_citizen_id: txRow.receiver_citizen_id,
        receiver_code: txRow.receiver_code,
        receiver_name: txRow.receiver_name,
        amount: parseFloat(txRow.amount),
        category: txRow.category,
        description: txRow.description,
        status: txRow.status,
        created_at: txRow.created_at
      };

      return {
        success: true,
        transaction: completedTx,
        newBalance: newSenderBalance
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Fallback in memoria
  const senderMem = memoryWallets.get(normSenderCode);
  if (!senderMem) {
    throw new Error('Portafoglio mittente non trovato in memoria.');
  }
  if (senderMem.balance < amount) {
    throw new Error(`Saldo insufficiente: disponi di ${senderMem.balance.toFixed(2)} Ɱ.`);
  }
  if (senderMem.pin_hash && (!pin || hashPin(pin.trim()) !== senderMem.pin_hash)) {
    throw new Error('PIN di sicurezza non corretto.');
  }

  senderMem.balance -= amount;
  senderMem.updated_at = new Date().toISOString();

  let recMem = memoryWallets.get(normReceiverCode);
  if (!recMem) {
    recMem = {
      citizen_id: 9999,
      citizen_code: normReceiverCode,
      citizen_name: 'Cittadino Destinatario',
      balance: 5000.00 + amount,
      pin_hash: null,
      referral_count: 0,
      referral_bonus_awarded: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryWallets.set(normReceiverCode, recMem);
  } else {
    recMem.balance += amount;
    recMem.updated_at = new Date().toISOString();
  }

  const memTx: MondialTransaction = {
    id: memoryTransactions.length + 1,
    tx_hash: txHash,
    sender_citizen_id: senderCitizenId,
    sender_code: normSenderCode,
    sender_name: senderName || 'Cittadino Mittente',
    receiver_citizen_id: recMem.citizen_id,
    receiver_code: normReceiverCode,
    receiver_name: recMem.citizen_name,
    amount,
    category,
    description: description.trim(),
    status: 'completed',
    created_at: new Date().toISOString()
  };

  memoryTransactions.push(memTx);

  return {
    success: true,
    transaction: memTx,
    newBalance: senderMem.balance
  };
}

/**
 * Restituisce il registro pubblico trasparente dei baratti con codici anonimizzati
 */
export async function getPublicMondialLedger(
  dbPool: any,
  limit: number = 50
): Promise<PublicLedgerEntry[]> {
  if (dbPool) {
    try {
      const res = await dbPool.query(
        `SELECT tx_hash, sender_code, receiver_code, amount, category, description, created_at
         FROM nws_mondial_transactions
         WHERE status = 'completed'
         ORDER BY created_at DESC
         LIMIT $1`,
        [Math.min(limit, 100)]
      );

      return res.rows.map((r: any) => ({
        tx_hash: r.tx_hash,
        masked_sender: maskCitizenCode(r.sender_code),
        masked_receiver: maskCitizenCode(r.receiver_code),
        amount: parseFloat(r.amount),
        category: r.category,
        description: r.description,
        created_at: r.created_at
      }));
    } catch (err: any) {
      console.warn('[MONDIAL] getPublicLedger DB error:', err.message);
    }
  }

  return memoryTransactions
    .filter(t => t.status === 'completed')
    .slice(-limit)
    .reverse()
    .map(t => ({
      tx_hash: t.tx_hash,
      masked_sender: maskCitizenCode(t.sender_code),
      masked_receiver: maskCitizenCode(t.receiver_code),
      amount: t.amount,
      category: t.category,
      description: t.description,
      created_at: t.created_at
    }));
}

/**
 * Ricerca rapida di un cittadino per verifica destinatario prima del trasferimento
 */
export async function lookupCitizenByCode(
  dbPool: any,
  codeQuery: string
): Promise<{ found: boolean; citizenCode?: string; fullName?: string }> {
  if (!codeQuery || codeQuery.trim().length < 2) {
    return { found: false };
  }
  const clean = codeQuery.trim().toUpperCase();

  if (dbPool) {
    try {
      const res = await dbPool.query(
        `SELECT id, "citizenCode", "firstName", surname, username 
         FROM citizens 
         WHERE (UPPER("citizenCode") = $1 OR UPPER(username) = $1)
         LIMIT 1`,
        [clean]
      );

      if (res.rows.length > 0) {
        const c = res.rows[0];
        const fn = c.firstName || '';
        const sn = c.surname || '';
        return {
          found: true,
          citizenCode: c.citizenCode || clean,
          fullName: `${fn} ${sn}`.trim() || c.username || 'Cittadino Sovrano'
        };
      }
    } catch (err: any) {
      console.warn('[MONDIAL] lookupCitizenByCode DB err:', err.message);
    }
  }

  // Verifica nel registro memorie
  for (const [code, val] of memoryWallets.entries()) {
    if (code === clean) {
      return {
        found: true,
        citizenCode: code,
        fullName: val.citizen_name
      };
    }
  }

  return { found: false };
}

/**
 * Registra un referral (cittadino invitato) e aggiorna i progressi verso il bonus di 5.000 Ɱ
 */
export async function registerReferral(
  dbPool: any,
  referrerCitizenId: number,
  referredCitizenId: number
): Promise<{ success: boolean; referralCount: number; bonusEarned: boolean }> {
  if (!referrerCitizenId || !referredCitizenId || referrerCitizenId === referredCitizenId) {
    return { success: false, referralCount: 0, bonusEarned: false };
  }

  if (dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO nws_citizen_referrals (referrer_citizen_id, referred_citizen_id)
         VALUES ($1, $2)
         ON CONFLICT (referred_citizen_id) DO NOTHING`,
        [referrerCitizenId, referredCitizenId]
      );

      const cntRes = await dbPool.query(
        `SELECT COUNT(*) as count FROM nws_citizen_referrals WHERE referrer_citizen_id = $1`,
        [referrerCitizenId]
      );
      const newCount = parseInt(cntRes.rows[0]?.count || '0', 10);

      let bonusEarned = false;
      if (newCount >= 50) {
        // Verifica se bonus già assegnato
        const wRes = await dbPool.query(
          `SELECT referral_bonus_awarded FROM nws_mondial_wallets WHERE citizen_id = $1`,
          [referrerCitizenId]
        );
        if (wRes.rows.length > 0 && !wRes.rows[0].referral_bonus_awarded) {
          await dbPool.query(
            `UPDATE nws_mondial_wallets 
             SET balance = balance + 5000.00, referral_count = $1, referral_bonus_awarded = TRUE, updated_at = NOW()
             WHERE citizen_id = $2`,
            [newCount, referrerCitizenId]
          );
          bonusEarned = true;
        }
      }

      return { success: true, referralCount: newCount, bonusEarned };
    } catch (err: any) {
      console.warn('[MONDIAL] registerReferral DB err:', err.message);
    }
  }

  // Fallback in memoria
  const already = memoryReferrals.some(r => r.referred_id === referredCitizenId);
  if (!already) {
    memoryReferrals.push({
      referrer_id: referrerCitizenId,
      referred_id: referredCitizenId,
      created_at: new Date().toISOString()
    });
  }

  const count = memoryReferrals.filter(r => r.referrer_id === referrerCitizenId).length;
  return { success: true, referralCount: count, bonusEarned: count >= 50 };
}
