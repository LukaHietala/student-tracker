import { useNavigate } from "@solidjs/router";

function StudentItem(props) {
		const navigate = useNavigate();
		
		return (
				<>
						<button onClick={() => {
												navigate(`/students/${props.student.id}`, { replace: true });
										}}>
								{props.student.name}
						</button>
				</>
		);
}

export default StudentItem;