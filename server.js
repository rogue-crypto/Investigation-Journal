const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const port = 6800; 
require('dotenv').config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/get-question', async (req, res) => {
    const topic = req.query.topic;
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }
    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Generate a research question for an 8th grade science project on the topic of ${topic}. The question should be simple, specific, and related to physics, chemistry, or biology. Do not write 'Research Question:' before the actual research question.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const question = text.replace('## ', '').replace(/\*\*/g, '');
        res.json({ question });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Failed to fetch research question. Please try again.' });
    }
});
app.post('/submit-answers', async (req, res) => {
    const { researchQuestion, independent, dependent, control1, control2, hypothesis, materials, safety1, safety2 } = req.body;
    if (!researchQuestion || !independent || !dependent || !control1 || !control2 || !hypothesis || !materials || !safety1 || !safety2) {
        return res.status(400).json({ message: 'Please fill out all fields.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Check the related variables and hypothesis of the prompted research question. Do not check the research question itself. The hypothesis should be in the if-then-because format:\n\nResearch Question: ${researchQuestion}\n\nIndependent Variable: ${independent}\nDependent Variable: ${dependent}\nControlled Variable 1: ${control1}\nControlled Variable 2: ${control2}\nHypothesis: ${hypothesis}\nMaterials: ${materials}\nSafety Measure 1: ${safety1}\nSafety Measure 2: ${safety2}\nGive feedback to help improve this. Do this in 200-250 words.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const formattedResponse = responseText
            .replace(/## /g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*\s*/g, '');

        res.json({ message: formattedResponse });
    } catch (error) {
        console.error('Error validating answers:', error);
        res.status(500).json({ error: 'Failed to validate answers. Please try again.' });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
