require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listAvailableModels() {
  try {
    const models = await openai.models.list();

    console.log("✅ Models accessible to this API key:");

    models.data.forEach((model) => {
      console.log(`- ${model.id}`);
    });
  } catch (error) {
    console.error(
      "❌ Error listing models:",
      error.message
    );
  }
}

// Optional
listAvailableModels();

module.exports = openai;