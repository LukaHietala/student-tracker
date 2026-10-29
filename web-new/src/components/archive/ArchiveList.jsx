import ArchiveItem from "./ArchiveItem.jsx";

function ArchiveList(props) {
    return (
				<For each={props.archive()}>{(item) =>
            <div class="item">
								<ArchiveItem student={item}/>
            </div>
        }</For>
    );
}

export default ArchiveList