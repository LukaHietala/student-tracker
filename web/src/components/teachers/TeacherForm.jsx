import { createForm, Field, FieldArray, Form, reset, setInput, getInput } from "@formisch/solid";
import { createResource, createSignal, createEffect } from "solid-js";
import { useAuth } from "../../context/AuthContext.jsx";
import { teacherSchema } from "./schema.js";

function TeacherForm(props) {
		const teacher = props.teacher;
		const title = props.title;
		const cancel = () => props.cancel;

		const handleSubmit = async (data) => {
				await props.onSubmit(data);
		};

		const teacherForm = createForm({
				schema: teacherSchema,
				validate: "blur",
		});

		createEffect(() => {
				if (teacher) {
						reset(teacherForm, {
								initialInput: teacher(),
						});
				}
		});

		return (
				<Form
						of={teacherForm}
						onSubmit={handleSubmit}
						class="form"
				>
						<div class="form-block">
								<span>{title}</span>
						</div>
						<div class="form-block">
								<Field
										of={teacherForm}
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
																required
														/>
														{field.errors && <small class="form-error">{field.errors[0]}</small>}
												</div>
										)}
								</Field>
								<Field
										of={teacherForm}
										path={["password"]}
								>
										{(field) => (
												<div>
														<label for={field.props.name}>Salasana:</label>
														<br />
														<input
																{...field.props}
																id={field.props.name}
																value={field.input}
																type="text"
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
												disabled={teacherForm.isValidating}
												type="submit"
										>
												{teacherForm.isValidating ? "Tarkistetaan..." : "Tallenna"}
										</button>
								</div>
						</div>
				</Form>
		);
}

export default TeacherForm;