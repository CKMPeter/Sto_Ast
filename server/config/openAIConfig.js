const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});
async function listAvailableModels() {
  try {
    const models = await openai.models.list();
    const modelIds = models.data.map((model) => model.id);
    console.log("✅ Models accessible to this API key:");
    modelIds.forEach((id) => console.log(`- ${id}`));
  } catch (error) {
    console.error("❌ Error listing models:", error.message);
  }
}

listAvailableModels();
module.exports = openai;
