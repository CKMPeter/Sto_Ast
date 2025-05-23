const openai = require('../config/openAIConfig');

const describeImage = async (req, res) => {
  try {
    const { task, input, mimeType, isImage } = req.body;

    if (!task || !input || !mimeType || !isImage) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: task },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${input}`,
            },
          },
        ],
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1024,
    });

    const description = response.choices[0].message.content;
    res.json({ result: description });

  } catch (error) {
    console.error("Error generating image description:", error);
    res.status(500).json({ error: "Failed to generate image description" });
  }
};


module.exports = {
  describeImage,
};
