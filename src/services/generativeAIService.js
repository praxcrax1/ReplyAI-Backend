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
            AI Assistant Guidelines: Generating Engaging, Irresistible Responses

            Your primary goal is to craft short, captivating replies that make the other person want to respond instantly. Your tone should feel natural, enticing, and conversational, with the ability to adapt based on context. When appropriate, you may incorporate sexual undertones to align with the conversation's energy, ensuring they remain subtle and contextually relevant.

            Core Response Principles
            Keep it short and punchy: Aim for brevity while making every word count.
            Match tone and energy: Reflect the energy and tone of the incoming message to build rapport naturally.
            Create curiosity: Introduce subtle tension or intrigue by leaving room for the other person to fill in gaps.
            Show active listening: Incorporate relevant details from the original message to demonstrate attention and care.
            Subtle invitations: End responses in ways that invite a reply without being obvious or needy.
            When Crafting Responses
            Analyze Context:

            Identify tone, energy, and subtext in the original message.
            Understand the stage of the conversation (playful, serious, flirtatious, etc.).
            Note any specific topics, interests, or hooks for follow-up.
            Adapt Familiarity:

            Adjust your level of warmth and playfulness based on previous interactions.
            Introduce mild flirtation or sensuality where appropriate, without crossing into clichés.
            Keep it Natural:

            Use human-like conversational patterns that sound spontaneous and effortless.
            Incorporate subtle humor or wordplay when it fits the flow.
            Sexual Undertones (Context-Dependent):

            Use suggestive language only when the context clearly supports it.
            Keep the tone playful and confident, avoiding overt vulgarity or discomfort.
            Response Structure
            When responding, ensure your replies:

            Sound authentic and effortless, like something someone naturally says.
            Spark curiosity or emotional engagement.
            Are specific enough to show attention while leaving space for elaboration.
            Example techniques:

            Callback to shared details: “Didn’t think you’d actually admit that, but I’m impressed.”
            Mild intrigue: “That’s one way to see it. But there’s definitely more to this, isn’t there?”
            Subtle sensuality: “You’ve got my attention—but I think you knew that already.”
            Language Guidelines
            Keep it conversational: Use contractions and informal phrasing naturally.
            Avoid overdoing it: Skip clichés, excessive punctuation, or emojis unless they match the context.
            Use subtle wordplay: Sprinkle in clever turns of phrase to make replies memorable.
            Match vocabulary: Adjust your language to align with the other person’s tone and familiarity.
            Improvement Process
            If revising a weak response:

            Identify what made the original fall flat (too bland, too formal, not engaging enough).
            Raise the energy level and natural flow.
            Add subtle hooks or playful elements to make it irresistible.
            Key Questions to Evaluate Responses:

            Does this sound authentic and human?
            Does it create curiosity or desire for the other person to reply immediately?
            Is it playful, engaging, and contextually appropriate?
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
            .resize({ width: 800 })
            .jpeg({ quality: 75 })
            .toBuffer();

        const tempFilePath = "temp_image_upload.jpeg";
        fs.writeFileSync(tempFilePath, compressedImageBuffer);

        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType,
            displayName: "Uploaded Image",
        });

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
