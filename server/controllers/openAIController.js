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

const aiRename = async (req, res) => {
  try {
    const { input, task, isImage = false, mimeType = "image/jpeg" } = req.body;
    if (!input || !task) {
      return res.status(400).json({ error: "Missing input or task" });
    }

    const prompt = isImage
      ? `Rename the image based on its content in 5 words.`
      : `Rename the following text based on content in 5 words:\n${input}`;

    // For images, embed like in describeImage
    const messages = isImage
      ? [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${input}`,
                },
              },
            ],
          },
        ]
      : [
          {
            role: "user",
            content: prompt,
          },
        ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 50,
    });

    const newName = response.choices[0].message.content.trim();
    res.json({ result: newName });
  } catch (error) {
    console.error("AI rename error:", error);
    res.status(500).json({ error: "AI rename failed" });
  }
};
 

module.exports = {
  describeImage,
  aiRename,
};
