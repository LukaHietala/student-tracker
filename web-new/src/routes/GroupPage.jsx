import { createResource, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "@solidjs/router";
import { groupService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import StudentList from "../components/group/StudentList.jsx";
import EditStudent from "../components/student/EditStudent";

function GroupPage() {
    const { user } = useAuth();
    const params = useParams();

    const [addingStudent, setAddingStudent] = createSignal(false);

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

		const [store, setStore] = createStore({
				student: {
						"uid": "a4790f85",
						"name": "Matti meikäläinen",
						"status": "OUT",
						"startDate": "2026-09-21",
						"endDate": "2026-09-25",
						"schedule": [
								{"start": "08:00:00", "end": "16:00:00"}, 
								{"start": "08:00:00", "end": "16:00:00"}, 
								{"start": "08:00:00", "end": "16:00:00"}, 
								{"start": "08:00:00", "end": "16:00:00"}, 
								{"start": "08:00:00", "end": "16:00:00"}, 
								null,
								null
						],
						"doneSeconds": 0,
						"excludedDays": [],
						"breakTime": 120,
						"remaining": 143500,
						"isArchived": true,
						"createdAt": "2026-10-21 10: 30: 10"
				}
		});

		const addStudent = async (data) => {
        data.breakTime *= 60; // backend takes in seconds

        try {
            await groupService.createStudent(group().id, data);
        } catch (e) {
            console.error(e.message);
        }

        setAddingStudent(false)

        await refetch();
    };

    return (
        <ErrorBoundary fallback={<p>Could not fetch group</p>}>
            <Suspense fallback={<p>Loading group...</p>}>
                <h3>{group()?.name}</h3>
                <h4>Oppilaat</h4>
                <section class="stack">
                    <Show when={addingStudent()}
                          fallback={
                              <div class="block-row">
                                  <div></div>
                                  <div style="gap: 4px; display: inline-flex;">
                                      <button class="btn-secondary">
                                          Massamuokkaus
                                      </button>
                                      <button class="btn-primary"
                                              onClick={() => setAddingStudent(true)}>
                                          Lisää oppilas
                                      </button>
                                  </div>
                              </div>
                          }>
                        <EditStudent student={() => store.student} onSubmit={addStudent} cancel={setAddingStudent(false)}/>
                    </Show>
                    <Show when={students() && students().length > 0} fallback={<p>No students</p>}>
                        <StudentList students={students}/>
                    </Show>
                </section>
            </Suspense>
        </ErrorBoundary>
    );
}

export default GroupPage