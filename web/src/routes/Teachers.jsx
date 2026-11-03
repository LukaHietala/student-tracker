import { createResource, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "@solidjs/router";
import { teacherService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "@solidjs/router";
import TeachersList from "../components/teachers/TeachersList";
import TeacherForm from "../components/teachers/TeacherForm";

function TeachersPage() {
		const { user } = useAuth();
		const navigate = useNavigate();

		const [addingTeacher, setAddingTeacher] = createSignal(false);

		const [teachers, { refetch }] = createResource(
				() => user() && user().id,
				async () => {
						return await teacherService.listAll();
				},
		);

		const deleteTeacher = async (id) => {
				await teacherService.deleteByID(id);
				await refetch();
		};

		const addTeacher = async (data) => {
				try {
						await teacherService.create(data);
				} catch (e) {
						console.error(e.message);
				}

				setAddingTeacher(false);

				await refetch();
		};

		const editTeacher = async (data, id) => {
				try {
						await teacherService.updateByID(data, id);
				} catch (e) {
						console.error(e.message);
				}

				await refetch();
		};

		const [store, setStore] = createStore({
				teacher: {
						name: "",
						password: "",
				},
		});

		return (
				<ErrorBoundary fallback={<p>Opettajien haku epäonnistui</p>}>
            <h3>Opettajat</h3>
						<div class="stack">
								<Show
										when={addingTeacher()}
										fallback={
												<div class="block-row">
														<div></div>
														<button
																class="btn-primary"
																onClick={() => setAddingTeacher(true)}
														>
																Lisää opettaja
														</button>
												</div>
										}
								>
										<div>
												<TeacherForm
														title="Luodaan opettajaa"
														teacher={() => store.teacher}
														onSubmit={addTeacher}
														cancel={setAddingTeacher(false)}
												/>
										</div>
								</Show>
								<Suspense fallback={<p>Ladataan...</p>}>
										<TeachersList
												teachers={teachers}
												editTeacher={editTeacher}
												deleteTeacher={deleteTeacher}
										/>
								</Suspense>
						</div>
				</ErrorBoundary>
		);
}

export default TeachersPage;