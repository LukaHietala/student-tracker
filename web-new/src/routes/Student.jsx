import { createResource, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import { studentService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "@solidjs/router";
import Scans from "../components/student/Scans";
import EditStudent from "../components/student/EditStudent";

function StudentPage() {
		const { user } = useAuth();
		const params = useParams();
		const navigate = useNavigate();

		const [tab, setTab] = createSignal("normal");

		const [student, { refetch }] = createResource(
				() => user() && user().id,
				async () => {
						const student = await studentService.findByID(params.id);
                        student.breakTime /= 60
                        return student
				},
		);

        const editStudent = async (data) => {
            data.breakTime *= 60 // backend takes in seconds

            try {
                await studentService.updateByID(student().id, data)
            } catch (e) {
                console.error(e.message)
            }

            await refetch();
        };
        
		return (
				<ErrorBoundary fallback={<p>Could not fetch student</p>}>
						<Suspense fallback={<p>Loading student...</p>}>
                            <button onClick={() => setTab("normal") }>
                                Normal
							</button>
                            <button onClick={() => setTab("edit") }>
                                Edit
							</button>
                            <button onClick={() => setTab("scans") }>
                                Scans 
							</button>
							<button onClick={() => {
								studentService.archiveByID(student().id);
								navigate(`/groups/${student().groupId}`, { replace: true });
							}}>
							    Arkistoi
							</button>
                            <Switch fallback={<p>Jaakon puutarha</p>}>
                                <Match when={tab() === "normal"}>
                                    <div>{JSON.stringify(student())}</div>
                                </Match>
                                <Match when={tab() === "scans"}>
                                            <Scans id={student().id}/>
                                </Match>
                                <Match when={tab() === "edit"}>
                                        <EditStudent student={student} onSubmit={editStudent}/>
                                </Match>
                          </Switch>
						</Suspense>
				</ErrorBoundary>
		);
}

export default StudentPage;