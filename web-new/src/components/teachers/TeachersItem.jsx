import { useNavigate } from "@solidjs/router";

function TeachersItem(props) {
		const navigate = useNavigate();
		const teacher = props.teacher
		return (
        <>
            <div>
                <span>{teacher.name}</span><br />
            </div>
            <div>
                <button class="btn-primary"
												onClick={() => props.deleteTeacher(teacher.id)}>
										Poista
								</button>
            </div>
        </>
		);
}

export default TeachersItem