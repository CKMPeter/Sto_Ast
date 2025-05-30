import React, { useState, useEffect } from 'react'
import { Card, Alert, Button, Image } from 'react-bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import CenteredContainer from './CenteredContainer'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useProfilePicture } from '../../hooks/useProfilePicture'

export default function UserProfile() {
  const [error, setError] = useState("")
  const [profilePicUrl, setProfilePicUrl] = useState(null)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { darkMode } = useDarkMode()
  const { getProfilePicture } = useProfilePicture()

  useEffect(() => {
    async function fetchProfilePic() {
      if (currentUser) {
        const url = await getProfilePicture()
        if (url) setProfilePicUrl(url)
      }
    }
    fetchProfilePic()
  }, [currentUser, getProfilePicture])

  async function handleLogout() {
    setError('')
    try {
      await logout()
      navigate('/login')
    } catch {
      setError('Failed to log out')
    }
  }

  return (
    <CenteredContainer>
      <div className={`p-3 rounded ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
        <Card
          className="shadow-sm"
          bg={darkMode ? "dark" : "light"}
          text={darkMode ? "light" : "dark"}
        >
          <Card.Body>
            <h2 className="text-center mb-4">My Profile</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="text-center mb-3">
              <Image
                src={
                  profilePicUrl ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5wt2-sE3VgB3SwwpeW9QWKNvvN3JqOFlUSQ&s"
                }
                roundedCircle
                alt="Profile"
                width={100}
                height={100}
                style={{ border: darkMode ? "2px solid white" : "2px solid black" }}
              />
            </div>

            <div className="mb-2">
              <strong>Email:</strong>
              <div>{currentUser?.email || "Not available"}</div>
            </div>

            <div className="mb-2">
              <strong>Username:</strong>
              <div>{currentUser?.displayName || "Anonymous"}</div>
            </div>

            <Link
              to="/update-profile"
              className={`btn w-100 mt-3 ${darkMode ? "btn-light" : "btn-primary"}`}
            >
              Edit Profile
            </Link>
          </Card.Body>
        </Card>

        <div className="w-100 text-center mt-3">
          <Button
            as={Link}
            to="/"
            variant={darkMode ? "outline-light" : "outline-primary"}
            className="w-100 mb-2"
          >
            Back to Storage
          </Button>
          <Button
            variant={darkMode ? "outline-danger" : "danger"}
            className="w-100"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </div>
    </CenteredContainer>
  )
}
