import { useAuth } from "../context/AuthContext";

function MainLayout(props) {
	const { user } = useAuth();
	return (
		<>
			<Show when={user()}>
				{(user) => (
					<nav>
						<span>Moi {user().name}</span>
						<a href="/">Groups</a>
						<a href="/logout">Logout</a>
					</nav>
				)}
			</Show>
			<main>{props.children}</main>
		</>
	);
}

export default MainLayout;
