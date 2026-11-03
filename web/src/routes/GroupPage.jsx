import { createResource, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams, useNavigate } from "@solidjs/router";
import { groupService } from "../services";
import { studentService } from "../services";
import { toast } from "../scripts/toast.js";
import { useAuth } from "../context/AuthContext.jsx";
import StudentList from "../components/group/StudentList.jsx";
import EditStudent from "../components/student/EditStudent";
import GroupForm from "../components/groups/GroupForm";
import MassForm from "../components/group/MassForm";

function GroupPage() {
	const { user } = useAuth();
	const params = useParams();
	const navigate = useNavigate();

	const [editing, setEditing] = createSignal(false);
	const [massEditing, setMassEditing] = createSignal(false);
	const [addingStudent, setAddingStudent] = createSignal(false);

	const [group, { refetch: refetchGroup }] = createResource(
		() => user() && user().id,
		async () => {
			return await groupService.findByID(params.id);
		},
	);

	const [students, { refetch: refetchStudents }] = createResource(
		() => user() && user().id,
		async () => {
			return await groupService.listGroupStudents(params.id);
		},
	);

	const [store, setStore] = createStore({
		student: {
			uid: "",
			name: "",
			status: "OUT",
			startDate: "",
			endDate: "",
			schedule: [
				{ start: "08:00:00", end: "16:00:00" },
				{ start: "08:00:00", end: "16:00:00" },
				{ start: "08:00:00", end: "16:00:00" },
				{ start: "08:00:00", end: "16:00:00" },
				{ start: "08:00:00", end: "16:00:00" },
				null,
				null,
			],
			doneSeconds: 0,
			excludedDays: [],
			breakTime: 0,
		},
	});

	const addStudent = async (data) => {
		data.breakTime *= 60; // backend takes in seconds

		try {
			await groupService.createStudent(group().id, data);
			toast(`Lisättiin oppilas: ${data.name}`);
		} catch (e) {
			console.error(e.message);
		}

		setAddingStudent(false);

		await refetchStudents();
	};

	const editGroup = async (data) => {
		try {
			await groupService.updateByID(group().id, data);
		} catch (e) {
			console.error(e.message);
		}

		setEditing(false);

		await refetchGroup();
	};

	// Overwrite old properies
	const editReplaceAll = async (data) => {
		if (data.breakTime) data.breakTime *= 60;

		let updated = 0;
		try {
			const sts = await groupService.listGroupStudents(group().id);
			for (const stud of sts) {
				const newS = { ...stud, ...data };
				studentService.updateByID(stud.id, newS);
				updated++;
			}
		} catch (e) {
			console.error(e.message);
		}

		toast(`Päivitettiin ${updated} oppilasta`);
		setMassEditing(false);
	};

	// Combine with old (exclusively for calendar/excludedDays)
	const editAddAll = async (data) => {
		let updated = 0;
		try {
			const sts = await groupService.listGroupStudents(group().id);
			for (const stud of sts) {
				const newEx = { excludedDays: stud.excludedDays.concat(data.excludedDays) };
				const newS = { ...stud, ...newEx };
				console.error("TODOODODODO");
				studentService.updateByID(stud.id, newS);
				updated++;
			}
		} catch (e) {
			console.error(e.message);
		}

		setMassEditing(false);
		toast(`Päivitettiin ${updated} oppilasta`);
	};

	return (
		<ErrorBoundary fallback={<p>Could not fetch group</p>}>
			<Suspense fallback={<p>Loading group...</p>}>
				<h3>{group()?.name}</h3>
				<section class="stack">
					<Show
						when={editing()}
						fallback={
							<div class="block-row">
								<div></div>
								<div style="gap: 4px; display: inline-flex;">
									<button
										class="btn-secondary"
										onClick={() => setEditing(true)}
									>
										Muokkaa
									</button>
									<button
										onClick={() => {
											groupService.archiveByID(group().id);
											navigate(`/`, { replace: true });
										}}
										class="btn-primary"
									>
										Arkistoi
									</button>
								</div>
							</div>
						}
					>
						<GroupForm
							title={`Muokataan ryhmää: ${group().name}`}
							group={group}
							onSubmit={editGroup}
							cancel={setEditing(false)}
						/>
					</Show>

                    <h4>Oppilaat</h4>
					<Switch>
						<Match when={!addingStudent() && !massEditing()}>
							<div class="block-row">
								<div></div>
								<div style="gap: 4px; display: inline-flex;">
									<Show
										when={massEditing()}
										fallback={
											<button
												class="btn-secondary"
												onClick={() => setMassEditing(true)}
											>
												{" "}
												Massamuokkaus{" "}
											</button>
										}
									></Show>
									<button
										class="btn-primary"
										onClick={() => setAddingStudent(true)}
									>
										Lisää
									</button>
								</div>
							</div>
							<Show
								when={students() && students().length > 0}
								fallback={<p>No students</p>}
							>
								<StudentList students={students} />
							</Show>
						</Match>
						<Match when={massEditing()}>
							<MassForm
								onReplace={editReplaceAll}
								onAdd={editAddAll}
								cancel={setMassEditing(false)}
							/>
						</Match>
						<Match when={addingStudent()}>
							<EditStudent
                                title="Luodaan opiskelijaa"
								student={() => store.student}
								onSubmit={addStudent}
								cancel={setAddingStudent(false)}
							/>
						</Match>
					</Switch>
				</section>
			</Suspense>
		</ErrorBoundary>
	);
}

export default GroupPage;