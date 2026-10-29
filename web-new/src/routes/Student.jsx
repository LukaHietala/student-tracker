import { createResource, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import { studentService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "@solidjs/router";
import Scans from "../components/common/Scans";
import EditStudent from "../components/student/EditStudent";

const days = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"]

function StudentPage() {
    const { user } = useAuth();
    const params = useParams();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = createSignal(false);

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

        setIsEditing(false)

        await refetch();
    };
    
    return (
        <ErrorBoundary fallback={<p>Opiskelijan haku epäonnistui</p>}>
            <Suspense fallback={<p>Ladataan...</p>}>
                <div class="stack">
                <Show when={student()}>
                    <Show when={!isEditing()} fallback={<EditStudent student={student} onSubmit={editStudent} cancel={setIsEditing(false)}/>}>
                        <div class="block-col">
                            {JSON.stringify(student())}
                            <span>Työjärjestys</span>
                            <For each={student().schedule}>
                              {(item, index) =>
                                   <Show when={item} fallback={<div>{`${days[index()]} - Vapaa`}</div>}>
                                    <div>{`${days[index()]} ${item?.start} - ${item?.end}`}</div>
                                  </Show>
                              }
                            </For>
                        </div>
                        <div class="block-row">
                            <div style="display: inline-flex; gap: 4px;">
                                <button onClick={() => setIsEditing(!isEditing()) } class="btn-primary">
                                    Muokkaa
                                </button>
                                <button onClick={() => {
                                    studentService.archiveByID(student().id);
                                    navigate(`/groups/${student().groupId}`, { replace: true });
                                }} class="btn-primary">
                                    Arkistoi
                                </button>
                            </div>
                        </div>
                        <Scans id={student().id}/>
                    </Show>
                </Show>
                </div>
            </Suspense>
        </ErrorBoundary>
    );
}

export default StudentPage;