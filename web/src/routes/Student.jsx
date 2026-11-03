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
        <Show when={student()}>
        <h3>{student().name}</h3>
                <div class="stack">
                    <Show when={!isEditing()} fallback={<EditStudent title={`Muokataan opiskelijaa ${student().name}`}student={student} onSubmit={editStudent} cancel={setIsEditing(false)}/>}>
                        <div class="block-row">
                            <div></div>
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
                        <h4>Perustiedot</h4>
                        <div class="block-col">
                            <span>Kortin UID: {student().uid}</span><br/>
                            <span>Työjakso: {student().startDate} - {student().endDate}</span>
                        </div>
                        <h4>Tilanne</h4>
                        <div class="block-col">
                            <span>Tila: {student().status === "IN" ? "Sisällä" : "Ulkona"}</span><br/>
                            <span>Töitä tehty: {student().doneSeconds}</span><br/>
                            <span>Töitä jäljellä: {student().remaining}</span>
                        </div>
                        <h4>Työjärjestys</h4>
                        <div class="block-col">
                            <For each={student().schedule}>
                              {(item, index) =>
                                   <Show when={item} fallback={<div>{`${days[index()]} - Vapaa`}</div>}>
                                    <div>{`${days[index()]} ${item?.start} - ${item?.end}`}</div>
                                  </Show>
                              }
                            </For>
                        </div>
                        <h4>Kalenteri</h4>
                        <div class="block-col">
                        </div>
                        <h4>Muut tiedot</h4>
                        <div class="block-col">
                        </div>
                        <h4>Skannaus loki</h4>
                        <Scans id={student().id}/>
                    </Show>
                </div>
        </Show>
            </Suspense>
        </ErrorBoundary>
    );
}

export default StudentPage;