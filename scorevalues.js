const axios = require('axios');
const riskPoints = {
    "password_set": [30, 'Passwords Set to Never Expire', 'Ensure that password expiration policies are configured to meet security standards.'],
    "User_log": [15, 'User has not logged in for more than 30 days', 'Review and deactivate inactive user accounts to prevent unauthorized access.'],
    "unsupported_software": [98, 'Unsupported Software', 'Ensure that all software is up-to-date and supported to reduce security vulnerabilities.'],
    "unsupported_os": [98, 'Unsupported Operating System', 'Upgrade to a supported operating system version to mitigate security risks.'],
    "anti_virus": [90, 'Anti Virus not up to date', 'Ensure that antivirus software is updated regularly to protect against threats.'],
    "inactive_computer": [15, 'Inactive Computer', 'Deactivate or securely store inactive devices to minimize risk of unauthorized access.'],
    "insecure_listening": [20, "Insecure Listening Ports", 'Close any unnecessary ports or secure them with proper firewall rules.'],
    "extended_support": [20, 'Operating System Extended Support', 'Consider upgrading to a fully supported OS version to avoid security gaps.'],
    "device_type_Router": [23, 'Routers often have weak security, exposing networks to attacks.', 'Secure configurations, disable unused services, and update firmware regularly.'],
    "device_type_IoT": [23, 'IoT devices are poorly secured and easy targets for exploitation.', 'Use strong passwords, network segmentation, and regular updates.'],
    "device_type_Mail_Server": [23, 'Mail servers are targeted by phishing and unauthorized access attempts.', 'Enable encryption, use MFA, and patch vulnerabilities promptly.'],
    "device_type_Web_Server": [23, 'Web servers are vulnerable to attacks like SQL injection and XSS.', 'Use firewalls, encryption, secure coding, and regular updates.'],
    "device_type_Printer": [23, 'Printers have weak security and can provide unauthorized access to networks.', 'Isolate on secure networks, change default passwords, and update firmware.'],
    // ms365
    "weak_password_policies": [80, 'Compromised accounts could lead to exposure of sensitive PII stored in Microsoft 365.', 'Enforce strong password policies across all accounts to prevent unauthorized access.'],
    "mfa_disabled": [90, 'Increases risk of account compromise and subsequent PII breaches.', 'Enable multi-factor authentication (MFA) for all users to secure accounts.'],
    "excessive_admin_privileges": [85, 'Increases risk of PII exposure through mismanagement or insider threats.', 'Limit admin privileges and follow the principle of least privilege.'],
    "legacy_auth_enabled": [80, 'Older protocols allow easy exploitation and access to sensitive data.', 'Disable legacy authentication methods and adopt more secure protocols.'],
    "lack_of_dlp_policies": [85, 'No safeguards to prevent PII from being shared externally.', 'Implement Data Loss Prevention (DLP) policies to monitor and prevent unauthorized sharing of sensitive information.'],
    "misconfigured_exchange_forwarding": [75, 'Increases risk of PII being exfiltrated through unauthorized email forwarding.', 'Review and configure Exchange forwarding settings to prevent data leakage.'],
    "excessive_sharing_onedrive_sharepoint": [65, 'PII stored in shared files may be accessed by unauthorized individuals.', 'Limit sharing settings on OneDrive and SharePoint to ensure data is protected.'],
    "endpoint_manager_policies_not_configured": [80, 'Devices accessing sensitive data are not monitored or compliant with security standards.', 'Implement endpoint management policies to monitor and secure devices accessing sensitive data.'],
    "orphaned_accounts_in_ms": [85, 'Dormant accounts are vulnerable to compromise and may expose PII.', 'Remove or disable orphaned accounts to reduce security risks.'],
    "data_retention_policies_misconfigured": [50, 'Failure to delete PII according to retention policies increases the risk of non-compliance.', 'Ensure data retention policies are defined and adhered to for compliance.'],


    // risk2
    "outdated_operating_system": [100, 'Unpatched systems can expose PII stored locally or processed on the computer.', 'Ensure that systems are patched and updated regularly to protect sensitive data.'],
    "missing_antivirus_or_antimalware": [90, 'Malware infections can result in PII theft.', 'Install and update antivirus or anti-malware software to detect and prevent threats.'],
    "disabled_firewall": [90, 'Unprotected systems expose PII to network attacks.', 'Enable firewalls on all systems to safeguard against network-based threats.'],
    "unencrypted_drives": [85, 'Loss of unencrypted devices could result in a complete breach of stored PII.', 'Implement encryption on all drives containing sensitive data to prevent unauthorized access.'],
    "weak_or_no_screensaver_lock": [50, 'Unauthorized physical access to devices may expose PII.', 'Enforce screensaver lock policies to protect against unauthorized physical access.'],
    "auto_run_enabled_for_removable_media": [75, 'Increased risk of malicious software exfiltrating PII.', 'Disable auto-run for removable media to prevent malware execution.'],
    "open_rdp": [90, 'Exploitable remote access can lead to full compromise of systems with PII.', 'Disable remote access services or secure them using strong authentication and encryption.'],
    "outdated_firmware": [90, 'Exploitable vulnerabilities in outdated firmware.', 'Update firmware regularly to patch vulnerabilities.'],
    // ad related issues
    'unsupported_os_in_ad': [10, 'Unpopulated AD Organizational Units', 'Review and populate AD Organizational Units for better security and management.'],
    "offline_devices_in_ad": [78, 'Offline devices may pose a security risk.', 'Review and remove offline devices from AD.'],
    "unsecured_privileged_groups": [100, 'Domain Admin accounts can grant access to sensitive PII.', 'Review and secure privileged group memberships to ensure only authorized users have access.'],
    "orphaned_accounts_in_ad": [85, 'Dormant accounts are vulnerable to compromise and may expose PII.', 'Remove or disable orphaned accounts to reduce security risks.'],
    "gpo_enforcement": [90, 'Inconsistent policies can result in unauthorized access to PII.', 'Enforce Group Policy Objects (GPOs) across the organization to maintain consistency and security.'],
    "unmonitored_service_accounts": [80, 'Service accounts can be exploited to access databases containing PII.', 'Monitor and regularly audit service accounts to prevent unauthorized access.'],
    "auditing_on_ad_changes": [85, 'Missed detection of unauthorized changes could lead to PII exposure.', 'Enable auditing for all Active Directory changes to detect and respond to suspicious activities.'],
    "devices_with_no_backup_in_ad": [55, 'No backup increases risk of data loss and system downtime.', 'Ensure regular backups for all devices in AD to maintain data recovery options.'],
    "excessive_domain_controllers": [76, 'Too many domain controllers can increase attack surface and complexity.', 'Limit the number of domain controllers to only necessary ones to reduce security risks.'],
    "shared_sensitive_files_in_ad": [77, 'Shared sensitive files pose unauthorized access risks.', 'Enforce strict access controls and encryption for sensitive files in AD.']
};

