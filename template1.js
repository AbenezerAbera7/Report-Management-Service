const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');

function getDescription(audit_name) {
    const descriptions = {
        "Active Directory Scan": `Active Directory (AD) serves as the backbone for managing identities, access, and permissions within your organization. It is crucial to ensure its security, scalability, and performance to avoid issues like unauthorized access or downtime. This detailed review provides a snapshot of your AD configuration, highlighting areas of concern and offering recommendations for improvement. The results are visually represented, with easy-to-understand color coding for each aspect of the system's health and security.`,
        "Network Scan": `Your local network is the key to connecting all devices and systems within your organization. Ensuring the reliability, security, and speed of your network infrastructure is vital for maintaining smooth operations. This audit provides a comprehensive overview of your network's current state, from bandwidth usage to security protocols. Each section is color-coded for a clear, visual representation of performance and risk levels, allowing you to take the necessary steps to optimize your network.`,
        "On-Prem Scan": `On-premises servers are central to managing applications, data, and services within your organization. Their reliability, security, and maintenance play a crucial role in overall system uptime. This assessment focuses on the health and configuration of your servers, providing a detailed breakdown of key components such as storage, performance, and patching. The color-coded results make it easy to understand the current state and pinpoint areas requiring attention.`,
        "Microsoft 365 Scan": `Microsoft 365 is an essential suite for productivity, collaboration, and communication across your organization. Ensuring optimal configuration, security, and user management is key to leveraging its full potential. This audit provides an overview of your Microsoft 365 environment, assessing critical factors like licensing, security settings, and user access controls. Results are color-coded for easy identification of strengths and weaknesses, guiding you to enhance your Microsoft 365 setup.`,
        "BASE PLAN SUMMARY": "The results of each category of your base plan audit is summarized here using color coded boxes. Utilizing a weighted scoring system, the results were combined and averaged into an overall audit score. Individual category scores and details for each audit item are shown in subsequent pages. Your base monthly IT expense is shown as a range and has been converted into effective IT monthly expense based upon your audit score. This helps to level the playing field when comparing plans."
    };

    return descriptions[audit_name] || "Description not available for this name.";
}
function get_average(array) {
    const sum = array.reduce((acc, val) => acc + val, 0)
    const avg = (sum / array.length)
    const rounded_avg = avg.toPrecision(2)
    return parseFloat(rounded_avg)
}

