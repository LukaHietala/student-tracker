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
		}

		const [store, setStore] = createStore({
				teacher: {
						"name": "Matti meikäläinen",
						"password": "1234"
				}
		});
    
    return (
        <ErrorBoundary fallback={<p>Could not fetch teachers</p>}>
            <Suspense fallback={<p>Loading teachers...</p>}>
								<Show when={addingTeacher()}
											fallback={<button onClick={() => setAddingTeacher(true)}>
																		 Lisää opettaja
																</button>
															 }
								>
										<div>
												<TeacherForm teacher={() => store.teacher} onSubmit={() => null} cancel={setAddingTeacher(false)}/>
										</div>
								</Show>
								<TeachersList teachers={teachers} deleteTeacher={deleteTeacher}/>
            </Suspense>
        </ErrorBoundary>
    );
}

export default TeachersPage