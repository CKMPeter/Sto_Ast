import { useAuth } from '../contexts/AuthContext'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getDatabase, ref as dbRef, set, get } from 'firebase/database'

export function useProfilePicture() {
    const { currentUser } = useAuth()

    const uploadProfilePicture = async (file) => {
        if (!currentUser || !file) throw new Error("Invalid upload")

        const userId = currentUser.uid
        const storage = getStorage()
        const database = getDatabase()
        const fileRef = storageRef(storage, `profilePictures/${userId}.jpg`)

        await uploadBytes(fileRef, file)
        const downloadURL = await getDownloadURL(fileRef)

        const dbPath = dbRef(database, `profilePic/${userId}/ProfilePic`)
        await set(dbPath, downloadURL)

        return downloadURL
    }

    const getProfilePicture = async () => {
        if (!currentUser) return null

        const userId = currentUser.uid
        const database = getDatabase()
        const dbPath = dbRef(database, `users/${userId}/profilePicture`)

        try {
            const snapshot = await get(dbPath)
            if (snapshot.exists()) {
            const data = snapshot.val()
            // `data` is expected to be an object like { content: "base64string", name: "...", createdAt: ... }
            if (data.content) {
                // Construct data URL from base64 content
                return `data:image/jpeg;base64,${data.content}`
            }
            return null
            } else {
            return null
            }
        } catch (error) {
            console.error("Failed to get profile picture:", error)
            return null
        }
    }


    return { uploadProfilePicture, getProfilePicture }
}
