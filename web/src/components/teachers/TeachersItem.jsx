import { createSignal } from "solid-js";
import TeacherForm from "./TeacherForm.jsx";
import penIcon from "../../assets/pen.svg"
import canIcon from "../../assets/can.svg"

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
												class="btn-icon"
												onClick={() => setEditing(!editing())}
										>
                        <img src={penIcon} alt="Muokkaa" />
										</button>
										<button
												class="btn-icon"
												onClick={() => props.deleteTeacher(teacher.id)}
										>
                        <img src={canIcon} alt="Poista" />
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