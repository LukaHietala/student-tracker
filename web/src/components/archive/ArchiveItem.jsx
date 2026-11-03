import Scans from "../common/Scans.jsx";
import { createSignal } from "solid-js"

function ArchiveItem(props) {
    const [showScans, setShowScans] = createSignal(false)
		const student = props.student

		return (
        <>
            <div class="item">
                <div>
                    <span>{student.name}</span><br />
                </div>
                <div>
                    <button class="btn-primary" onClick={() => {setShowScans(!showScans())}}>Skannaukset</button>
                </div>
            </div>
            <Show when={showScans()}>
                <div class="item" style="background-color: var(--bg);">
                    <Scans id={student.id}/>
                </div>
            </Show>
        </>
		);
}

export default ArchiveItem