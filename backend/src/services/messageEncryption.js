const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'MESSAGE_ENCRYPTION_KEY is missing from .env'
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      'MESSAGE_ENCRYPTION_KEY must be a 64-character hexadecimal string'
    );
  }

  return Buffer.from(key, 'hex');
}

function encryptMessage(text) {
  const key = getKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  let encrypted = cipher.update(
    text,
    'utf8',
    'hex'
  );

  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

function decryptMessage(
  encryptedText,
  iv,
  authTag
) {
  const key = getKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(
    Buffer.from(authTag, 'hex')
  );

  let decrypted = decipher.update(
    encryptedText,
    'hex',
    'utf8'
  );

  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encryptMessage,
  decryptMessage,
};