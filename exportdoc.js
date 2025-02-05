const { Document, Paragraph, TextRun, HeadingLevel } = require("docx");

function exportdoc(data) {
    const createHeading = (text, level) =>
        new Paragraph({ text, heading: level, spacing: { after: 200 } });

    const createTextParagraph = (text) =>
        new Paragraph({ children: [new TextRun({ text })] });

    return new Document({
        sections: [
            {
                children: [
                    ...(data.network_devices?.length
                        ? [
                            createHeading("Network Devices", HeadingLevel.HEADING_1),
                            ...data.network_devices.map((device, index) => [
                                createHeading(`Device ${index + 1}`, HeadingLevel.HEADING_2),
                                createTextParagraph(`IP Address: ${device.ip ?? "(Not specified)"}`),
                                createTextParagraph(`Hostname: ${device.hostname ?? "(Not specified)"}`),
                                createTextParagraph(`Status: ${device.status ?? "(Not specified)"}`),
                                createTextParagraph(`Device Type: ${device.device_type ?? "(Not specified)"}`),
                                createTextParagraph(
                                    `Firmware Version: ${device.firmware_version ?? "(Not specified)"}`
                                ),
                                createTextParagraph(
                                    `Open Ports: ${device.open_ports
                                        ? Object.entries(device.open_ports)
                                            .map(([port, desc]) => `Port ${port}: ${desc}`)
                                            .join(", ")
                                        : "(None)"
                                    }`
                                )
                            ]).flat()
                        ]
                        : []),
                    ...(data["Ad Scan"]
                        ? [
                            createHeading("Active Directory Scan", HeadingLevel.HEADING_1),
                            createTextParagraph(
                                `Timestamp: ${data["Ad Scan"]?.timestamp ?? "(Not specified)"}`
                            ),
                            ...(data["Ad Scan"].domain_controllers?.length
                                ? [
                                    createHeading("Domain Controllers", HeadingLevel.HEADING_2),
                                    ...data["Ad Scan"].domain_controllers.map((dc) =>
                                        createTextParagraph(dc)
                                    )
                                ]
                                : []),
                            ...(data["Ad Scan"].inactive_accounts?.length
                                ? [
                                    createHeading("Inactive Accounts", HeadingLevel.HEADING_2),
                                    ...data["Ad Scan"].inactive_accounts.map((acc) =>
                                        createTextParagraph(acc)
                                    )
                                ]
                                : []),
                            ...(data["Ad Scan"]["AD Users"]?.length
                                ? [
                                    createHeading("AD Users", HeadingLevel.HEADING_2),
                                    ...data["Ad Scan"]["AD Users"].map((user) =>
                                        createTextParagraph(
                                            `Name: ${user.name ?? "(Unknown)"}, Last Logon: ${user.last_logon ?? "(Not specified)"
                                            }`
                                        )
                                    )
                                ]
                                : []),
                            ...(data["Ad Scan"].Computers?.length
                                ? [
                                    createHeading("Computers", HeadingLevel.HEADING_1),
                                    ...data["Ad Scan"].Computers.map((comp, index) => [
                                        createHeading(`Computer ${index + 1}`, HeadingLevel.HEADING_2),
                                        createTextParagraph(`Name: ${comp.name ?? "(Not specified)"}`),
                                        createTextParagraph(`Host: ${comp.Host ?? "(Not specified)"}`),
                                        createTextParagraph(`OS: ${comp.os ?? "(Not specified)"}`),
                                        createTextParagraph(
                                            `OS Version: ${comp["os version"] ?? "(Not specified)"}`
                                        )
                                    ]).flat()
                                ]
                                : [])
                        ]
                        : [])
                ]
            }
        ]
    });
}

module.exports = { exportdoc };
