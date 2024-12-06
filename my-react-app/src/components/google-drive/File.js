import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import '../../include/App.css'; // Adjust the relative path if necessary
import { GoogleGenerativeAI } from '@google/generative-ai'; // Correct import

console.log('API Key:', process.env.REACT_APP_GEMINI_API_KEY);

const client = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

// Function to interact with Google's Generative AI model
async function run(input) {
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash', // Specify the correct model
  });

  const prompt = `${input}
  from the given text sumarize the content of the file
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text(); // Await the text content of the response
    console.log(text);
    return text;
  } catch (error) {
    console.error("Error generating AI content:", error);
    return "Error processing content with AI.";
  }
}

export default function File({ file }) {
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState(""); // Start with empty string, not null
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(""); // State for AI response

  // Function to decode base64 content to plain text
  const decodeBase64Content = (base64Content) => {
    try {
      // Decode the base64 string to get actual content (text)
      const decodedContent = atob(base64Content);
      setFileContent(decodedContent); // Set the decoded content
    } catch (error) {
      console.error("Error decoding base64 content:", error);
      setFileContent("Error decoding content.");
    }
  };

  // This function will be triggered when the file is clicked
  const handleFileClick = () => {
    if (file.content) {
      setLoading(true);
      // Check if the file is a .txt file
      if (file.name.endsWith("_txt")) {
        decodeBase64Content(file.content); // Decode base64 content for .txt files
      } else {
        setFileContent(file.content); // For non-txt files, use as is
      }
      setLoading(false);
      setShowModal(true); // Show the modal
    } else {
      console.error("No content found for this file.");
    }
  };

  // Use effect to trigger AI request once fileContent has been updated
  useEffect(() => {
    if (fileContent) {
      handleClick(); // Call the AI function once the content is set
    }
  }, [fileContent]); // Depend on fileContent state

  // Function to handle right-click and interact with Google's Generative AI API
  const handleClick = async () => {
    if (!fileContent) {
      setAiResponse("No content to send to AI.");
      return;
    }

    if (isImage) return;
    setLoading(true); // Indicate loading state

    try {
      // Send the decoded content to Google's Generative AI API using the run function
      const aiText = await run(fileContent);
      console.log(aiText);
      setAiResponse(aiText); // Update AI response state with generated content
    } catch (error) {
      console.error("Error calling Google Generative AI API:", error);
      setAiResponse("Error processing content with AI.");
    }

    setLoading(false); // End loading state
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setFileContent(""); // Clear content when the modal is closed
    setAiResponse(""); // Clear AI response when the modal is closed
  };

  // Check if the file is an image by checking the file extension
  const isImage =
    file.name && (file.name.endsWith("_png") || file.name.endsWith("_jpg") || file.name.endsWith("_jpeg"));
  const isText = file.name && file.name.endsWith("_txt");

  return (
    <>
      <a
        onClick={handleFileClick} // Trigger handleFileClick on click
        className="btn btn-outline-dark text-truncate w-100 mr-2"
        style={{ cursor: "pointer", fontFamily: "'Roboto', sans-serif" }} // Inline font for Vietnamese support
      >
        <FontAwesomeIcon icon={faFile}  style={{ marginRight: 4 }} />
        {file.name}
      </a>

      {/* Modal to show the file content */}
      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>File Content: {file.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            fontFamily: "'Roboto', sans-serif", // Apply inline font here too
            fontSize: "14px", // Ensure proper font size
          }}
        >
          {loading ? (
            <p>Loading...</p> // Show loading message while decoding or fetching content
          ) : (
            <>
              {/* Check if it's an image */}
              {isImage ? (
                <img
                  src={`data:image/${file.name.split(".").pop()};base64,${file.content}`}
                  alt="file content"
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                />
              ) : isText ? (
                // If it's a .txt file, display the decoded content
                <pre>{fileContent}</pre>
              ) : (
                // For other file types (non-image, non-text)
                <p>{fileContent}</p>
              )}

              {/* Display AI Response if available */}
              {aiResponse && (
                <div>
                  <h5>AI Response:</h5>
                  <p>{aiResponse}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
