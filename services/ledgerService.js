const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LEDGER_FILE = path.join(__dirname, '..', 'data', 'ledger.json');

if (!fs.existsSync(path.dirname(LEDGER_FILE))) {
  fs.mkdirSync(path.dirname(LEDGER_FILE), { recursive: true });
}

function calculateHash(block) {
  const dataString = `${block.id}${block.timestamp}${block.reportId}${block.dataPayload}${block.previousHash}`;
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

if (!fs.existsSync(LEDGER_FILE)) {
  const genesisBlock = {
    id: 0,
    timestamp: new Date().toISOString(),
    reportId: 'GENESIS',
    dataPayload: 'GENESIS_BLOCK',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000'
  };
  genesisBlock.hash = calculateHash(genesisBlock);
  genesisBlock.status = 'verified';
  fs.writeFileSync(LEDGER_FILE, JSON.stringify([genesisBlock], null, 2));
}

function getLedger() {
  return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf-8'));
}

function addBlock(reportId, extractedData) {
  const ledger = getLedger();
  const previousBlock = ledger[ledger.length - 1];
  const newBlock = {
    id: ledger.length,
    timestamp: new Date().toISOString(),
    reportId: reportId || `REP-${Date.now()}`,
    dataPayload: JSON.stringify(extractedData),
    previousHash: previousBlock.hash,
    status: 'verified'
  };
  newBlock.hash = calculateHash(newBlock);
  ledger.push(newBlock);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
  return newBlock;
}

function verifyLedger() {
  const ledger = getLedger();
  let isValid = true;
  for (let i = 1; i < ledger.length; i++) {
    const currentBlock = ledger[i];
    const previousBlock = ledger[i - 1];
    
    if (currentBlock.previousHash !== previousBlock.hash) {
      currentBlock.status = 'tampered';
      isValid = false;
    }
    const recalculatedHash = calculateHash(currentBlock);
    if (currentBlock.hash !== recalculatedHash) {
      currentBlock.status = 'tampered';
      isValid = false;
    }
    if (currentBlock.hash === recalculatedHash && currentBlock.previousHash === previousBlock.hash) {
      currentBlock.status = 'verified';
    }
  }
  return { isValid, ledger };
}

function tamperWithBlock(blockId) {
  const ledger = getLedger();
  const block = ledger.find(b => b.id === Number(blockId));
  if (block && block.id !== 0) {
    block.dataPayload = '{"tampered": "malicious injection"}';
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
    return true;
  }
  return false;
}

module.exports = { getLedger, addBlock, verifyLedger, tamperWithBlock };
