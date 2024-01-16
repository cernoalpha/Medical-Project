const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const PDFParser = require('pdf-parse');



const billOCR = async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).json({
            success: false, error: {
                message: 'File not received',
                code: 'FILE_NOT_RECEIVED'
            }
        });
    }
    const dataBuffer = req.file.buffer;
    const originalFileName = req.file.originalname;
    const fileExtension = originalFileName.split('.').pop();

    if (fileExtension === "pdf") {
        const pdfText = await extractPdfText(dataBuffer);
        processPDF(pdfText,res)
    }
    else if (fileExtension === 'jpeg' || fileExtension == 'jpg' || fileExtension === 'png' || fileExtension === 'bmp') {
        const base64Image = dataBuffer.toString('base64');
        processImage(base64Image, fileExtension, res);
    }
    else {
        res.status(400).json({
            success: false, error: {
                message: 'Invalid file type. Allowed file types are PDF, PNG, JPEG, JPG, BMP.',
                code: 'INVALID_FILE_TYPE'
            }
        });
    }
}



const processImage = async (base64Data, extension, res) => {

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const generationConfig = {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
        };

        const parts = [
            { text: "input: Read the medical details and fill in the given format" },
            { text: "output: \n{\n    \"patient\": {\n      \"patientName\": \"\",\n      \"patientId\": \"\",\n      \"gender\": \"\",\n      \"address\": \"\",\n      \"contact\": \"\"\n    },\n    \"bill\": {\n      \"billId\": \"\",\n      \"date\": \"\",\n      \"dueDate\": \"\",\n      \"billingAddress\": \"\"\n    },\n    \"insurance\": {\n      \"companyName\": \"\",\n      \"policyNumber\": \"\",\n      \"groupNumber\": \"\",\n      \"coverageDetails\": \"\"\n    },\n    \"services\": [\n      {\n        \"service\": \"\",\n        \"description\": \"\",\n        \"date\": \"\",\n        \"cptCode\": \"\",\n        \"charge\": \"\"\n      }\n    ],\n    \"charges\": {\n      \"total\": \"\",\n      \"insurancePayments\": \"\",\n      \"patientPayments\": \"\",\n      \"adjustments\": \"\"\n    },\n    \"provider\": {\n      \"name\": \"\",\n      \"address\": \"\",\n      \"contact\": \"\",\n      \"npi\": \"\"\n    }\n  }"},
            {
                inlineData: {
                    mimeType: `image/${extension}`,
                    data: base64Data
                }
            },
            { text: "input:\n Read the Bill details and fill in the given format" },

        ];

        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
        });
        const response = result.response;

        const text = response.text();
        res.json({ success: true, text });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

const processPDF = async (pdfData, res) => {

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: "output: \n{\n    \"patient\": {\n      \"patientName\": \"\",\n      \"patientId\": \"\",\n      \"gender\": \"\",\n      \"address\": \"\",\n      \"contact\": \"\"\n    },\n    \"bill\": {\n      \"billId\": \"\",\n      \"date\": \"\",\n      \"dueDate\": \"\",\n      \"billingAddress\": \"\"\n    },\n    \"insurance\": {\n      \"companyName\": \"\",\n      \"policyNumber\": \"\",\n      \"groupNumber\": \"\",\n      \"coverageDetails\": \"\"\n    },\n    \"services\": [\n      {\n        \"service\": \"\",\n        \"description\": \"\",\n        \"date\": \"\",\n        \"cptCode\": \"\",\n        \"charge\": \"\"\n      }\n    ],\n    \"charges\": {\n      \"total\": \"\",\n      \"insurancePayments\": \"\",\n      \"patientPayments\": \"\",\n      \"adjustments\": \"\"\n    },\n    \"provider\": {\n      \"name\": \"\",\n      \"address\": \"\",\n      \"contact\": \"\",\n      \"npi\": \"\"\n    }\n  }",
                },
                {
                    role: "model",
                    parts: "",
                },
            ],
            generationConfig: {
                temperature: 0.1,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
            },
        });

        const msg = pdfData +"\nRead the Bill details and fill in the given format";

        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, text });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function extractPdfText(pdfBuffer) {
    const data = await PDFParser(pdfBuffer);
    return data.text;
}

module.exports = { billOCR };