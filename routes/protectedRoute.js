// routes/protectedRoute.js
const express = require('express');
const verifyToken = require('../middleware/auth');
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require('path');
const db = require('../config/db');
const { calculate_risk, calculate_average_risk_score, sanitizeAndParseJSON, ADextractKeyCounts, NetworktKeyCounts, MSextractKeyCounts } = require('../scorevalues');
const { decryptData } = require('./decrypt');
const { PDFWriter } = require('../PdfExport');
const storage = multer.memoryStorage();


const upload = multer({ storage: storage });

const checkFileOwnership = async (fileUrl, userId) => {
    const query = "SELECT count(*) AS is_owner FROM scan_results WHERE file_path = ? AND user_id = ?";

    return new Promise((resolve, reject) => {
        db.query(query, [fileUrl, userId], (err, results) => {
            if (err) return reject(`Error occurred while retrieving uploaded file: ${err}`);

            const isOwner = results[0].is_owner > 0;
            resolve(isOwner);
        });
    });
};

router.post('/read', verifyToken, async (req, res) => {
    try {
        const { fileUrl } = req.body;
        const userId = req.user

        try {
            // Check if user is the owner
            const isOwner = await checkFileOwnership(fileUrl, userId);

            if (!isOwner) return res.status(401).json({ 'error': "You don't have the permission to read this file." });

            // If the user is the owner, read and decrypt the file
            const content = fs.readFileSync(fileUrl, 'utf8');
            const decryptedContent = decryptData(content);
            const sanitized = sanitizeAndParseJSON(decryptedContent);
            const parsed = JSON.parse(sanitized)

            return res.status(200).json({ view: parsed });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred: ${error}` });
        }

    } catch (error) {
        res.status(500).json({ "error": `Error occurred: ${error}` });
    }
});

router.post('/analyze', verifyToken, async (req, res) => {
    try {
        const { fileUrl } = req.body;
        const userId = req.user

        try {
            // Check if user is the owner
            const isOwner = await checkFileOwnership(fileUrl, userId);

            if (!isOwner) return res.status(401).json({ 'error': "You don't have the permission to analyze this file." });

            // If the user is the owner, read and decrypt the file
            const content = fs.readFileSync(fileUrl, 'utf8');
            const decryptedContent = decryptData(content);

            return res.status(200).json({ "message": 'You can read the file.', data: decryptedContent });

        } catch (error) {
            res.status(500).json({ "error": `Error occurred: ${error}` });
        }

    } catch (error) {
        res.status(500).json({ "error": `Error occurred: ${error}` });
    }
});

router.post('/score', verifyToken, async (req, res) => {
    try {
        const userId = req.user;
        const tenantId = req.tenant;
        const { fileUrl } = req.body;

        // Check if the user owns the file
        const isOwner = await checkFileOwnership(fileUrl, userId);
        if (!isOwner) {
            return res.status(403).json({ error: "You don't have permission to score this upload" });
        }

        // Read the file content
        const content = fs.readFileSync(fileUrl, 'utf8');

        // Decrypt the file content
        const decryptedContent = decryptData(content);

        if (!decryptedContent) {
            return res.status(400).json({ error: "Error decrypting the file content" });
        }

        // Parse and sanitize the JSON content
        const allIncidents = sanitizeAndParseJSON(decryptedContent);
        const parsed = JSON.parse(allIncidents)
        if (!parsed) {
            return res.status(500).json({ error: "Error occurred while parsing the file" });
        }
        // Extract incident data for AD 
        let risks = []
        let incident_weak_causes = []
        if (parsed.hasOwnProperty('Ad Scan')) {
            const adIncident = ADextractKeyCounts(parsed['Ad Scan']);
            if (!adIncident) {
                return res.status(500).json({ error: "Error extracting AD incidents" });
            }

            // Calculate risk score

            const total_user = adIncident['AD Users']
            let { individual_risk_percentages, incident_weak_cause, group_risk } = calculate_risk(adIncident, total_user);
            const ad_risk = calculate_average_risk_score(individual_risk_percentages);
            if (ad_risk) {
                risks.push(ad_risk)
                incident_weak_causes = { ...incident_weak_causes, ...incident_weak_cause }
            }

        }
        if (parsed.hasOwnProperty('network_devices')) {
            const NetworkIncident = NetworktKeyCounts(parsed['network_devices']);
            if (!NetworkIncident) {
                return res.status(500).json({ error: "Error extracting AD incidents" });
            }

            const total_open_ports = NetworkIncident.total_open_ports
            const { individual_risk_percentages, incident_weak_cause, group_risk } = calculate_risk(NetworkIncident, total_open_ports);
            const network_risk = calculate_average_risk_score(individual_risk_percentages);
            if (network_risk) {
                risks.push(network_risk)
                incident_weak_causes = { ...incident_weak_causes, ...incident_weak_cause }
            }


        }
        if (parsed.hasOwnProperty('MS365')) {
            const msIncident = MSextractKeyCounts(parsed['MS365']);
            if (!msIncident) {
                return res.status(500).json({ error: "Error extracting AD incidents" });
            }
            const total_user = msIncident['users']
            const { individual_risk_percentages, incident_weak_cause, group_risk } = calculate_risk(msIncident, total_user);
            const ms_risk = calculate_average_risk_score(individual_risk_percentages)
            if (ms_risk) {
                risks.push(ms_risk)
                incident_weak_causes = { ...incident_weak_causes, ...incident_weak_cause }
            }


        }

        const risk = calculate_average_risk_score(risks)
        const sql = 'update scan_results set score = ?, action = ? where file_path = ?'
        db.query(sql, [risk, JSON.stringify(incident_weak_causes), fileUrl], (err, results) => {
            if (err) return res.status(500).json({ error: 'error updating score' })
            return res.status(200).json({ score: risk });
        });

    } catch (error) {
        console.error("Unexpected Error:", error);  // Log error for debugging purposes
        return res.status(500).json({ error: `Error occurred while scoring: ${error.message}` });
    }
});

router.post('/export', verifyToken, async (req, res) => {
    try {
        const userId = req.user;
        const tenantId = req.tenant;
        const { fileUrl, format, template_id } = req.body;


        // Check if the user owns the file
        const isOwner = await checkFileOwnership(fileUrl, userId);
        if (!isOwner) {
            return res.status(403).json({ error: "You don't have permission to score this upload" });
        }

        // Read the file content
        const content = fs.readFileSync(fileUrl, 'utf8');

        // Decrypt the file content
        const decryptedContent = decryptData(content);

        if (!decryptedContent) {
            return res.status(400).json({ error: "Error decrypting the file content" });
        }

        // Parse and sanitize the JSON content
        const allIncidents = sanitizeAndParseJSON(decryptedContent);
        const parsed = JSON.parse(allIncidents)
        if (!parsed) {
            return res.status(500).json({ error: "Error occurred while parsing the file" });
        }
        const exportData = {}
        const keyValue = {}

        // Extract incident data for AD 
        if ('Ad Scan' in parsed) {
            const adIncident = ADextractKeyCounts(parsed['Ad Scan']);
            if (!adIncident) {
                return res.status(500).json({ error: "Error extracting AD incidents" });
            }

            // Calculate risk score
            keyValue['Active Directory Scan'] = adIncident
            const total_user = adIncident['AD Users']
            const { individual_risk_percentages, incident_weak_cause, group_risk } = calculate_risk(adIncident, total_user);
            const risk = calculate_average_risk_score(individual_risk_percentages);
            exportData['Active Directory Scan'] = [group_risk, parseFloat(risk)]
        }
        if ('MS365' in parsed) {
            const msIncident = MSextractKeyCounts(parsed['MS365']);
            if (!msIncident) {
                return res.status(500).json({ error: "Error extracting AD incidents" });
            }
            keyValue['Microsoft 365 Scan'] = msIncident
            const total_user = msIncident['users']
            const { individual_risk_percentages, incident_weak_cause, group_risk } = calculate_risk(msIncident, total_user);
            const risk = calculate_average_risk_score(individual_risk_percentages);
            exportData['Microsoft 365 Scan'] = [group_risk, parseFloat(risk)]
        }
        if ('network_devices' in parsed) {
            const NetworkIncident = NetworktKeyCounts(parsed['network_devices']);
            if (!NetworkIncident) {
                return res.status(500).json({ error: "Error extracting AD incidents" });
            }
            try {
                keyValue['Network Scan'] = NetworkIncident
                const total_open_ports = NetworkIncident.total_open_ports
                const { individual_risk_percentages, incident_weak_cause, group_risk } = calculate_risk(NetworkIncident, total_open_ports);
                const risk = calculate_average_risk_score(individual_risk_percentages);
                if (group_risk && risk) {
                    exportData['Network Scan'] = [group_risk, parseFloat(risk)]
                }
            } catch (error) {
                console.log('====================================');
                console.log(error.message);
                console.log('====================================');
            }
        }

        const getOrganization = `select name from organization  where id=(select organization_id from scan_results where file_path=?);`

        db.query(getOrganization, [fileUrl], async (err, results) => {
            if (err) return res.status(500).json({ error: 'error exporting data' })

            const organization_name = results[0].name
            // const tenant_name = results[0].tenant_name
            if (exportData) {
                const json_name = fileUrl.split('/')[fileUrl.split('/').length - 1]

                const pdfBytes = await PDFWriter(exportData, organization_name, tenant_name = '', json_name, template_id, keyValue)
                const pdfBuffer = Buffer.from(pdfBytes);
                res.setHeader('Content-Type', 'application/pdf')
                res.setHeader('Content-Disposition', `attachment;filename=audit.pdf`)
                return res.send(pdfBuffer)
            }
            return res.status(404).json({ error: 'Corrupted json file' })
        });

    } catch (error) {
        return res.status(500).json({ error: `Error occurred while scoring: ${error.message}` });
    }
});

router.get('/test', verifyToken, (req, res) => {
    return res.send("protected test")
})

module.exports = router;
