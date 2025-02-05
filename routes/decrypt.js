const crypto = require('crypto');


function decryptOutput(encryptedData, key) {
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const keyBuffer = Buffer.from(key, 'base64');

    if (keyBuffer.length !== 32) {
        throw new Error('Invalid key length. The key must be 32 bytes (256 bits) for AES-256.');
    }

    const iv = encryptedDataBuffer.slice(0, 16);
    const ciphertext = encryptedDataBuffer.slice(16);

    const decipher = crypto.createDecipheriv('aes-256-cfb', keyBuffer, iv);

    // Decrypt the ciphertext
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Convert decrypted data to string and parse JSON
    const plaintext = decrypted.toString('utf8');
    return JSON.parse(plaintext);
}

function encryptData(data) {
    const keyBuffer = Buffer.from(`${process.env.AES_KEY}`, 'hex');
    const ivBuffer = Buffer.from(`${process.env.IV}`, 'hex');

    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

function decryptData(data) {
    const ivBuffer = Buffer.from(`${process.env.IV}`, 'hex');  // Convert the stored IV (from .env or wherever) to a buffer
    const keyBuffer = Buffer.from(`${process.env.AES_KEY}`, 'hex');

    if (ivBuffer.length !== 16) {
        throw new Error('Invalid IV length');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}



module.exports = { decryptOutput, encryptData, decryptData };
