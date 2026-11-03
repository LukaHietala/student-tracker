import { useMatch } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebsocketContext";
import { toast } from "../scripts/toast";

function Navbar() {
	return (
		<nav class="navbar">
			<div>
				<NavLink href="/">Ryhmät</NavLink>
				<NavLink href="/devices">Laitteet</NavLink>
				<NavLink href="/teachers">Opettajat</NavLink>
				<NavLink href="/archive">Arkisto</NavLink>
				<NavLink href="/guides">Ohjeet</NavLink>
			</div>
			<div>
				<NavLink href="/logout">Kirjaudu ulos</NavLink>
			</div>
		</nav>
	);
}

function NavLink(props) {
	const match = useMatch(() => props.href);

	return (
		<a
			class="btn-link"
			href={props.href}
			classList={{ active: Boolean(match()) }}
		>
			{props.children}
		</a>
	);
}

function MainLayout(props) {
	const { user } = useAuth();
	const ws = useWebSocket();

	ws.addEventListener("message", (message) => {
		const scan = JSON.parse(message.data);
		if (scan.event === "scan:new" && scan.payload.groupId !== 0) {
			toast(`Uusi skannaus: ${scan.payload.name}`);
		}
	});

	return (
		<>
			<main class="container">
				<Show when={user()}>{(user) => <Navbar />}</Show>
				{props.children}
			</main>
		</>
	);
}

export default MainLayout;