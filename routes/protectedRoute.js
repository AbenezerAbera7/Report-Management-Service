// routes/protectedRoute.js
const express = require('express');
const verifyToken = require('../middleware/auth');
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require('path');
const { decryptOutput, decryptData, encryptData } = require('../decrypt');
const db = require('../config/db');

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post("/uploadfile", verifyToken, upload.single("file"), async (req, res) => {
    try {
        const { decryptionKey, exportFormat, organization_id } = req.body;
        const userId = req.user;
        const tenantId = req.tenant;
        const file = req.file

        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        const fileBuffer = file.buffer
        // Use async file read
        const fileContent = fileBuffer.toString('utf8');

        let jsonData;

        if (fileContent.startsWith("\"")) {
            // File seems encrypted, check for decryption key
            if (!decryptionKey) {
                return res.status(400).json({ 'error': "Decryption key is required for encrypted files." });
            }
            try {
                const decryptedData = decryptOutput(fileContent, decryptionKey);
                jsonData = JSON.stringify(decryptedData);
            } catch (err) {
                return res.status(400).json({ 'error': "Failed to decrypt the file. Ensure the decryption key is correct." });
            }
        } else {
            jsonData = JSON.stringify(fileContent); // For non-encrypted files, just convert to string
        }

        // Encrypt the file content before saving
        const encrypted = encryptData(jsonData);
        const today = new Date()
        const filename = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}_ ${file.originalname || 'Report.json'}`;

        const outputFilePath = path.join(__dirname, 'uploads', filename);
        // Ensure the directory exists
        await fs.promises.mkdir(path.dirname(outputFilePath), { recursive: true });

        // Write the encrypted file
        await fs.promises.writeFile(outputFilePath, encrypted);

        // Store in the database
        db.query('INSERT INTO scan_results (tenant_id, organization_id, user_id, file_path) VALUES (?,?,?,?)',
            [tenantId, organization_id, userId, outputFilePath],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ "error": `Error occurred while uploading file: ${err.message}` });
                }
                return res.status(200).json({
                    "message": 'Scan results successfully uploaded',
                    "scanId": results.insertId
                });
            }

        );
        return res.status(200).json({
            "message": 'Scan results successfully uploaded'
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ "error": "An error occurred while processing the document." });
    }
});

router.post('/uploadjson', verifyToken, (req, res) => {

    try {
        const { result, organization_id } = req.body
        const token = req.headers['authorization'];
        const key = req.body.key ? req.body.key : false
        const userId = req.user ? req.user : false
        const tenantId = req.user ? req.tenant : false
        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })

        if (!key) return res.status(401).json({ 'error': "key is missing" })
        try {
            const Data = decryptOutput(result, key);
            const encrypted = encryptData(JSON.stringify(Data))
            const filename = `${Date.now()}.enc`
            const outputFilePath = path.join(__dirname, 'uploads', filename) //Store the encrypted data in 
            fs.mkdirSync(path.dirname(outputFilePath), { recursive: true })
            fs.writeFileSync(outputFilePath, encrypted)
            db.query('INSERT INTO scan_results (tenant_id, user_id, file_path,organization_id) VALUES (?,?,?,?)', [tenantId, userId, outputFilePath, organization_id], async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while uploading file ${err}` })
                return res.status(200).json({ "message": 'Scan results successfully uploaded ', fileUrl: outputFilePath });
            });
        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.post('/scanresults', verifyToken, (req, res) => {
    try {
        const userId = req.user ? req.user : false
        if (!userId) return res.status(401).json({ 'error': "Login first" })
        try {
            const get_results = "select created_at from scan_results where user_id = ?";
            db.query(get_results, [userId], async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while retrieving uploaded file ${err}` })
                return res.status(200).json({ "message": 'Scan results successfully uploaded ', result: results, count: results.length });
            });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.post('/scan_results', verifyToken, (req, res) => {
    try {
        const { organizationid } = req.body
        const userId = req.user ? req.user : false
        const isadmin = req.isadmin == 1 ? true : false
        if (!userId) return res.status(401).json({ 'error': "Login first" })
        try {
            let sql = ""
            let variable = []
            if (isadmin) {
                sql = "SELECT * FROM scan_results WHERE organization_id = ?"
                variable = [organizationid]
            } else {
                sql = "SELECT * FROM scan_results WHERE organization_id = ? AND user_id = ?;"
                variable = [organizationid, userId]

            }

            db.query(sql, variable, async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while retrieving uploaded file ${err}` })
                return res.status(200).json({ "message": 'Scan results successfully uploaded ', result: results, count: results.length });
            });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.delete('/scan_results/:id', verifyToken, (req, res) => {
    try {
        const { id } = req.params;
        const intId = parseInt(id, 10);


        const userId = req.user ? req.user : false
        const isadmin = req.isadmin == 1 ? true : false
        const tenantId = req.tenant ? req.tenant : false
        if (!userId || !tenantId) return res.status(401).json({ 'error': "Login first" })
        try {
            let sql = ""
            let variable = []
            if (isadmin) {
                sql = "delete FROM scan_results WHERE scan_id = ? and tenant_id = ?"
                variable = [intId, tenantId]
            } else {
                sql = "delete FROM scan_results WHERE scan_id = ? AND user_id = ? AND tenant_id = ?;"
                variable = [intId, userId, tenantId]

            }


            db.query(sql, variable, async (err, results) => {
                if (err) return res.status(500).json({ "error": `error occurred while retrieving uploaded file ${err}` })
                return res.status(200).json({ "message": 'Scan result successfully deleted ', result: results, count: results.length });
            });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred ${error}` })
        }
    }
    catch (error) {
        res.status(500).json({ "error": `Error occurred ${error}` })
    }

})

router.get('/test', verifyToken, (req, res) => {
    return res.send("protected test")
})

module.exports = router;
