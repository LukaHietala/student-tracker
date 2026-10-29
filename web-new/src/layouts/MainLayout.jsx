import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebsocketContext"
import { toast } from "../scripts/toast"

function MainLayout(props) {
    const { user } = useAuth();
    const ws = useWebSocket();
    
    ws.addEventListener('message', message => {
        const scan = JSON.parse(message.data)
        if (scan.event === "scan:new" && scan.payload.groupId !== 0) {
            toast(`Uusi skannaus: ${scan.payload.name}`);
        }
    });

    return (
        <>
            <Show when={user()}>
                {(user) => (
                    <nav class="navbar">
                        <div>
                            <a href="/" class="btn-link">Groups</a>
                            <a href="/teachers" class="btn-link">Teachers</a>
                            <a href="/archive" class="btn-link">Archive</a>
                        </div>
                        <div>
                            <a href="/logout" class="btn-link">Logout</a>
                        </div>
                    </nav>
                )}
            </Show>
            <main class="container">{props.children}</main>
        </>
    );
}

export default MainLayout;
