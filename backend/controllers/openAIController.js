const openai = require("../config/openAIConfig");

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
    const {
      input,
      isImage = false,
      mimeType = "image/jpeg",
      fileName,
    } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Missing input." });
    }

    const prompt = isImage
      ? `Rename the image based on its content with in 5 words 
      and keeping file extension.\nOriginal name: ${fileName}.`
      : `Rename the following text based on content with in 5 words 
      and keeping file extension.\nOriginal name: ${fileName}
      \nContent:${input}`;

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

const aiPreview = async (req, res) => {
  try {
    const { input, isImage = false, mimeType = "image/jpeg" } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Missing input." });
    }

    const prompt = isImage
      ? `Describe the image with in 25 words.`
      : `Preview this content with in 25 words:\n${input}`;

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

    const prview = response.choices[0].message.content.trim();
    res.json({ result: prview });
  } catch (error) {
    console.error("AI preview error:", error);
    res.status(500).json({ error: "AI preview failed" });
  }
};

const createMainTaskAI = async (req, res) => {
  try {
    const { userId, description } = req.body;

    console.log("Create main task AI request:", req.body);

    if (!description || !userId) {
      return res.status(400).json({
        error: "Missing required fields.",
      });
    }

    const today = new Date();

    const prompt = `
      Generate a task structure in JSON format.

      Return ONLY valid JSON.

      Format:
      {
        "name": "",
        "expireAt": "",
        "description": "",
        "subTasks": [
          {
            "name": "",
            "status": "To do",
            "description": ""
          }
        ]
      }

      Description:
      ${description}, today is ${today.toDateString()} make the expire date at least one day from now.
    `;

    const messages = [
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 300,
    });
    console.log(
      "AI create task response:",
      response.choices[0].message.content.trim(),
    );
    res.json({ result: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error("STATUS:", error.status);
    console.error("TYPE:", error.type);
    console.error("CODE:", error.code);
    console.error("MESSAGE:", error.message);

    if (error.error) {
      console.error("ERROR OBJECT:", error.error);
    }

    res.status(500).json({
      error: error.message,
      type: error.type,
      code: error.code,
    });
  }
};

async function runAI(input, task, isImage = false, mimeType = "image/jpeg") {
  const prompt = isImage
    ? task === "describe"
      ? "Describe the image."
      : "Identify objects in the image."
    : task === "summarize"
      ? `${input}\nSummarize.`
      : `${input}\nExtract keywords.`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: isImage
        ? [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: prompt,
                },
                {
                  type: "input_image",
                  image_url: `data:${mimeType};base64,${input}`,
                },
              ],
            },
          ]
        : prompt,
    });

    return response.output_text;
  } catch (error) {
    console.error(
      "Error in runAI:",
      error.response?.data || error.message || error,
    );
    throw error;
  }
}

const similarity = (a, b) => {
  a = a.toLowerCase();
  b = b.toLowerCase();

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);

  return maxLength === 0 ? 1 : 1 - distance / maxLength;
};

const cleanText = (text = "") =>
  text
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .trim();

const chatWithBot = async (req, res) => {
  const { input, files = [] } = req.body;

  if (!input) {
    return res.status(400).json({ error: "Input required" });
  }

  const lowerInput = input.toLowerCase();

  const isSearchQuery = [
    "find",
    "search",
    "locate",
    "where is",
    "look for",
  ].some((keyword) => lowerInput.includes(keyword));

  try {
    if (isSearchQuery) {
      const query = cleanText(
        lowerInput.replace(/find|search|locate|where is|look for/g, ""),
      );

      const queryWords = query.split(/\s+/).filter(Boolean);

      let matchedFiles = files.filter((file) => {
        const name = cleanText(file.name);
        const path = cleanText(file.readablePath);
        const preview = cleanText(file.preview);

        return queryWords.every(
          (word) =>
            name.includes(word) ||
            path.includes(word) ||
            preview.includes(word),
        );
      });

      if (matchedFiles.length > 0) {
        return res.json({
          type: "search",
          result: matchedFiles.map((file) => ({
            name: file.name,
            readablePath: file.readablePath,
            preview: file.preview,
          })),
        });
      }

      const scoredFiles = files
        .map((file) => {
          const cleanName = cleanText(file.name);
          const score = similarity(query, cleanName);

          return {
            ...file,
            score,
          };
        })
        .filter((file) => file.score >= 0.7)
        .sort((a, b) => b.score - a.score);

      if (scoredFiles.length > 0) {
        return res.json({
          type: "search_70_match",
          result: scoredFiles.map((file) => ({
            name: file.name,
            readablePath: file.readablePath,
            preview: file.preview,
            score: file.score,
          })),
        });
      }

      const aiPrompt = `
        You are a file search assistant.

        User query:
        "${input}"

        Available files:
        ${JSON.stringify(files, null, 2)}

        Your task:
        Find the closest matching file(s) based on:
        1. file name
        2. readablePath
        3. preview/content

        IMPORTANT:
        - Only return files that exist in the Available files list.
        - Never invent a file.
        - Always copy the exact readablePath from the provided file.
        - Always include readablePath in every result.
        - If multiple files are relevant, return all of them.
        - Return ONLY valid JSON.
        - No markdown.
        - No explanations.

        Format:
        [
          {
            "name": "exact file name",
            "readablePath": "exact readable path from input",
            "preview": "preview text"
          }
        ]

        If nothing is close enough:
        []
        `;

      const aiResponse = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: aiPrompt,
      });

      let aiMatches = [];

      try {
        aiMatches = JSON.parse(aiResponse.output_text);
      } catch (err) {
        console.error("AI JSON parse error:", aiResponse.output_text);
        aiMatches = [];
      }

      return res.json({
        type: "search_ai_nearest",
        result: aiMatches,
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input,
    });

    return res.json({
      type: "chat",
      result: response.output_text,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({
      error: "Chatbot failed",
    });
  }
};
module.exports = {
  describeImage,
  aiRename,
  aiPreview,
  chatWithBot,
  createMainTaskAI,
};
