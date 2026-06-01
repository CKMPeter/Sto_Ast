require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_N,
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
// async function test() {
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4.1-mini",
//       messages: [
//         {
//           role: "user",
//           content: "hello",
//         },
//       ],
//     });

//     console.log(response.choices[0].message.content.trim());
//   } catch (err) {
//     console.dir(err, { depth: null });
//   }
// }

// test();
listAvailableModels();
//export default openai;
module.exports = openai;
