const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const PDFParser = require('pdf-parse');


const insuranceAnalysis = async (req,res) => {
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
        const pdfText = await extractPdfText(dataBuffer,res);
        processPDF(pdfText,res)
    }
    else {
        res.status(400).json({
            success: false, error: {
                message: 'Invalid file type. Only PDF files are allowed.',
                code: 'INVALID_FILE_TYPE'
            }
        });
    }
}

const processPDF= async (reportData,res) =>{
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts:"output: \n {\n    \"policyHolder\": {\n      \"policyHolderName\": \"\",\n      \"policyHolderId\": \"\",\n      \"dob\": \"\",\n      \"gender\": \"\",\n      \"contact\": \"\",\n      \"address\": \"\"\n    },\n    \"policy\": {\n      \"policyNumber\": \"\",\n      \"startDate\": \"\",\n      \"endDate\": \"\",\n      \"coverageType\": \"\",\n      \"coverageDetails\": {\n        \"inpatient\": \"\",\n        \"outpatient\": \"\",\n        \"prescriptionCoverage\": \"\"\n      },\n      \"deductible\": \"\",\n      \"coPay\": {\n        \"inpatient\": \"\",\n        \"outpatient\": \"\"\n      },\n      \"maxCoverageAmount\": \"\"\n    },\n    \"dependents\": [\n      {\n        \"dependentName\": \"\",\n        \"relation\": \"\",\n        \"dob\": \"\"\n      }\n    ],\n    \"insuranceProvider\": {\n      \"providerName\": \"\",\n      \"contact\": \"\",\n      \"address\": \"\"\n    }\n  }",
                },
                {
                    role: "model",
                    parts: "",
                },
            ],
            generationConfig: {
                temperature: 0.5,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
            },
        });

        const msg = reportData +"\nRead the insurance details and fill in the given format";

        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = response.text();
        res.json({ success: true, text });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}



async function extractPdfText(pdfBuffer,res) {
    try{
        const data = await PDFParser(pdfBuffer);
        return data.text;
    }catch(error){
        res.status(500).json({ success: false, error: error.message });
    }
   
}

module.exports = { insuranceAnalysis }
