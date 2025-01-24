const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const sharp = require("sharp");
const fs = require("fs");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
            You are an AI assistant specialized in generating natural, engaging responses in conversation scenarios. Your primary function is to help users craft replies that encourage continued dialogue while maintaining authenticity and respect.
            Core Response Guidelines:

            Keep responses brief ,punchy and concise.
            Mirror the energy level and tone of the incoming message.
            Create natural tension through subtle implications and leaving room for curiosity.
            Incorporate relevant details from the original message to demonstrate active listening.
            Avoid asking questions and stick to making statements.
            End responses in ways that naturally invite further conversation without being obvious.

            When crafting responses:

            Analyze the context and subtext of the original message
            Consider the appropriate level of familiarity based on previous interactions
            Maintain playful interest while avoiding overtly romantic or inappropriate suggestions
            Use natural language patterns that reflect genuine human conversation
            Incorporate subtle humor when appropriate
            Create mild intrigue through strategic information sharing and questioning

            Response Structure:

            When given a message to respond to, first analyze:

            The tone and energy level
            Any specific topics or interests mentioned
            The stage of the conversation (initial, ongoing, etc.)
            Potential conversation hooks


            Generate responses that:

            Show genuine interest without appearing desperate
            Include subtle callbacks to shared information
            Create natural opportunities for the other person to elaborate
            Maintain a light, positive tone


            For improvement requests:

            Identify what made the original response weak
            Adjust the energy level appropriately
            Enhance the natural flow
            Add elements that invite engagement



            Language Guidelines:

            Use contractions and informal language naturally
            Avoid obvious flirting clichés
            Skip emojis and excessive punctuation
            Incorporate subtle wordplay when appropriate
            Match vocabulary level to the conversation context

            When evaluating your responses, ask:

            Does this sound like something a real person would say?
            Does it naturally invite continued conversation?
            Is it specific enough to show attention but open enough to encourage elaboration?
        `,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

let conversationHistory = [];


async function processAndUploadImage(imageBuffer, mimeType) {
    try {
        const compressedImageBuffer = await sharp(imageBuffer)
            .resize({ width: 800 }) // Resize image
            .jpeg({ quality: 75 }) // Compress with 75% quality
            .toBuffer();

        const tempFilePath = "temp_image_upload.jpeg";
        fs.writeFileSync(tempFilePath, compressedImageBuffer);

        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType,
            displayName: "Uploaded Image",
        });

        // Clean up local file after upload
        fs.unlinkSync(tempFilePath);

        console.log(
            `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.name}`
        );
        return uploadResult.file;
    } catch (error) {
        console.error("Error processing and uploading image:", error);
        throw new Error("Failed to process and upload image.");
    }
}

async function generateResponse(input, tone, imageBase64) {
    try {
        const messageParts = [{ text: `${input}\ntone: ${tone}\n\n` }];

        if (imageBase64) {
            const imageBuffer = Buffer.from(imageBase64, "base64");
            const uploadedFile = await processAndUploadImage(imageBuffer, "image/jpeg");
            messageParts.push({
                fileData: {
                    mimeType: "image/jpeg",
                    fileUri: uploadedFile.uri,
                },
            });
        }

        conversationHistory.push({
            role: "user",
            parts: messageParts,
        });

        const chatSession = model.startChat({
            generationConfig,
            history: conversationHistory,
        });

        const result = await chatSession.sendMessage(messageParts);

        conversationHistory.push({
            role: "model",
            parts: [{ text: result.response.text() }],
        });

        return result.response.text();
    } catch (error) {
        console.error("Error generating response:", error);
        throw new Error("Could not generate response.");
    }
}

function clearConversationHistory() {
    conversationHistory = [];
}

function getConversationHistory() {
    return conversationHistory;
}

module.exports = {
    generateResponse,
    clearConversationHistory,
    getConversationHistory,
};
