import { useNavigate } from "@solidjs/router";

function StudentItem(props) {
		const navigate = useNavigate();
		const student = props.student
		return (
            <>
                <div>
                    <span>{student.name}</span><br />
                    <span class="small">
                        {`${student.status === "IN" ? "Tila: Sisällä" : "Tila: Ulkona"} - Kortin UID: ${student.uid}`}
                    </span>
                </div>
                <div>
                    <button class="btn-primary" onClick={() => {navigate(`/students/${student.id}`)}}>Näytä</button>
                </div>
            </>
		);
}

export default StudentItem;