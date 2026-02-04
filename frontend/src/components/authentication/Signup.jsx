import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import CenteredContainer from './CenteredContainer'

export default function Signup() {
    const emailRef = useRef()
    const passRef = useRef()
    const passConlRef = useRef()
    const { signup } = useAuth()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();

    async function handleSubmit(e){
        e.preventDefault()

        if (passRef.current.value !== passConlRef.current.value) 
            return setError('Password do not match')
        try {
            setError('')
            setLoading(true)
            await signup(emailRef.current.value, passRef.current.value)
            navigate("/")
        }
        catch{
            setError('Fail to create an account')
        }
        setLoading(false)
    }

    return (
    <CenteredContainer>
        <Card>
            <Card.Body>
                <h2 className="text-center mb-4">Sign Up</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group id = "email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" ref={emailRef} required />
                    </Form.Group>
                    <Form.Group id = "password">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" ref={passRef} required />
                    </Form.Group>
                    <Form.Group id ="password-confirm">
                        <Form.Label>Password Confirmation</Form.Label>
                        <Form.Control type="password" ref={passConlRef} required />
                    </Form.Group>
                    <Button disabled={loading} className="w-100 mt-3" type= "submit">Sign Up</Button>
                </Form>
            </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
            Already have an account? <Link to="/login">Log In</Link>
        </div>
    </CenteredContainer>
  )
}
