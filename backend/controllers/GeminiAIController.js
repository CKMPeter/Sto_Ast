const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
  // Function to handle AI analysis
  aiAnalyse: async (req, res) => {
    const { input, task, isImage = false, mimeType = "image/jpeg" } = req.body;
    if (!input || !task)
      return res.status(400).json({ error: "Missing input or task" });

    try {
      const result = await runAI(input, task, isImage, mimeType);
      res.json({ result });
    } catch (err) {
      console.error("AI Error:", err);
      res.status(500).json({ error: "AI processing failed" });
    }
  },

  // Function to handle chatbot interaction
  chatWithBot: async (req, res) => {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "Input required" });

    try {
      const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(input);
      const response = await result.response;
      res.json({ result: await response.text() });
    } catch (error) {
      console.error("Chatbot error:", error.message);
      res.status(500).json({ error: "Chatbot failed" });
    }
  },
};

// Gemini AI setup
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runAI(input, task, isImage = false, mimeType = "image/jpeg") {
  const model = client.getGenerativeModel({
    model: isImage ? "gemini-pro-vision" : "gemini-1.5-flash",
  });

  const prompt = isImage
    ? task === "describe"
      ? "Describe the image."
      : "Identify objects in the image."
    : task === "summarize"
    ? `${input}\nSummarize.`
    : `${input}\nExtract keywords.`;

  try {
    if (isImage) {
      const response = await model.generateContent({
        contents: [
          { parts: [prompt, { inlineData: { mimeType, data: input } }] },
        ],
      });
      return response.response.text();
    } else {
      const response = await model.generateContent(prompt);
      return response.response.text();
    }
  } catch (error) {
    console.error("Error in runAI:", error.response?.data || error.message || error);
    throw error;
  }
}

