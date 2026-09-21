import * as React from "react"

export function useOnlineStatus(): boolean {
    const [online, setOnline] = React.useState(true)

    React.useEffect(() => {
        setOnline(navigator.onLine)
        const on = () => setOnline(true)
        const off = () => setOnline(false)
        window.addEventListener("online", on)
        window.addEventListener("offline", off)
        return () => {
            window.removeEventListener("online", on)
            window.removeEventListener("offline", off)
        }
    }, [])

    return online
}
