import ArchiveItem from "./ArchiveItem.jsx";

function ArchiveList(props) {
    return (
        <div class="list">
            <For each={props.archive()}>{(item) =>
                <ArchiveItem student={item} />
            }</For>
        </div>
    );
}

export default ArchiveList