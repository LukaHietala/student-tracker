import { createSignal } from "solid-js";
import TeacherForm from "./TeacherForm.jsx";

function TeachersItem(props) {
		const teacher = props.teacher;

		const [editing, setEditing] = createSignal(false);

		const editT = (data) => {
				props.editTeacher(data, teacher.id);
		};

		return (
				<>
						<div class="item">
								<div>
										<span>{teacher.name}</span>
										<br />
								</div>
								<div style="display: inline-flex; gap: 4px;">
										<button
												class="btn-secondary"
												onClick={() => setEditing(!editing())}
										>
                                            Muokkaa
										</button>
										<button
												class="btn-primary"
												onClick={() => props.deleteTeacher(teacher.id)}
										>
                                            Poista
										</button>
								</div>
						</div>

						<Show when={editing()}>
								<div
										class="item"
										style="background-color: var(--bg);"
								>
										<TeacherForm
												title={`Muokataana opettajaa ${teacher.name}`}
												teacher={() => teacher}
												onSubmit={editT}
												cancel={setEditing(false)}
										/>
								</div>
						</Show>
				</>
		);
}

export default TeachersItem;