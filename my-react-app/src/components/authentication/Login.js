import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert} from 'react-bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import CenteredContainer from './CenteredContainer'
import "../../index.css"
import { faG } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export default function Login() {
    const emailRef = useRef()
    const passRef = useRef()
    const emailRef_ = useRef()
    const passRef_ = useRef()
    const loginRef = useRef();
    const signUpRef = useRef();
    const textBoxRef = useRef();
    const { login, signup, loginWithGoogle } = useAuth()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [mode, setMode ] =useState(false)
    const navigate = useNavigate()

    const passConlRef = useRef()

    async function handleSubmit(e){
        e.preventDefault()
        try {
            setError('')
            setLoading(true)
            await login(emailRef.current.value, passRef.current.value)
            navigate("/")
        }
        catch{
            setError('Fail to sign in')
        }
        setLoading(false)
    }

    async function handleSignUp(e){
        e.preventDefault()

        if (passRef_.current.value !== passConlRef.current.value) 
            return setError('Password do not match')
        try {
            setError('')
            setLoading(true)
            await signup(emailRef_.current.value, passRef_.current.value)
            navigate("/")
        }
        catch{
            setError('Fail to create an account')
        }
        setLoading(false)
    }

    async function handleGoogleLogin(e){
        e.preventDefault()
        try {
            setError('')
            setLoading(true)
            await loginWithGoogle()
            navigate("/")
        }
        catch{
            setError('Fail to create an account')
        }
        setLoading(false)
    }

    function slideSignUp() {
        if (setMode) {
            textBoxRef.current.classList.toggle("slide_right");
            loginRef.current.classList.toggle("slide_right");
            signUpRef.current.classList.toggle("slide_right_1");
            setMode(true)
        }else
        {
            textBoxRef.current.classList.toggle("slide_left_1");
            loginRef.current.classList.toggle("slide_left");
            signUpRef.current.classList.toggle("slide_left");
            setMode(false)
        }
    }
    
    return (
    <>
        <div class="fullPage">
            <div ref = {signUpRef} class = "signUp">
                <CenteredContainer>
                    <Card style={{borderWidth: "5px", borderColor: "#578FCA"}}>
                        <Card.Body>
                        <h2 className="text-center mb-4 fw-bold" style={{color: "#578FCA"}}>SIGN IN</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSignUp}>
                                <Form.Group id = "email">
                                    <Form.Label ><p className="mb-0 fw-bold" style={{color: "gray"}}>Email</p></Form.Label>
                                    <Form.Control type="email" ref={emailRef_} required />
                                </Form.Group>
                                <Form.Group id = "password">
                                    <Form.Label><p className="mb-0 fw-bold" style={{color: "gray"}}>Password</p></Form.Label>
                                    <Form.Control type="password" ref={passRef_} required />
                                </Form.Group>
                                <Form.Group id ="password-confirm">
                                    <Form.Label><p className="mb-0 fw-bold" style={{color: "gray"}}>Password Confirmation</p></Form.Label>
                                    <Form.Control type="password" ref={passConlRef} required />
                                </Form.Group>
                                <Button disabled={loading} className="w-100 mt-3" type= "submit" style={{backgroundColor: '#578FCA', borderStyle: 'none'}}>Sign Up</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                    <div className="w-100 text-center mt-2 fw-bold" style={{color:"gray"}}>
                        Already have an account?<span onClick={slideSignUp} class="test">Log In</span>
                    </div>
                </CenteredContainer>
            </div>
            
            <div ref = {textBoxRef} class= "textBox">
            <div class= "mainText"><h1>WELCOME BACK .</h1></div>
                <div class="subText">
                    <h4>To <span>Sto&Ast</span></h4>
                </div>
            </div>
            
            <div ref = {loginRef} class="logIn">
                <CenteredContainer>
                        <Card style={{borderWidth: "5px", borderColor: "#578FCA"}}>
                            <Card.Body>
                                <h2 className="text-center mb-4 fw-bold" style={{color: "#578FCA"}}>LOG IN</h2>
                                {error && <Alert variant="danger">{error}</Alert>}
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group id = "email">
                                        <Form.Label><p className="mb-0 fw-bold" style={{color: "gray"}}>Email</p></Form.Label>
                                        <Form.Control type="email" ref={emailRef} required style={{borderWidth: "2px"}}/>
                                    </Form.Group>
                                    <Form.Group id = "password">
                                        <Form.Label><p className="mb-0 fw-bold" style={{color: "gray"}}>Password</p></Form.Label>
                                        <Form.Control type="password" ref={passRef} required style={{borderWidth: "2px"}}/>
                                    </Form.Group>
                                    <Button disabled={loading} className="w-100 mt-3 fw-bold" type= "submit" style={{backgroundColor: '#578FCA', borderStyle: 'none'}}>Log In</Button>
                                </Form>
                                <div className= "w-10- text-center mt-2 fw-bold">
                                    <Link to="/forgot-password" style={{color: "#074799"}}>Forget Password?</Link>
                                </div>
                            </Card.Body>
                        </Card>
                        <div className="w-100 text-center mt-2 fw-bold" style={{color:"gray"}}>
                            Need An Account? <span onClick={slideSignUp} class="test"> Sign Up</span>
                        </div>
                        
                        <div class= "otherLogin">
                            <Button onClick={handleGoogleLogin} disabled={loading} className="w-100 mt-3 fw-bold" type= "submit" style={{backgroundColor: '#578FCA', borderStyle: 'none'}}>
                                <FontAwesomeIcon icon={faG} style={{ marginRight: "5px" }}/>Login with Google
                            </Button>
                        </div>
                    </CenteredContainer>
                </div>
            </div>
    </>
  )
}
