import { createResource } from "solid-js";
import { groupService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import GroupList from "../components/groups/GroupList.jsx";

function GroupsPage() {
		const { user } = useAuth();

		const [groups] = createResource(
				() => user() && user().id,
				async () => {
						return await groupService.listAll();
				},
		);

		return (
				<ErrorBoundary fallback={<p>Could not fetch groups</p>}>
                        <h3>Groups</h3>
						<Suspense fallback={<p>Loading groups...</p>}>
								<GroupList groups={groups}/>
						</Suspense>
				</ErrorBoundary>
		);
}

export default GroupsPage;
