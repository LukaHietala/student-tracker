import { createResource } from "solid-js";
import { useParams } from "@solidjs/router";
import { groupService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import StudentList from "../components/group/StudentList.jsx";

function GroupPage() {
		const { user } = useAuth();
		const params = useParams();

		const [group] = createResource(
				() => user() && user().id,
				async () => {
						return await groupService.findByID(params.id);
				},
		);

		const [students] = createResource(
				() => user() && user().id,
				async () => {
						return await groupService.listGroupStudents(params.id);
				},
		);

		return (
				<ErrorBoundary fallback={<p>Could not fetch group</p>}>
						<Suspense fallback={<p>Loading group...</p>}>
								{JSON.stringify(group())}
								<StudentList students={students}/>
						</Suspense>
				</ErrorBoundary>
		);
}

export default GroupPage;