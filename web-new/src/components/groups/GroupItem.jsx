import { useNavigate } from "@solidjs/router";

function GroupItem(props) {
		const navigate = useNavigate();
        const group = props.group
		
		return (
            <>
                <div>
                    <span>{group.name}</span><br />
                    <span class="small">
                        {`Luotu: ${group.createdAt}`}
                    </span>
                </div>
                <div>
                    <button class="btn-primary" onClick={() => {navigate(`/groups/${group.id}`)}}>Näytä</button>
                </div>
            </>
		);
}

export default GroupItem;
