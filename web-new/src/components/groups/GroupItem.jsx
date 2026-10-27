import { useNavigate } from "@solidjs/router";

function GroupItem(props) {
		const navigate = useNavigate();
		
		return (
				<>
						<button onClick={() => {
												navigate(`/groups/${props.group.id}`, { replace: true });
										}}>
								{props.group.name}
						</button>
				</>
		);
}

export default GroupItem;
