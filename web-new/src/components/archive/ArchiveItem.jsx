import Scans from "../common/Scans.jsx";

function ArchiveItem(props) {
		const student = props.student
		return (
        <>
            <div>
                <span>{student.name}</span><br />
            </div>
            <div>
                <button class="btn-primary">Skannaukset</button>
            </div>
						<Scans id={student.id}/>
        </>
		);
}

export default ArchiveItem