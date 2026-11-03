import { createResource, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { groupService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import GroupList from "../components/groups/GroupList.jsx";
import GroupForm from "../components/groups/GroupForm.jsx";
import { toast } from "../scripts/toast.js"

function GroupsPage() {
	const { user } = useAuth();

	const [addingGroup, setAddingGroup] = createSignal(false);

	const [groups, { refetch }] = createResource(
		() => user() && user().id,
		async () => {
			return await groupService.listAll();
		},
	);

	const addGroup = async (data) => {
		try {
			await groupService.create(data);
		} catch (e) {
			console.error(e.message);
		}
		setAddingGroup(false);
        
        toast(`Lisättiin ryhmä: ${data.name}`)
		await refetch();
	};

	const editGroup = async (data, id) => {
		try {
			await groupService.updateByID(id, data);
		} catch (e) {
			console.error(e.message);
		}

		await refetch();
	};

	const [store, setStore] = createStore({
		group: {
			name: "",
		},
	});

	return (
		<ErrorBoundary fallback={<p>Ryhmien hakeminen epäonnistui</p>}>
			<h3>Ryhmät</h3>
			<div class="stack">
				<Show
					when={addingGroup()}
					fallback={
						<div class="block-row">
							<div></div>
							<button
								class="btn-primary"
								onClick={() => setAddingGroup(true)}
							>
								Lisää ryhmä
							</button>
						</div>
					}
				>
					<GroupForm
						title={`Luodaan ryhmää`}
						group={() => store.group}
						onSubmit={addGroup}
						cancel={setAddingGroup(false)}
					/>
				</Show>
				<Suspense fallback={<p>Ladataan...</p>}>
					<GroupList groups={groups} />
				</Suspense>
			</div>
		</ErrorBoundary>
	);
}

export default GroupsPage;
