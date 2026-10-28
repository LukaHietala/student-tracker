import { useAuth } from "../context/AuthContext";

function MainLayout(props) {
	const { user } = useAuth();
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
