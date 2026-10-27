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

		const [showScans, setShowScans] = createSignal(false);

		const [student] = createResource(
				() => user() && user().id,
				async () => {
						return await studentService.findByID(params.id);
				},
		);

		return (
				<ErrorBoundary fallback={<p>Could not fetch student</p>}>
						<Suspense fallback={<p>Loading student...</p>}>
								{JSON.stringify(student())}
								<button onClick={() => {
														studentService.archiveByID(student().id);
														navigate(`/groups/${student().group_id}`, { replace: true });
												}}>
										Arkistoi
								</button>
								<button onClick={() => setShowScans(!showScans())}>
										Skannaukset
								</button>
								<Show when={showScans()}>
										<Scans id={student().id}/>
								</Show>
								<EditStudent/>
						</Suspense>
				</ErrorBoundary>
		);
}

export default StudentPage;