const calculate_risk = (incidents, total = 0) => {
    let individual_risk_percentages = {};
    let incident_weak_cause = {}
    let group_risk = [] // outerText : string innerListItems: Array color: string

    Object.keys(incidents).forEach(key => {

        try {
            if (riskPoints.hasOwnProperty(key)) { // check if the key in in risk points

                const incident_count = incidents[key];

                if (typeof incident_count === 'number') {
                    const format_key = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    const incident_risk_points = riskPoints[key][0];
                    const max_possible_points = incident_risk_points;
                    const incident_risk_percentage = (incident_count * incident_risk_points) / (max_possible_points * total) * 100;
                    individual_risk_percentages[key] = incident_risk_percentage.toFixed(2);
                    if (incident_risk_percentage > 20) {
                        incident_weak_cause[format_key] = [incident_risk_percentage.toFixed(2), riskPoints[key][1], riskPoints[key][2]];
                    }
                    let color = ''
                    if (incident_risk_percentage >= 80) {
                        color = 'red'
                    } else if (incident_risk_percentage > 20) {
                        color = 'yellow'
                    } else {
                        color = 'green'
                    }
                    group_risk.push({
                        outerText: format_key,
                        innerListItems: [riskPoints[key][2]],
                        color: color
                    })

                }
                else if (typeof incident_count === 'boolean') {
                    const format_key = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    let incident_risk_percentage = 0
                    if (incident_count) {
                        incident_risk_percentage = '0'
                    } else {
                        incident_risk_percentage = riskPoints[key][0].toFixed(2)
                    }
                    if (incident_risk_percentage > 20) {
                        incident_weak_cause[format_key] = [incident_risk_percentage, riskPoints[key][1], riskPoints[key][2]];
                    }

                    individual_risk_percentages[key] = incident_risk_percentage
                    let color = ''
                    if (incident_risk_percentage >= 80) {
                        color = 'red'
                    } else if (incident_risk_percentage > 20) {
                        color = 'yellow'
                    } else {
                        color = 'green'
                    }
                    group_risk.push({
                        outerText: format_key,
                        innerListItems: [riskPoints[key][2]],
                        color: color
                    })


                }
                else if (typeof incident_count == 'object') {

                    const format_key = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    const incident_risk_points = riskPoints[key][0];
                    const max_possible_points = incident_risk_points;
                    const incident_risk_percentage = (incident_count[0] * incident_risk_points) / (max_possible_points * incident_count[1]) * 100;
                    individual_risk_percentages[key] = incident_risk_percentage.toFixed(2);
                    if (incident_risk_percentage > 20) {
                        incident_weak_cause[format_key] = [incident_risk_percentage.toFixed(2), riskPoints[key][1], riskPoints[key][2]];
                    }
                    let color = ''
                    if (incident_risk_percentage >= 80) {
                        color = 'red'
                    } else if (incident_risk_percentage > 20) {
                        color = 'yellow'
                    } else {
                        color = 'green'
                    }
                    group_risk.push({
                        outerText: format_key,
                        innerListItems: [riskPoints[key][2]],
                        color: color
                    })
                }
                else {
                    console.log('====================================');
                    console.log(`unknown datatype for key ${key}`);
                    console.log('====================================');

                }

            }

        } catch (error) {
            console.log('====================================');
            console.log(error);
            console.log('====================================');
        }

    });

    return { individual_risk_percentages, incident_weak_cause, group_risk };
};

