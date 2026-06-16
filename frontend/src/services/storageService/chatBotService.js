const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

const KEYWORDS = ["find", "locate", "get"];

export function buildFileSearchPrompt(input, allUserFiles = []) {
  const inputLower = input.toLowerCase();
  const containsKeyword = KEYWORDS.some((keyword) =>
    inputLower.includes(keyword)
  );

  if (!containsKeyword) {
    return input;
  }

  const filesSummary = JSON.stringify(
    allUserFiles.map((file) => ({
      name: file.name,
      path: file.path,
    }))
  );

  return `You are a file path assistant. Below is a list of files with their names and paths (in JSON format). Some files may have the same name but different paths.

Files:
${filesSummary}

User Query:
${input}

Instructions:
If multiple files share the same name, return all matching paths in plain text, each on a new line. Do not include extra commentary or formatting. Only output the file paths.`;
}

export async function runChatbotService({
  input,
  getIdToken,
  allUserFiles = [],
}) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const fullPrompt = buildFileSearchPrompt(input, allUserFiles);

  const response = await fetch(`${BACKEND_URL}/api/chatbot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: fullPrompt,
      files: allUserFiles.map((file) => ({
        name: file.name,
        readablePath: file.readablePath,
        preview: file.preview,
      })),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to get chatbot response");
  }

  return data.result;
}