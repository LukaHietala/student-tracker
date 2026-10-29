import { createResource, createSignal } from "solid-js";
import { scanService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";

function Scans(props) {
    const { user } = useAuth();

    const [startFilter, setStartFilter] = createSignal("");
    const [endFilter, setEndFilter] = createSignal("");
    
    const [scans] = createResource(
        () => user() && user().id,
        async () => {
            return await scanService.listStudentScans(props.id);
        },
    );
    
    return (
        <div class="search-list">
            <div class="search-list-filter">
                <label for="startDate">Aloitus päivä:</label>
                <input
                    type="date"
                    name="startDate"
                    value={startFilter()}
                    onInput={(e) => setStartFilter(e.currentTarget.value)}
                />
                <label for="endDate">Lopetus päivä:</label>
                <input
                    type="date"
                    name="endDate"
                    value={endFilter()}
                    onInput={(e) => setEndFilter(e.currentTarget.value)}
                />
            </div>
            <ErrorBoundary fallback={<p>Skannausten hakeminen epäonnistui</p>}>
                <Suspense fallback={<p>Ladataan...</p>}>
                    <Show when={scans()}>
                        <Show when={scans().length == 0}>
                            <div class="search-list-item">
                                <span>No scans</span>
                            </div>
                        </Show>
                        <For each={scans().filter((scan) => {
                                 const scanT = new Date(parseInt(scan.timestamp + "000"));
                                 if (startFilter()) {
                                     const sT = new Date(startFilter());
                                     if (endFilter()) {
                                         const eT = new Date(endFilter());
                                         return scanT > sT && scanT < eT;
                                     } else {
                                         return scanT > sT;
                                     }
                                 } else if (endFilter()) {
                                     const eT = new Date(endFilter());
                                     return scanT < eT;
                                 } else return true;
                             })}>{(item) =>
                                 <div class="search-list-item">
                                     <span>
                                        {`${item.timestamp} - ${item.newStatus === "IN" ? "Skannattiin sisään" : "Skannattiin ulos"}`}
                                    </span>
                                 </div>
                             }</For>
                    </Show>
                </Suspense>
                </ErrorBoundary>
        </div>
    );
}

export default Scans;