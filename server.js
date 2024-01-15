const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');//extras
require('dotenv').config();

const app = express();
app.use(express.static('public')); //extras
const PORT = process.env.PORT || 5001;


app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(express.json());
const upload = multer();


const { prescriptionOCR } = require('./services/prescription');
const { reportAnalysis } = require('./services/report');


app.post("/prescription",upload.single('prescription'),prescriptionOCR)
app.post("/report",upload.single('report'),reportAnalysis)
app.get('/health', (req, res) => {
    res.status(200).contentType('text/plain').send('Server Shaddy Med is healthy 😀🥳');
});


//extras
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath);
});
app.get('/r',(req, res) => {
    const indexPath = path.join(__dirname, 'public', 'report.html');
    res.sendFile(indexPath);
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});