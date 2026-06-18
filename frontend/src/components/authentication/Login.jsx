import React, { useRef, useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import CenteredContainer from "./CenteredContainer";
import "../../index.css";
import { faG, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDarkMode } from "../../hooks/useDarkMode";

export default function Login() {
  const emailRef = useRef();
  const passRef = useRef();

  const emailRef_ = useRef();
  const passRef_ = useRef();
  const passConlRef = useRef();

  const loginRef = useRef();
  const signUpRef = useRef();
  const textBoxRef = useRef();

  const { login, signup, loginWithGoogle } = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(false);

  const { darkMode } = useDarkMode();

  const navigate = useNavigate();

  const colors = {
    primary: "#0077b6",
    secondary: "#0096c7",
    accent: "#48cae4",
    light: "#caf0f8",
    dark: "#023047",
    bgLight: "#f8fdff",
    bgDark: "#121212",
    cardDark: "#12384c",
    inputDark: "#0b2735",
    borderDark: "#16425b",
  };

  const cardBodyStyle = {
    color: darkMode ? "#ffffff" : colors.dark,
    backgroundColor: darkMode ? colors.cardDark : "#ffffff",
    borderRadius: "20px",
  };

  const formStyle = {
    color: darkMode ? "#ffffff" : colors.dark,
    backgroundColor: darkMode ? colors.cardDark : "#ffffff",
  };

  const labelStyle = {
    color: darkMode ? colors.light : colors.primary,
  };

  const inputStyle = {
    backgroundColor: darkMode ? colors.inputDark : "#ffffff",
    color: darkMode ? "#ffffff" : colors.dark,
    border: `1px solid ${darkMode ? colors.borderDark : colors.light}`,
    borderRadius: "12px",
  };

  const buttonStyle = {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0,119,182,0.25)",
  };

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passRef.current.value);
      navigate("/");
    } catch {
      setError("Fail to sign in");
    }

    setLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();

    if (passRef_.current.value !== passConlRef.current.value) {
      return setError("Password do not match");
    }

    try {
      setError("");
      setLoading(true);
      await signup(emailRef_.current.value, passRef_.current.value);
      navigate("/");
    } catch {
      setError("Fail to create an account");
    }

    setLoading(false);
  }

  async function handleGoogleLogin(e) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch {
      setError("Fail to login with Google");
    }

    setLoading(false);
  }

  function slideSignUp() {
    if (!mode) {
      textBoxRef.current.classList.remove("slide_right", "slide_right_1");
      loginRef.current.classList.remove("slide_right");
      signUpRef.current.classList.remove("slide_right");

      textBoxRef.current.classList.add("slide_left_1");
      loginRef.current.classList.add("slide_left");
      signUpRef.current.classList.add("slide_left");

      setMode(true);
    } else {
      textBoxRef.current.classList.remove("slide_left_1");
      loginRef.current.classList.remove("slide_left");
      signUpRef.current.classList.remove("slide_left");

      textBoxRef.current.classList.add("slide_right");
      loginRef.current.classList.add("slide_right");
      signUpRef.current.classList.add("slide_right_1");

      setMode(false);
    }
  }

  return (
    <div
      className="fullPage"
      style={{
        backgroundColor: darkMode ? colors.bgDark : colors.bgLight,
      }}
    >
      <div ref={signUpRef} className="signUp authPanel">
        <CenteredContainer>
          <Card
            className="authCard"
            style={{
              border: `1px solid ${darkMode ? colors.borderDark : colors.light}`,
              borderRadius: "20px",
              boxShadow: "0 12px 30px rgba(0,119,182,0.15)",
              overflow: "hidden",
            }}
          >
            <Card.Body style={cardBodyStyle}>
              <h2 className="text-center mb-4 fw-bold authTitle">
                <FontAwesomeIcon
                  icon={faUser}
                  className="authIcon"
                  style={{ color: colors.primary }}
                />
                <br />
                <span>SIGN UP</span>
              </h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSignUp} style={formStyle}>
                <Form.Group id="signup-email" className="mb-3">
                  <Form.Label className="fw-bold" style={labelStyle}>
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    ref={emailRef_}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group id="signup-password" className="mb-3">
                  <Form.Label className="fw-bold" style={labelStyle}>
                    Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    ref={passRef_}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group id="password-confirm" className="mb-3">
                  <Form.Label className="fw-bold" style={labelStyle}>
                    Password Confirmation
                  </Form.Label>
                  <Form.Control
                    type="password"
                    ref={passConlRef}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Button
                  disabled={loading}
                  className="w-100 mt-2 authButton"
                  type="submit"
                  style={buttonStyle}
                >
                  Sign Up
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <div
            className="w-100 text-center mt-2 fw-bold"
            style={{ color: darkMode ? colors.light : colors.dark }}
          >
            Already have an account?{" "}
            <span
              onClick={slideSignUp}
              className="test"
              style={{ color: colors.primary, cursor: "pointer" }}
            >
              Log In
            </span>
          </div>
        </CenteredContainer>
      </div>

      <div
        ref={textBoxRef}
        className="textBox"
        style={{
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 55%, ${colors.secondary} 100%)`,
          color: "#ffffff",
        }}
      >
        <div className="mainText">
          <h1
            style={{
              color: "#ffffff",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            {mode ? "JOIN US." : "WELCOME BACK."}
          </h1>
        </div>

        <div className="subText">
          <h4 style={{ color: colors.light }}>
            {mode ? "Create your " : "To "}
            <span style={{ color: colors.accent, fontWeight: "800" }}>
              Sto&Ast
            </span>
            {mode ? " account" : ""}
          </h4>
        </div>
      </div>

      <div ref={loginRef} className="logIn authPanel">
        <CenteredContainer>
          <Card
            className="authCard"
            style={{
              border: `1px solid ${darkMode ? colors.borderDark : colors.light}`,
              borderRadius: "20px",
              boxShadow: "0 12px 30px rgba(0,119,182,0.15)",
              overflow: "hidden",
            }}
          >
            <Card.Body style={cardBodyStyle}>
              <h2 className="text-center mb-4 fw-bold authTitle">
                <FontAwesomeIcon
                  icon={faUser}
                  className="authIcon"
                  style={{ color: colors.primary }}
                />
                <br />
                <span>LOG IN</span>
              </h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit} style={formStyle}>
                <Form.Group id="login-email" className="mb-3">
                  <Form.Label className="fw-bold" style={labelStyle}>
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    ref={emailRef}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group id="login-password" className="mb-3">
                  <Form.Label className="fw-bold" style={labelStyle}>
                    Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    ref={passRef}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Button
                  disabled={loading}
                  className="w-100 mt-2 authButton"
                  type="submit"
                  style={buttonStyle}
                >
                  Log In
                </Button>
              </Form>

              <div className="w-100 text-center mt-2 fw-bold">
                <Link
                  to="/forgot-password"
                  style={{ color: darkMode ? colors.accent : colors.primary }}
                >
                  Forget Password?
                </Link>
              </div>
            </Card.Body>
          </Card>

          <div
            className="w-100 text-center mt-2 fw-bold"
            style={{ color: darkMode ? colors.light : colors.dark }}
          >
            Need An Account?{" "}
            <span
              onClick={slideSignUp}
              className="test"
              style={{ color: colors.primary, cursor: "pointer" }}
            >
              Sign Up
            </span>
          </div>

          <div className="otherLogin">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-100 mt-3 fw-bold authButton"
              type="button"
              style={buttonStyle}
            >
              <FontAwesomeIcon icon={faG} style={{ marginRight: "5px" }} />
              Login with Google
            </Button>
          </div>
        </CenteredContainer>
      </div>
    </div>
  );
} 