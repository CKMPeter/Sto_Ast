import React, { useRef, useState } from "react";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import CenteredContainer from "./CenteredContainer";
import "../../index.css";
import { faG, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const navigate = useNavigate();

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
    <div className="fullPage">
      <div ref={signUpRef} className="signUp authPanel">
        <CenteredContainer>
          <Card className="authCard">
            <Card.Body>
              <h2 className="text-center mb-4 fw-bold authTitle">
                <FontAwesomeIcon icon={faUser} className="authIcon" />
                <br />
                <span>SIGN UP</span>
              </h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSignUp}>
                <Form.Group id="signup-email" className="mb-3">
                  <Form.Label className="fw-bold text-secondary">
                    Email
                  </Form.Label>
                  <Form.Control type="email" ref={emailRef_} required />
                </Form.Group>

                <Form.Group id="signup-password" className="mb-3">
                  <Form.Label className="fw-bold text-secondary">
                    Password
                  </Form.Label>
                  <Form.Control type="password" ref={passRef_} required />
                </Form.Group>

                <Form.Group id="password-confirm" className="mb-3">
                  <Form.Label className="fw-bold text-secondary">
                    Password Confirmation
                  </Form.Label>
                  <Form.Control type="password" ref={passConlRef} required />
                </Form.Group>

                <Button disabled={loading} className="w-100 mt-2 authButton" type="submit">
                  Sign Up
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <div className="w-100 text-center mt-2 fw-bold text-secondary">
            Already have an account?{" "}
            <span onClick={slideSignUp} className="test">
              Log In
            </span>
          </div>
        </CenteredContainer>
      </div>

      <div ref={textBoxRef} className="textBox">
        <div className="mainText">
          <h1>WELCOME BACK.</h1>
        </div>

        <div className="subText">
          <h4>
            To <span>Sto&Ast</span>
          </h4>
        </div>
      </div>

      <div ref={loginRef} className="logIn authPanel">
        <CenteredContainer>
          <Card className="authCard">
            <Card.Body>
              <h2 className="text-center mb-4 fw-bold authTitle">
                <FontAwesomeIcon icon={faUser} className="authIcon" />
                <br />
                <span>LOG IN</span>
              </h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group id="login-email" className="mb-3">
                  <Form.Label className="fw-bold text-secondary">
                    Email
                  </Form.Label>
                  <Form.Control type="email" ref={emailRef} required />
                </Form.Group>

                <Form.Group id="login-password" className="mb-3">
                  <Form.Label className="fw-bold text-secondary">
                    Password
                  </Form.Label>
                  <Form.Control type="password" ref={passRef} required />
                </Form.Group>

                <Button disabled={loading} className="w-100 mt-2 authButton" type="submit">
                  Log In
                </Button>
              </Form>

              <div className="w-100 text-center mt-2 fw-bold">
                <Link to="/forgot-password" style={{ color: "#074799" }}>
                  Forget Password?
                </Link>
              </div>
            </Card.Body>
          </Card>

          <div className="w-100 text-center mt-2 fw-bold text-secondary">
            Need An Account?{" "}
            <span onClick={slideSignUp} className="test">
              Sign Up
            </span>
          </div>

          <div className="otherLogin">
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-100 mt-3 fw-bold authButton"
              type="button"
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