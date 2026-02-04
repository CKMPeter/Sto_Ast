import React, { useRef, useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import CenteredContainer from "./CenteredContainer";
import UploadProfileButton from "./UploadProfileButton";
import { useDarkMode } from "../../hooks/useDarkMode"; // Adjust the import path if necessary

export default function UpdateProfile() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updateUser } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {darkMode} = useDarkMode(); // Dark mode state
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!passwordRef.current.value) {
      navigate("/user");
      return;  // Added to prevent further execution
    }

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    const promises = [];
    setLoading(true);
    setError("");

    promises.push(
      updateUser(emailRef.current.value, passwordRef.current.value)
    );

    Promise.all(promises)
      .then(() => {
        navigate("/user");
      })
      .catch(() => {
        setError("Failed to update account");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <CenteredContainer>
      <div className={`p-3 rounded ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
        <Card
          bg={darkMode ? "dark" : "light"} 
          text={darkMode ? "light" : "dark"}
          className="mb-3"
        >
          <Card.Body>
            <h2 className={`text-center mb-4 ${darkMode ? "text-light" : "text-dark"}`}>Update Profile</h2>
            {error && <Alert variant="danger" className={darkMode ? "text-light" : ""}>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label style={{ fontWeight: "bold" }} className={darkMode ? "text-light" : "text-dark"}>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  ref={emailRef}
                  required
                  defaultValue={currentUser.email}
                  plaintext={true}  // makes it look like plain text (no input border)
                  readOnly           // makes it uneditable
                  className={darkMode ? "bg-dark text-light" : ""}
                />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label style={{ fontWeight: "bold" }} className={darkMode ? "text-light" : "text-dark"}>
                  Password
                </Form.Label>
                <Form.Control
                  type="password"
                  ref={passwordRef}
                  placeholder="Leave blank to keep the same"
                  className={darkMode ? "bg-secondary text-light" : ""}
                />
              </Form.Group>
              <Form.Group id="password-confirm" className="mb-3">
                <Form.Label style={{ fontWeight: "bold" }} className={darkMode ? "text-light" : "text-dark"}>
                  Password Confirmation
                </Form.Label>
                <Form.Control
                  type="password"
                  ref={passwordConfirmRef}
                  placeholder="Leave blank to keep the same"
                  className={darkMode ? "bg-secondary text-light" : ""}
                />
              </Form.Group>
              <Button
                disabled={loading}
                className="w-100 mb-3 mt-3"
                type="submit"
                variant={darkMode ? "light" : "primary"}
              >
                Update
              </Button>
              <UploadProfileButton />
            </Form>
          </Card.Body>

        </Card>

        <div className="w-100 text-center mt-2">
          <Link to="/user">
            <Button variant={darkMode ? "outline-light" : "outline-danger"} className="w-100">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </CenteredContainer>
  );
}