function getColorAndScore(exportData) {
    const allcolorObj = {};
    let redandYellow = 0
    const risks = []

    for (const key in exportData) {
        const rectangles = exportData[key][0];
        const score = exportData[key][1]
        risks.push(parseFloat(score))


        const colors = rectangles.map(item => {
            if (item.color == 'red' || item.color == 'yellow') {
                redandYellow += 1
            }
            item.color
        }
        );
        allcolorObj[key] = colors;
    }

    return { allcolorObj, risks, redandYellow };
}
async function coverpage_template1(pdfDoc, organization, tenant_name, json_name, all_score, finance, street, address, webaddress, coverData) {

    // the first page customization
    const page1 = pdfDoc.getPages()[0];
    const { width, height } = page1.getSize();

    page1.drawText(organization, {
        x: 80,
        y: height - 350,
        size: 34,
        color: rgb(0, 0, 0),
        maxWidth: width - 120,
        lineHeight: 30,
    })

    page1.drawText(`${street || ''}`, {
        x: 80,
        y: height - 400,
        size: 14,
        color: rgb(0, 0, 0),
        maxWidth: width - 120,
        lineHeight: 30,
    })

    page1.drawText(`${address || ''}`, {
        x: 80,
        y: height - 430,
        size: 14,
        color: rgb(0, 0, 0),
        maxWidth: width - 120,
        lineHeight: 30,
    })

    page1.drawText(`${webaddress || ''}`, {
        x: 80,
        y: height - 460,
        size: 14,
        color: rgb(0, 0, 0),
        maxWidth: width - 120,
        lineHeight: 30,
    })

    const page4 = pdfDoc.getPages()[3];
    let x = 60
    let y = height - 300
    let color_var = 0
    const color_1 = rgb(0.9, 0.9, 0.9)
    const color_2 = rgb(0.85, 0.85, 0.85)
    Object.keys(coverData).map(async (incident, index) => {
        if (incident == "Active Directory Scan") {
            const color = color_var == 0 ? color_1 : color_2
            const adData = coverData["Active Directory Scan"]
            const imageBytes = fs.readFileSync('./images/ad.png');
            const image = await pdfDoc.embedPng(imageBytes)
            page4.drawRectangle({
                x: x - 30,
                y: y - 100,
                width: 180,
                height: 250,
                color: color
            })
            color_var = color_var == 0 ? 1 : 0

            page4.drawImage(image, {
                x: x,
                y: y,
                width: 100,
                height: 100
            });

            Object.keys(adData).map(key => {
                const includes = { 'AD Users': 'Users', 'orphaned_accounts_in_ad': 'Inactive Users', 'devices': 'Devices', 'domain_controllers': 'Domain Controllers', 'computers': "Computers" }
                if (key in includes) {
                    const _value = adData[key]
                    const _key = includes[key]
                    page4.drawText(`${_key}: ${_value}`, {
                        x: x,
                        y: y - 35,
                        size: 10,
                        color: rgb(0, 0, 0),
                        maxWidth: 100,
                        lineHeight: 12,
                    })
                    // vertical gap
                    y -= 10
                }
            })


            //horizontal gap
            x += 190
            y = height - 300
        }
        else if (incident == "Microsoft 365 Scan") {
            const Data = coverData["Microsoft 365 Scan"]
            const imageBytes = fs.readFileSync('./images/ms.png');
            const image = await pdfDoc.embedPng(imageBytes)

            const color = color_var == 0 ? color_1 : color_2
            page4.drawRectangle({
                x: x - 30,
                y: y - 100,
                width: 180,
                height: 250,
                color: color
            })
            color_var = color_var == 0 ? 1 : 0

            page4.drawImage(image, {
                x: x,
                y: y,
                width: 100,
                height: 100
            });

            Object.keys(Data).map(key => {
                const includes = { 'users': 'Users', 'orphaned_accounts_in_ms': 'Inactive Users' }
                if (key in includes) {
                    const _value = Data[key]
                    const _key = includes[key]
                    page4.drawText(`${_key}: ${_value}`, {
                        x: x,
                        y: y - 35,
                        size: 10,
                        color: rgb(0, 0, 0),
                        maxWidth: 100,
                        lineHeight: 12,
                    })
                    // vertical gap
                    y -= 10
                }
            })

            y = height - 300
            x += 190

        }
        else if (incident == "Network Scan") {
            const Data = coverData["Network Scan"]
            const imageBytes = fs.readFileSync('./images/nt.png');
            const image = await pdfDoc.embedPng(imageBytes)

            const color = color_var == 0 ? color_1 : color_2
            page4.drawRectangle({
                x: x - 30,
                y: y - 100,
                width: 180,
                height: 250,
                color: color
            })
            color_var = color_var == 0 ? 1 : 0

            page4.drawImage(image, {
                x: x,
                y: y,
                width: 100,
                height: 100
            });

            Object.keys(Data).map(key => {
                const includes = { 'device_type_Router': 'Devices' }
                if (key in includes) {
                    const _value = Data[key][1]
                    const _key = includes[key]
                    page4.drawText(`${_key}: ${_value}`, {
                        x: x,
                        y: y - 35,
                        size: 10,
                        color: rgb(0, 0, 0),
                        maxWidth: 100,
                        lineHeight: 12,
                    })
                    // vertical gap
                    y -= 10
                }
            })

            y = height - 300
            x += 190


        }
    })

    page4.drawText(`${all_score || ''}`, {
        x: 80,
        y: 250,
        size: 100,
        color: rgb(1, 1, 1),
        maxWidth: width - 120,
        lineHeight: 30,
    })

    page4.drawText(`${finance || ''}`, {
        x: 110,
        y: 95,
        size: 74,
        color: rgb(1, 0, 0),
        maxWidth: width - 120,
        lineHeight: 30,
    })

}
async function template1(organization, tenant_name, json_name, exportdata, coverData) {
    const existingPdfBytes = fs.readFileSync('Template1.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const { allcolorObj, risks, redandYellow } = getColorAndScore(exportdata)
    const all_score = get_average(risks)
    const audit_names = Object.keys(exportdata).map(key => key)
    const finance = redandYellow * 425
    coverpage_template1(pdfDoc, organization, tenant_name, json_name, all_score, finance, '', '', '', coverData)
    Object.keys(exportdata).map(key => {
        const audit_name = key
        const rectanglesData = exportdata[key][0]
        const score = exportdata[key][1]
        template1_modifyPDF(pdfDoc, "AUDIT DETAIL", audit_name, rectanglesData, score, audit_names);
    })
    const pdfBytes = await pdfDoc.save();
    return pdfBytes
}

async function template1_modifyPDF(pdfDoc, header, audit_name, rectanglesData, score, audit_names) {

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const newPage1 = pdfDoc.addPage([width, height]);
    const newPage = pdfDoc.addPage([width, height]);
    footer(newPage1)
    footer(newPage)
    const container1Width = width * 0.6;
    const container2Width = width * 0.4;
    const xOffset1 = 30;
    const top1 = 200
    const yOffset1 = height - top1;

    const xOffset2 = container1Width + xOffset1 + 15;
    const yOffset2 = height - 50;

    newPage1.drawText(audit_name, {
        x: xOffset1 + 5,
        y: height - 100,
        size: 24,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
        lineHeight: 14,
    });
    newPage1.drawText("Why is it important?", {
        x: xOffset1 + 5,
        y: height - 150,
        size: 18,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
        lineHeight: 14,
    });
    const description = getDescription(audit_name)
    newPage1.drawText(description, {
        x: xOffset1 + 5,
        y: height - 200,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
        lineHeight: 16,
    });


    let colorObj = []
    rectanglesData.forEach((data, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;

        const x = xOffset1 + 10 + col * 180;
        const y = yOffset1 - row * 160;
        colorObj.push(data.color)
        template1_drawNestedRectangle(newPage, x, y, 10, 10, data.outerText, data.innerListItems, data.color);
        if (index == rectanglesData.length - 1) {
            showscorebar(newPage, xOffset1, y - 150, width - 30, 15, score)
        }

    });
}

async function template1_drawNestedRectangle(page, x, y, padx, pady, outerText, innerListItems, color) {
    const outerRw = 170
    const outerRh = 150;

    let color_rgb = [];
    if (color === 'yellow') {
        color_rgb = rgb(0.9922, 0.7255, 0.0745);
    } else if (color === 'green') {
        color_rgb = rgb(0, 0.5059, 0.2627);
    } else {
        color_rgb = rgb(0.8431, 0.098, 0.1255);
    }

    page.drawRectangle({
        x: x - 10,
        y: y - 10,
        width: outerRw + 20,
        height: outerRh + 20,
        color: rgb(1, 1, 1),
    });


    // Draw the outer rectangle
    page.drawRectangle({
        x: x,
        y: y,
        width: outerRw,
        height: outerRh,
        color: color_rgb
    });

    // The inner rectangle should be placed at the bottom of the outer rectangle
    const innerRw = outerRw - 2 * padx; // Inner rectangle width
    const innerRh = parseInt(outerRh * 0.7);
    const innerX = x + padx;
    const innerY = y + 10; // Position the inner rectangle at the bottom with pady padding

    // Draw the inner rectangle
    page.drawRectangle({
        x: innerX,
        y: innerY,
        width: innerRw,
        height: innerRh,
        color: rgb(1, 1, 1) // White
    });

    // Draw the outer text at the top of the outer rectangle
    page.drawText(outerText, {
        x: x + 5,
        y: y + outerRh - 15,  // Adjust the Y position so the text appears near the top
        size: 10,
        color: rgb(1, 1, 1),  // White text
        maxWidth: outerRw - 10,
        lineHeight: 12,
    });

    // Draw the list items inside the inner rectangle
    let listY = innerY + innerRh - 10;
    let listItemSpacing = 15;

    innerListItems.forEach((item, index) => {
        page.drawText(`${index + 1}. ${item}`, {
            x: innerX + 5,
            y: listY,
            size: 8,
            color: rgb(0, 0, 0),  // Black text
            maxWidth: innerRw - 5,
            lineHeight: 12
        });
        listY -= listItemSpacing;

    });
}

async function footer(page) {
    const foot = `Business Technology Solutions Group |`
    page.drawText(foot, {
        x: 60,
        y: 10,
        size: 11,
        color: rgb(0, 0, 0),
        lineHeight: 12,
    })

}

async function showscorebar(page, x, y, w, h, score) {
    const numStep = 100;


    // Draw the score bar
    for (let i = 0; i < numStep; i++) {
        const risk = i / (numStep - 1);

        let red, green, blue;
        if (risk < 0.5) {
            red = risk * 2;
            green = 1;
            blue = 0;
        } else {
            red = 1;
            green = 1 - (risk - 0.5) * 2; // Adjust green to smoothly decrease
            blue = 0;
        }

        // Interpolate the final green to be the ultimate green (0, 129, 67)
        green = green * (129 / 255); // Adjusting to the desired green (0, 129, 67)

        page.drawRectangle({
            x: x + (i * (w - 30)) / numStep,
            y: y,
            width: (w - 30) / numStep,
            height: h, // Correctly set height instead of using y here
            color: rgb(red, green, blue)
        });
    }

    // Determine the color for the score based on its value
    let scoreRed, scoreGreen, scoreBlue;
    const scoreRisk = score / 100; // Assuming the score is between 0 and 100

    if (scoreRisk < 0.5) {
        scoreRed = scoreRisk * 2;
        scoreGreen = 1;
        scoreBlue = 0;
    } else {
        scoreRed = 1;
        scoreGreen = 2 - scoreRisk * 2;
        scoreBlue = 0;
    }
    // Draw the score value at the exact x location with the appropriate color
    page.drawText(score.toString(), {
        x: x + (scoreRisk * w) - 30,  // The position for the score based on its value
        y: y + h + 5,  // Position the score text just below the bar
        size: 24,
        color: rgb(scoreRed, scoreGreen, scoreBlue),  // Score color
        lineHeight: 14
    });

    // label
    page.drawRectangle({
        x: x + 30,
        y: y + h + 70,
        width: 10,
        height: 10,
        color: rgb(1, 0, 0), // red background
    });
    page.drawText("Requires Immediate Attention", {
        x: x + 45,
        y: y + h + 72,
        size: 8,
        color: rgb(0, 0, 0),
        lineHeight: 14
    });
    page.drawRectangle({
        x: x + w / 2 - 20,
        y: y + h + 70,
        width: 10,
        height: 10,
        color: rgb(1, 1, 0), // yellow background
    });
    page.drawText("Needs Improvement", {
        x: x + w / 2,
        y: y + h + 72,
        size: 8,
        color: rgb(0, 0, 0),
        lineHeight: 14
    });

    page.drawRectangle({
        x: w - 50,
        y: y + h + 70,
        width: 10,
        height: 10,
        color: rgb(0, 0.5059, 0.2627)


    });
    page.drawText("Satisfactory", {
        x: w - 35,
        y: y + h + 72,
        size: 8,
        color: rgb(0, 0, 0),
        lineHeight: 14
    });

    //audit score
    page.drawLine({
        start: { x: x, y: y + h + 40 },
        end: { x: x + 240, y: y + h + 40 },
        thickness: 1,
        color: rgb(0, 0, 0),
        // Black text

    });

    page.drawText("AUDIT SCORE", {
        x: x + 247,
        y: y + h + 35,
        size: 12,
        color: rgb(0, 0, 0),
        lineHeight: 12
    });
    page.drawLine({
        start: { x: x + 335, y: y + h + 40 },
        end: { x: w, y: y + h + 40 },
        thickness: 1,
        color: rgb(0, 0, 0),
        // Black text
    });
    page.drawText("0", {
        x: x,
        y: y - h - 5,
        size: 12,
        color: rgb(0, 1, 0),
        lineHeight: 14
    });
    page.drawText("100", {
        x: w,
        y: y - h - 5,
        size: 12,
        color: rgb(1, 0, 0),
        lineHeight: 14
    });
    page.drawText("50", {
        x: x + w / 2,
        y: y - h - 5,
        size: 12,
        color: rgb(1, 1, 0),
        lineHeight: 14
    });
}

module.exports = { template1 }