const calculate_average_risk_score = (individual_risk_percentages) => {
    let total_risk = 0;
    let total_incidents = Object.keys(individual_risk_percentages).length;

    // Sum all individual risk percentages
    Object.values(individual_risk_percentages).forEach(risk => {
        total_risk += parseFloat(risk);
    });

    // Calculate average
    const average_risk_score = total_risk / total_incidents;
    return average_risk_score.toFixed(2);
};


function sanitizeAndParseJSON(jsonString) {
    try {
        const sanitizedInput = jsonString.replace(/\\\\/g, '\\');
        const finalSanitizedInput = sanitizedInput.replace(/\\n/g, '\n');
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
}

async function isVulnerable(softwareName, softwareVersion) {
    const NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

    try {
        const url = `${NVD_API_URL}?keywordSearch=${softwareName}&versionStart=${softwareVersion}&versionStartType=including&versionEnd=${softwareVersion}&versionEndType=excluding`
        const response = await axios.get(url);
        const cves = response.data.cves;
        if (cves && cves.length > 0) {
            return true;
        }
    } catch (error) {
        return null
    }
    return false;
}

function ADextractKeyCounts(data) {
    const result = {};

    if (Array.isArray(data.inactive_accounts)) {
        result["orphaned_accounts_in_ad"] = data.inactive_accounts.length
    }

    if (Array.isArray(data['AD Users'])) {
        result["AD Users"] = data['AD Users'].length
    }

    if (data.hasOwnProperty('gpo_enforcement')) {

        result["gpo_enforcement"] = data["gpo_enforcement"]
    }
    if (data.hasOwnProperty('auditing_on_ad_changes')) {

        result["auditing_on_ad_changes"] = data["auditing_on_ad_changes"]
    }


    if (Array.isArray(data.Computers)) {
        const total_computers = data.Computers.length
        let unKnownOs = 0
        for (let computer in data.Computers) {
            if (computer.os) {
                unKnownOs += 1
            }
        }
        result["unsupported_os_in_ad"] = [unKnownOs, total_computers]
        result['computers'] = data.Computers.length
    }

    if (data.ad_devices) {
        const total_device = Object.keys(data.ad_devices).length;
        let open_rdp = 0
        let total_rdp_checked = 0
        let nobackup = 0
        let backupchecked = 0
        let online_devices = 0
        let device_with_sensitive_files = 0
        let count_sensitive_files = 0

        for (let deviceName in data.ad_devices) {
            const device = data.ad_devices[deviceName];
            if (device.device_ip) {
                online_devices += 1
            }
            if (device.rdp_result && device.rdp_result.rdp_status) {
                if (device.rdp_result.rdp_status === 'Running') {
                    open_rdp += 1
                }
                total_rdp_checked += 1
            }
            if (device.system_result && device.system_result.backup) {
                if (device.system_result.backup == "No backup event found") {
                    nobackup += 1
                }
                backupchecked += 1
            }
            if (device.sensitive_files) {
                if (device.sensitive_files.length > 0) {
                    device_with_sensitive_files += 1
                    sensitive_files += device.sensitive_files.length
                }
            }

        }
        result['shared_sensitive_files_in_ad'] = [device_with_sensitive_files, total_device]
        result['open_rdp'] = [open_rdp, total_rdp_checked]
        result['devices_with_no_backup_in_ad'] = [nobackup, backupchecked]
        result['offline_devices_in_ad'] = [total_device - online_devices, total_device]
        result['devices'] = total_device
        result['sensitive_files'] = sensitive_files
    }

    if (Array.isArray(data.domain_controllers)) {
        result["excessive_domain_controllers"] = data.domain_controllers.length < 5 //true means igone
        result['domain_controllers'] = data.domain_controllers.length
    }

    if (Array.isArray(data.printers)) {
        result["printers"] = data.printers.length;
    }

    return result;
}

const sensetive_ports = { 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 80: "HTTP", 139: "NetBIOS", 143: "SMB", 3306: "MySQL", 3389: "RDP", 8080: "HTTP" }

function MSextractKeyCounts(data) {
    // true means no risk
    const result = {};

    // Extract counts for arrays
    if (Array.isArray(data.inactive_accounts)) {
        result["orphaned_accounts_in_ms"] = data.inactive_accounts.length
    }

    if (Array.isArray(data['users'])) {
        result["users"] = data['users'].length
    }

    if (data.hasOwnProperty('MFA')) {
        const mfa_disabled = data['MFA'].filter(item => item["MFA Enabled"] == 0);
        result["mfa_disabled"] = mfa_disabled.length
    }
    if (data.hasOwnProperty('legacy_auth_enabled')) {

        result["legacy_auth_enabled"] = data["legacy_auth_enabled"] == 0 ? true : false
    }
    if (data.hasOwnProperty('password_policies')) {

        result["weak_password_policies"] = data["password_policies"] == 0 ? true : false
    }
    if (data.hasOwnProperty('excessive_admin_privileges')) {

        result["excessive_admin_privileges"] = data['excessive_admin_privileges'].length == 0 ? true : false
    }
    if (data.hasOwnProperty('conditional_access_policies')) {

        result["conditional_access_policies"] = data['conditional_access_policies'] == 0 ? false : true
    }

    if (data.hasOwnProperty("misconfigured_exchange_forwarding")) {

        result["misconfigured_exchange_forwarding"] = data["misconfigured_exchange_forwarding"] == 0 ? true : false
    }

    if (data.hasOwnProperty("excessive_sharing_onedrive_sharepoint")) {

        result["excessive_sharing_onedrive_sharepoint"] = data["excessive_sharing_onedrive_sharepoint"] == 0 ? true : false
    }
    if (data.hasOwnProperty("lack_of_dlp_policies")) {

        result["lack_of_dlp_policies"] = data["lack_of_dlp_policies"] == 0 ? false : true
    }

    if (data.hasOwnProperty("data_retention_policies_misconfigured")) {

        result["data_retention_policies_misconfigured"] = data["data_retention_policies_misconfigured"] == 0 ? false : true
    }

    return result;
}

function NetworktKeyCounts(data) {

    const result = {};
    const total_device = data.length
    let insecure_ports = 0
    let total_open_ports = 0
    let total_installed_softwares = 0
    let vulnerable_softwares = 0
    let no_screensaver_lock = 0
    let vulnerable_firmwares = 0

    result["device_type_Router"] = [0, total_device]
    result["device_type_IoT"] = [0, total_device]
    result["device_type_Mail_Server"] = [0, total_device]
    result["device_type_Web_Server"] = [0, total_device]
    result["device_type_Printer"] = [0, total_device]


    data.map(item => {
        if (typeof item.open_ports === "object") {
            Object.keys(item.open_ports).map(key => {
                total_open_ports += 1
                const insecure_port = sensetive_ports.hasOwnProperty(key)
                if (insecure_port) {
                    insecure_ports += 1
                }
            })
        }
        if (typeof item.installed_softwares == 'object') {
            item.installed_softwares.map(software => {
                total_installed_softwares += 1
                const _isVulnerable = isVulnerable(software.Name, software.Version)
                if (_isVulnerable == true) {
                    vulnerable_softwares += 1
                }
            })
        }
        if (typeof data.weak_or_no_screensaver_lock === 'number') {
            if (data.weak_or_no_screensaver_lock == '0') {
                no_screensaver_lock += 1
            }
        }
        if (data.device_type) {
            if (result.hasOwnProperty(data.device_type)) {
                result[data.device_type][0] += 1

            }
        }

        if (data.firmware_version) {
            const name_version = data.firmware_version.split('/')
            const name = name_version[0]
            const version = name_version[1]

            const _isVulnerable = isVulnerable(name, version)
            if (_isVulnerable == true) {
                vulnerable_firmwares += 1
            }
        }

    })

    result["insecure_listening"] = insecure_ports
    result['total_open_ports'] = total_open_ports
    result['unsupported_software'] = [vulnerable_softwares, total_installed_softwares]
    result['weak_or_no_screensaver_lock'] = [no_screensaver_lock, total_device]
    result['outdated_firmware'] = [vulnerable_firmwares, total_device]


    return result;
}





module.exports = { calculate_risk, calculate_average_risk_score, sanitizeAndParseJSON, ADextractKeyCounts, NetworktKeyCounts, MSextractKeyCounts };

