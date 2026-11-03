import { createForm, Field, FieldArray, Form, reset, setInput, getInput } from "@formisch/solid";
import { createResource, createSignal, createEffect } from "solid-js";
import { useAuth } from "../../context/AuthContext.jsx";
import { groupSchema } from "./schema.js";

function GroupForm(props) {
	const group = props.group;
	const cancel = () => props.cancel;
    const title = props.title

	const handleSubmit = async (data) => {
		await props.onSubmit(data);
	};

	const groupForm = createForm({
		schema: groupSchema,
		validate: "blur",
	});

	createEffect(() => {
		if (group) {
			reset(groupForm, {
				initialInput: group(),
			});
		}
	});

	return (
		<Form
			of={groupForm}
			onSubmit={handleSubmit}
			class="form"
		>
			<div class="form-block">
				<span>{title}</span>
			</div>
			<div class="form-block">
				<Field
					of={groupForm}
					path={["name"]}
				>
					{(field) => (
						<div>
							<label for={field.props.name}>Nimi:</label>
							<br />
							<input
								{...field.props}
								id={field.props.name}
								value={field.input}
								type="text"
                                placeholder="esim. Robolabra (1.10-18.12)"
								required
							/>
							{field.errors && <small class="form-error">{field.errors[0]}</small>}
						</div>
					)}
				</Field>
			</div>

			<div class="form-block">
				<div style="display: inline-flex; gap: 4px;">
					<button
						class="btn-secondary"
						type="button"
						onClick={() => cancel()}
					>
						Peruuta
					</button>
					<button
						class="btn-primary"
						type="submit"
					>
						Tallenna
					</button>
				</div>
			</div>
		</Form>
	);
}

export default GroupForm;