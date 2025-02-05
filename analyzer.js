const riskPoints = {
    "password_set": [30, 'Passwords Set to Never Expire'],
    "User_log": [15, 'User has not logged in for more than 30 days'],
    "unsupported_software": [98, 'Unsupported Software'],
    "unsupported_os": [98, 'Unsupported Operating System'],
    "anti_virus": [90, 'Anti Virus not up to date'],
    "inactive_computer": [15, 'Inactive Computer'],
    "insecure_listening": [20, "Insecure Listening Ports"],
    'unsupported_os': [10, 'Unpopulated AD Organizational Units'],
    "extended_support": [20, 'Operating System Extended Support'],
    // ms365
    "weak_password_policies": [80, 'Compromised accounts could lead to exposure of sensitive PII stored in Microsoft 365.'],
    "mfa_disabled": [90, 'Increases risk of account compromise and subsequent PII breaches.'],
    "excessive_admin_privileges": [85, 'Increases risk of PII exposure through mismanagement or insider threats.'],
    "legacy_auth_enabled": [80, 'Older protocols allow easy exploitation and access to sensitive data.'],
    "data_retention_policies_misconfigured": [50, 'Failure to delete PII according to retention policies increases the risk of non-compliance.'],
    "lack_of_dlp_policies": [85, 'No safeguards to prevent PII from being shared externally.'],
    "misconfigured_exchange_forwarding": [75, 'Increases risk of PII being exfiltrated through unauthorized email forwarding.'],
    "excessive_sharing_onedrive_sharepoint": [65, 'PII stored in shared files may be accessed by unauthorized individuals.'],
    "endpoint_manager_policies_not_configured": [80, 'Devices accessing sensitive data are not monitored or compliant with security standards.'],
    // risk2
    "outdated_operating_system": [100, 'Unpatched systems can expose PII stored locally or processed on the computer.'],
    "missing_antivirus_or_antimalware": [90, 'Malware infections can result in PII theft.'],
    "disabled_firewall": [90, 'Unprotected systems expose PII to network attacks.'],
    "unencrypted_drives": [85, 'Loss of unencrypted devices could result in a complete breach of stored PII.'],
    "weak_or_no_screensaver_lock": [50, 'Unauthorized physical access to devices may expose PII.'],
    "auto_run_enabled_for_removable_media": [75, 'Increased risk of malicious software exfiltrating PII.'],
    "open_rdp_or_other_remote_access_services": [90, 'Exploitable remote access can lead to full compromise of systems with PII.']
}
// ad related issues
const ad_riskPoints = {
    "unsecured_privileged_groups": [100, 'Domain Admin accounts can grant access to sensitive PII.'],
    "orphaned_accounts_in_ad": [85, 'Dormant accounts are vulnerable to compromise and may expose PII.'],
    "lack_of_gpo_enforcement": [90, 'Inconsistent policies can result in unauthorized access to PII.'],
    "unmonitored_service_accounts": [80, 'Service accounts can be exploited to access databases containing PII.'],
    "disabled_auditing_on_ad_changes": [85, 'Missed detection of unauthorized changes could lead to PII exposure.']
};

// Example Data Object
const data = {
    "Ad Scan": {
        "inactive_accounts": [
            "Guest",
            "krbtgt",
            "yser1",
            "user2",
            "COMPUTER-NAME-1$",
            "COMPUTER-NAME-2$",
            "COMPUTER-DC$",
            "Abeny",
            "user3",
            "abenezer",
            "COMPUTER-44$"
        ],
        "AD Users": [
            { "name": "Administrator", "last_logon": "2025-01-11" },
            { "name": "Guest", "last_logon": "1601-01-01" },
            { "name": "krbtgt", "last_logon": "1601-01-01" },
            { "name": "yser1", "last_logon": "1601-01-01" },
            // More users...
        ]
    }
};

const checkIncidents_ad = (data, riskPoints) => {
    // data: results['Ad Scan']
    // riskPoints : ad_riskPoints
    const incidents = {};

    // Iterate through each risk type
    Object.keys(riskPoints).forEach(risk => {
        let points = riskPoints[risk][0];
        let rationale = riskPoints[risk][1];
        let incidentMessage = '';

        // Check for specific conditions in data for each risk
        if (risk === 'orphaned_accounts_in_ad') {

            const inactiveAccounts = data.inactive_accounts;
            if (inactiveAccounts && inactiveAccounts.length > 0) {
                incidentMessage = 'User has not logged in for more than 30 days';
                incidents[risk] = inactiveAccounts.length;
            }
        }

        if (risk === 'unsecured_privileged_groups') {

            incidentMessage = 'Unsupported Software';
        }

        if (risk === 'unsupported_os') {

            incidentMessage = 'Unsupported Operating System';
        }

        if (risk === 'anti_virus') {

            incidentMessage = 'Anti Virus not up to date';
        }

        if (risk === 'inactive_computer') {

            incidentMessage = 'Inactive Computer';
        }

    });

    return incidents;
};

module.exports = { checkIncidents_ad };
