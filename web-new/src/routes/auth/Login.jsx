import * as v from "valibot";
import { createForm, Field, Form } from "@formisch/solid";
import { authService } from "../../services";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../../context/AuthContext";

const loginSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Name is required")),
	password: v.pipe(v.string(), v.nonEmpty("Password is required")),
});

function LoginPage() {
	const navigate = useNavigate();
	const { refetch } = useAuth();

	const loginForm = createForm({ schema: loginSchema });

	const handleLogin = async (data) => {
		try {
			await authService.login(data);
			await refetch();
			navigate("/", { replace: true });
		} catch (e) {
			console.error(e.message);
		}
	};

	return (
		<Form
			of={loginForm}
			onSubmit={handleLogin}
		>
			<Field
				of={loginForm}
				path={["name"]}
			>
				{(field) => (
					<div>
						<label for={field.props.name}>Name</label>
						<input
							{...field.props}
							id={field.props.name}
							value={field.input}
							required
						/>
						{field.errors && <div>{field.errors[0]}</div>}
					</div>
				)}
			</Field>
			<Field
				of={loginForm}
				path={["password"]}
			>
				{(field) => (
					<div>
						<label for={field.props.name}>Password</label>
						<input
							{...field.props}
							id={field.props.name}
							value={field.input}
							type="password"
							required
						/>
						{field.errors && <div>{field.errors[0]}</div>}
					</div>
				)}
			</Field>
			<button type="submit">Login</button>
		</Form>
	);
}

export default LoginPage;
