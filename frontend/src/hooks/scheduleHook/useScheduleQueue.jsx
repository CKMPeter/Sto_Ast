import { useAuth } from '../../contexts/AuthContext'

export function useScheduleQueue() {
    const { currentUser, getIdToken } = useAuth()
    const BASE_URL = import.meta.env.VITE_APP_BACKEND_URL

    // 🔒 Helper
    const getAuthHeaders = async () => {
        if (!currentUser) throw new Error("Not authenticated")

        const token = await getIdToken()

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    }

    // ==========================
    // ➕ ADD EVENT (Firestore + RTDB via backend)
    // ==========================
    const addEvent = async (date, { title, start, duration }) => {
        const headers = await getAuthHeaders()

        const res = await fetch(`${BASE_URL}/api/schedules`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                userId: currentUser.uid,
                date,
                title,
                startMinutes: start,
                duration
            })
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || "Failed to add event")
        }

        const data = await res.json()

        return {
            id: data.schedule.scheduleId,
            title: data.schedule.title,
            start: data.schedule.startMinutes,
            duration: data.schedule.duration
        }
    }

    // ==========================
    // 📥 FETCH (🔥 FIRESTORE ONLY)
    // ==========================
    const getEventsByDate = async (date) => {
        if (!currentUser) return []

        const headers = await getAuthHeaders()

        const res = await fetch(
            `${BASE_URL}/api/schedules?date=${date}&userId=${currentUser.uid}`,
            { headers }
        )

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || "Failed to fetch events")
        }

        const data = await res.json()

        // ✅ PURE Firestore data → normalize once
        return (data.events || []).map(e => ({
            id: e.id,
            title: e.title,
            start: e.startMinutes,
            duration: e.duration
        }))
    }

    // ==========================
    // ❌ DELETE (Firestore + RTDB)
    // ==========================
    const deleteEvent = async (eventId) => {
        const headers = await getAuthHeaders()

        const res = await fetch(
            `${BASE_URL}/api/schedules/${eventId}`,
            {
                method: "DELETE",
                headers
            }
        )

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || "Failed to delete event")
        }

        return true
    }

    // ==========================
    // ✏️ UPDATE (Firestore + RTDB)
    // ==========================
    const updateEvent = async (eventId, updateData) => {
        const headers = await getAuthHeaders()

        const res = await fetch(
            `${BASE_URL}/api/schedules/${eventId}`,
            {
                method: "PUT",
                headers,
                body: JSON.stringify(updateData)
            }
        )

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || "Failed to update event")
        }

        return true
    }

    return {
        addEvent,
        getEventsByDate, // ✅ Firestore only
        deleteEvent,
        updateEvent
    }
}