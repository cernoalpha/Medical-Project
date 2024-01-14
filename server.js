const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(express.static('public')); //extras
const PORT = process.env.PORT || 5001;


app.use(bodyParser.json({ limit: '10mb' }));
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
const upload = multer();


const { prescriptionOCR } = require('./prescription');


app.post("/pres",upload.single('prescription'),prescriptionOCR)
app.get('/health', (req, res) => {
    res.status(200).contentType('text/plain').send('Server Shaddy Med is healthy 😀🥳');
});


app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath);
});




app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});