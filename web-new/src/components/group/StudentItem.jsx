import { useNavigate } from "@solidjs/router";

function StudentItem(props) {
		const navigate = useNavigate();
		const student = props.student
        const title = `${student.name} - ${student.remaining} ${student.status == 'IN' ? 'Status: Inside' : 'Status: Outside'}`
		return (
            <>
                <span>{title}</span><br />
                <span class="small">{"Card UID: " + student.uid}</span>
            </>
		);
}

export default StudentItem;