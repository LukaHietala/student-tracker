import { useNavigate } from "@solidjs/router";

function GroupItem(props) {
		const navigate = useNavigate();
		
		return (
				<a href={`/groups/${props.group.id}`}>
                    {props.group.name}
				</a>
		);
}

export default GroupItem;
