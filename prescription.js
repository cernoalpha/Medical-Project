const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const PDFParser = require('pdf-parse');



const prescriptionOCR = async (req, res) => {
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

    if (fileExtension == "pdf") {
        const pdfText = await extractPdfText(dataBuffer);
        processPDF(pdfText,res)
    }
    else if (fileExtension == 'jpeg' || fileExtension == 'jpg' || fileExtension == 'png' || fileExtension == 'bmp') {
        const base64Image = dataBuffer.toString('base64');
        processImage(base64Image, fileExtension, res);
    }
    else {
        res.status(400).json({
            success: false, error: {
                message: 'Incorrect file type',
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
            { text: "output: {\n    \"Hospital\": \"\",\n    \"Doctor_name\":\"\",\n    \"Date\": \"\",\n    \"Gender\": \"\",\n    \"Age\": \"\",\n    \"Patient_name\": \"\",\n    \"Medications\": [\n        {\n            \"Name\": \"\",\n            \"Dose\": \"\",\n            \"Duration\": \"\"\n        }\n    ]\n}" },
            // {text: "output: {\n    \"Hospital\": \"\",\n    \"Date\": \"\",\n    \"Gender\": \"\",\n    \"Age\": \"\",\n    \"Patient_name\": \"\",\n    \"Medications\": [\n        {\n            \"Name\": \"\",\n            \"Dose\": \"\",\n            \"Duration\": \"\"\n        }\n    ]\n}"},
            {
                inlineData: {
                    mimeType: `image/${extension}`,
                    data: base64Data
                }
            },
            { text: "input:\n Read the medical details and fill in the given format" },

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
                    parts: "output: {\n    \"Hospital\": \"\",\n    \"Doctor_name\":\"\",\n    \"Date\": \"\",\n    \"Gender\": \"\",\n    \"Age\": \"\",\n    \"Patient_name\": \"\",\n    \"Medications\": [\n        {\n            \"Name\": \"\",\n            \"Dose\": \"\",\n            \"Duration\": \"\"\n        }\n    ]\n}",
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

        const msg = pdfData +"\nRead the medical details and fill in the given format";

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

module.exports = { prescriptionOCR };