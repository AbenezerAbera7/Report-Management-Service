const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const { template1 } = require('./template1')

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

async function drawNestedRectangle(page, x, y, padx, pady, outerText, innerListItems, color) {
    const outerRw = 109 // Width of the outer rectangle
    const outerRh = 150; // Height of the outer rectangle

    let color_rgb = [];
    if (color === 'yellow') {
        color_rgb = rgb(0.9922, 0.7255, 0.0745);  // Yellow RGB (normalized to [0, 1])
    } else if (color === 'green') {
        color_rgb = rgb(0, 0.5059, 0.2627);    // Green RGB (normalized to [0, 1])
    } else {
        color_rgb = rgb(0.8431, 0.098, 0.1255);   // Default to red RGB (normalized to [0, 1])
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

async function drawMiniRectagular(page, audit_name, audit_names, colorObj) {

    const width = 20
    const height = 20;
    let xOffset2 = 410
    let yOffset2 = 550
    for (let index = 0; index < audit_names.length; index++) {
        const name = audit_names[index];
        const row = Math.floor(index / 2);  // Determine the row (0, 1, or 2)
        const col = index % 2;  // Determine the column (0, 1, or 2)
        //grid for placing grouped boxes
        const xs = xOffset2 + 10 + col * 100
        const ys = yOffset2 - 200 - row * 100

        page.drawText(name, {
            x: xs,
            y: ys + 30,  // Adjust the Y position so the text appears near the top
            size: 8,
            color: rgb(0, 0, 0),
            maxWidth: 60,
            lineHeight: 12,
        });


        for (let index2 = 0; index2 < colorObj.length; index2++) {
            const row2 = Math.floor(index2 / 3);  // Determine the row (0, 1, or 2)
            const col2 = index2 % 3;  // Determine the column (0, 1, or 2)
            //grid for placing box in group box
            const xss = xs + 10 + col2 * 21
            const yss = ys - 10 - row2 * 21

            let color_rgb = [];
            const color = colorObj[index2]

            if (name == audit_name) {

                if (color === 'yellow') {
                    color_rgb = rgb(0.9922, 0.7255, 0.0745);  // Yellow RGB (normalized to [0, 1])
                } else if (color === 'green') {
                    color_rgb = rgb(0, 0.5059, 0.2627);    // Green RGB (normalized to [0, 1])
                } else {
                    color_rgb = rgb(0.8431, 0.098, 0.1255);   // Default to red RGB (normalized to [0, 1])
                }
            } else {
                color_rgb = rgb(0.94, 0.94, 0.94)
            }


            page.drawRectangle({
                x: xss,
                y: yss,
                width: width,
                height: height,
                color: color_rgb
            });
        }

    }


}

async function DrawSummary(pdfDoc, allcolorObj, score) {
    const header = "Summary"
    const audit_name = "BASE PLAN SUMMARY"
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const newPage = pdfDoc.addPage([width, height]);
    const container1Width = width * 0.6;
    const container2Width = width * 0.4;
    const xOffset1 = 30;  // Starting x position for the first container
    const top1 = 0
    const yOffset1 = height - top1;  // Starting y position for the first container (adjusted)

    const xOffset2 = container1Width + xOffset1 + 15;  // Starting x position for the second container
    const yOffset2 = height - 200;  // Starting y position for the second container (adjusted)

    newPage.drawLine({
        start: { x: xOffset1 - 10, y: yOffset1 + top1 - 65 },
        end: { x: xOffset1 + container1Width + 10, y: yOffset1 + top1 - 65 },
        thickness: 15,
        color: rgb(0.39, 0.39, 0.4),
    });

    newPage.drawRectangle({
        x: xOffset1 - 10,
        y: 0,//bottom
        width: container1Width + 20,
        height: height - 70,
        color: rgb(0.84, 0.85, 0.86), // Light grey background

    });

    // Draw the second container (40% width)
    newPage.drawRectangle({
        x: xOffset2,
        y: 0,
        width: container2Width - 45,
        height: height - 5,
        color: rgb(1, 1, 1), // White background

    });
    newPage.drawText(header, {
        x: xOffset1,
        y: height - 50,  // Adjust the Y position so the text appears near the top
        size: 24,
        color: rgb(0.66, 0.66, 0.66),  // White text
        maxWidth: container1Width - 20,
        lineHeight: 12
    });


    newPage.drawText(audit_name, {
        x: xOffset1,
        y: height - 100,  // Adjust the Y position so the text appears near the top
        size: 24,
        color: rgb(0, 0, 0),  // White text
        maxWidth: container1Width - 20,
        lineHeight: 12
    });
    const audit_names = Object.keys(allcolorObj)
    const allcolorObj_length = Object.keys(allcolorObj).length
    for (let index = 0; index < allcolorObj_length; index++) {
        const name = audit_names[index];
        const row = Math.floor(index / 2);  // Determine the row (0, 1, or 2)
        const col = index % 2;  // Determine the column (0, 1, or 2)
        //grid for placing grouped boxes
        const xs = xOffset1 + 10 + col * 200
        const ys = yOffset1 - 200 - row * 200

        newPage.drawText(name, {
            x: xs + 10,
            y: ys + 40,  // Adjust the Y position so the text appears near the top
            size: 12,
            color: rgb(0, 0, 0),
            maxWidth: 150,
            lineHeight: 12,
        });

        const boxnumber = 9
        for (let index2 = 0; index2 < boxnumber; index2++) {
            const row2 = Math.floor(index2 / 3);  // Determine the row (0, 1, or 2)
            const col2 = index2 % 3;  // Determine the column (0, 1, or 2)
            //grid for placing box in group box
            const xss = xs + 10 + col2 * 42
            const yss = ys - 10 - row2 * 42

            let color_rgb = [];
            let color
            try {
                color = allcolorObj[name][index2]
            } catch {

            }

            if (color) {

                if (color === 'yellow') {
                    color_rgb = rgb(0.9922, 0.7255, 0.0745);  // Yellow RGB (normalized to [0, 1])
                } else if (color === 'green') {
                    color_rgb = rgb(0, 0.5059, 0.2627);    // Green RGB (normalized to [0, 1])
                } else {
                    color_rgb = rgb(0.8431, 0.098, 0.1255);   // Default to red RGB (normalized to [0, 1])
                }
            } else {

                color_rgb = rgb(0.94, 0.94, 0.94)
            }


            newPage.drawRectangle({
                x: xss,
                y: yss,
                width: 40,
                height: 40,
                color: color_rgb
            });
            if (index == allcolorObj_length - 1 && index2 == boxnumber - 1) {
                showscorebar(newPage, xOffset1, yss - 150, container1Width, 15, score)
            }
        }


    }


    const description = getDescription(audit_name)
    newPage.drawText(description, {
        x: xOffset2 + 10,
        y: height - 80,  // Adjusted Y position
        size: 8,
        color: rgb(0, 0, 0),  // Black text
        maxWidth: container2Width - 70,  // Allow the text to wrap within the container width
        lineHeight: 14
    });

    newPage.drawText(audit_name, {

        x: xOffset2 + 10,
        y: height - 65,  // Adjusted Y position
        size: 12,
        color: rgb(0, 0, 0),  // Black text
        maxWidth: container2Width - 20,  // Allow the text to wrap within the container width
        lineHeight: 14
    });
    newPage.drawLine({
        start: { x: xOffset2 + 10, y: height - 69 },
        end: { x: xOffset2 + container2Width - 50, y: height - 69 },
        thickness: 1,
        color: rgb(0, 0, 0),
        // Black text

    });



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
            x: x + (i * w) / numStep,
            y: y,
            width: w / numStep,
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
        x: x,
        y: y + h + 70,
        width: 10,
        height: 10,
        color: rgb(1, 0, 0), // red background
    });
    page.drawText("Requires Immediate Attention", {
        x: x + 15,
        y: y + h + 72,
        size: 8,
        color: rgb(0, 0, 0),
        lineHeight: 14
    });
    page.drawRectangle({
        x: x + 150,
        y: y + h + 70,
        width: 10,
        height: 10,
        color: rgb(1, 1, 0), // yellow background
    });
    page.drawText("Needs Improvement", {
        x: x + 165,
        y: y + h + 72,
        size: 8,
        color: rgb(0, 0, 0),
        lineHeight: 14
    });

    page.drawRectangle({
        x: x + 300,
        y: y + h + 70,
        width: 10,
        height: 10,
        color: rgb(0, 0.5059, 0.2627)


    });
    page.drawText("Satisfactory", {
        x: x + 315,
        y: y + h + 72,
        size: 8,
        color: rgb(0, 0, 0),
        lineHeight: 14
    });

    //audit score
    page.drawLine({
        start: { x: x, y: y + h + 40 },
        end: { x: x + 140, y: y + h + 40 },
        thickness: 1,
        color: rgb(0, 0, 0),
        // Black text

    });

    page.drawText("AUDIT SCORE", {
        x: x + 147,
        y: y + h + 35,
        size: 12,
        color: rgb(0, 0, 0),
        lineHeight: 12
    });
    page.drawLine({
        start: { x: x + 235, y: y + h + 40 },
        end: { x: 395, y: y + h + 40 },
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
        x: x + w - 15,
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

    page.drawLine({
        start: { x: x - 10, y: y - h - 20 },
        end: { x: x + w + 10, y: y - h - 20 },
        thickness: 15,
        color: rgb(0.39, 0.39, 0.4),
    });
    page.drawRectangle({
        x: x - 11,
        y: 0,
        width: x + w + 11,
        height: y - h - 24,
        color: rgb(1, 1, 1)
    });
}

async function modifyPDF(pdfDoc, header, audit_name, rectanglesData, score, audit_names) {
    //header should be 'AUDIT SUMMARY or AUDIT DETAIL
    // audit names should be 'Active Directory Scan', "Ms 365 Scan", 'Network Scan', 'On-Prem Scan'

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const newPage = pdfDoc.addPage([width, height]);
    const container1Width = width * 0.6;
    const container2Width = width * 0.4;
    const xOffset1 = 30;  // Starting x position for the first container
    const top1 = 300
    const yOffset1 = height - top1;  // Starting y position for the first container (adjusted)

    const xOffset2 = container1Width + xOffset1 + 15;  // Starting x position for the second container
    const yOffset2 = height - 200;  // Starting y position for the second container (adjusted)

    newPage.drawLine({

        start: { x: xOffset1 - 10, y: yOffset1 + top1 - 65 },
        end: { x: xOffset1 + container1Width + 10, y: yOffset1 + top1 - 65 },
        thickness: 15,
        color: rgb(0.39, 0.39, 0.4),
        // Black text

    });
    newPage.drawRectangle({
        x: xOffset1 - 10,
        y: 0,//bottom
        width: container1Width + 20,
        height: height - 70,
        color: rgb(0.84, 0.85, 0.86), // Light grey background

    });

    // Draw the second container (40% width)
    newPage.drawRectangle({
        x: xOffset2,
        y: 0,
        width: container2Width - 45, //45=30+15 padding of container 1 and 2 respectively
        height: height - 5,
        color: rgb(1, 1, 1), // White background

    });
    newPage.drawText(header, {
        x: xOffset1,
        y: height - 50,  // Adjust the Y position so the text appears near the top
        size: 24,
        color: rgb(0.66, 0.66, 0.66),  // White text
        maxWidth: container1Width - 20,
        lineHeight: 12
    });


    newPage.drawText(audit_name, {
        x: xOffset1,
        y: height - 100,  // Adjust the Y position so the text appears near the top
        size: 24,
        color: rgb(0, 0, 0),  // White text
        maxWidth: container1Width - 20,
        lineHeight: 12
    });

    // Loop through the rectanglesData to add each one to the first container
    let colorObj = []
    rectanglesData.forEach((data, index) => {
        const row = Math.floor(index / 3);  // Determine the row (0, 1, or 2)
        const col = index % 3;  // Determine the column (0, 1, or 2)

        const x = xOffset1 + 10 + col * 119;  // Space rectangles horizontally within the first container
        const y = yOffset1 - row * 160;  // Space rectangles vertically within the first container
        colorObj.push(data.color)
        drawNestedRectangle(newPage, x, y, 10, 10, data.outerText, data.innerListItems, data.color);

        if (index == 0) {
            const xs = xOffset2 + 10 + col * 21
            const ys = yOffset2 - 200 - row * 21


        }
        if (index == rectanglesData.length - 1) {
            showscorebar(newPage, xOffset1, y - 120, container1Width, 15, score)
            drawMiniRectagular(newPage, audit_name, audit_names, colorObj)
        }
    });
    const description = getDescription(audit_name)
    newPage.drawText(description, {
        x: xOffset2 + 10,
        y: height - 80,  // Adjusted Y position
        size: 8,
        color: rgb(0, 0, 0),  // Black text
        maxWidth: container2Width - 70,  // Allow the text to wrap within the container width
        lineHeight: 14
    });

    newPage.drawText(audit_name, {

        x: xOffset2 + 10,
        y: height - 65,  // Adjusted Y position
        size: 12,
        color: rgb(0, 0, 0),  // Black text
        maxWidth: container2Width - 20,  // Allow the text to wrap within the container width
        lineHeight: 14
    });
    newPage.drawLine({
        start: { x: xOffset2 + 10, y: height - 69 },
        end: { x: xOffset2 + container2Width - 50, y: height - 69 },
        thickness: 1,
        color: rgb(0, 0, 0),
        // Black text

    });

}
function get_average(array) {
    const sum = array.reduce((acc, val) => acc + val, 0)
    const avg = (sum / array.length)
    const rounded_avg = avg.toPrecision(2)
    return parseFloat(rounded_avg)
}

function getColorAndScore(exportData) {
    const allcolorObj = {};
    const risks = []

    for (const key in exportData) {
        const rectangles = exportData[key][0];
        const score = exportData[key][1]
        risks.push(parseFloat(score))


        const colors = rectangles.map(item => item.color);
        allcolorObj[key] = colors;
    }

    return { allcolorObj, risks };
}

async function coverpage(pdfDoc, organization, tenant_name, json_name) {


    // the first page customization
    const page1 = pdfDoc.getPages()[0];
    const { width, height } = page1.getSize();

    page1.drawText(organization, {
        x: width / 2 + 8,
        y: 150,
        size: 24,
        color: rgb(0, 0, 0),
        maxWidth: 250,
        lineHeight: 30,
    })


    //the 3rd page customization
    const page3 = pdfDoc.getPages()[2];
    const today = new Date()
    const reportDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`.toUpperCase()

    page3.drawText(organization, {
        x: 70,
        y: height - 230,
        size: 24,
        color: rgb(0.6, 0.6, 0.6),
        lineHeight: 12,
    })
    page3.drawText(json_name, {
        x: 70,
        y: height - 278,
        size: 24,
        color: rgb(0.6, 0.6, 0.6),
        lineHeight: 12,
    })
    page3.drawText(reportDate, {
        x: 70,
        y: height - 334,
        size: 24,
        color: rgb(0.6, 0.6, 0.6),
        lineHeight: 12,
    })

}

async function template_test(organization, tenant_name, json_name, exportdata) {
    const existingPdfBytes = fs.readFileSync('Template1.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    coverpage(pdfDoc, organization, tenant_name, json_name)

    const { allcolorObj, risks } = getColorAndScore(exportdata)
    const all_score = get_average(risks)
    const audit_names = Object.keys(exportdata).map(key => key)
    DrawSummary(pdfDoc, allcolorObj, all_score)
    Object.keys(exportdata).map(key => {
        const audit_name = key
        const rectanglesData = exportdata[key][0]
        const score = exportdata[key][1]
        modifyPDF(pdfDoc, "AUDIT DETAIL", audit_name, rectanglesData, score, audit_names);

    })

    const pdfBytes = await pdfDoc.save();
    return pdfBytes
}

async function PDFWriter(exportdata, organization, tenant_name, json_name, template_id, coverData) {
    let pdfByte
    if (template_id == 1) {
        const pdfBytes = template1(organization, tenant_name, json_name, exportdata, coverData)
        return pdfBytes
    }
    if (template_id == 3) {
        const pdfBytes = template_test(organization, tenant_name, json_name, exportdata)
        return pdfBytes
    }



}

module.exports = { PDFWriter }