import GroupItem from "./GroupItem.jsx";

function GroupList(props) {
		return (
				<ul>
						<For each={props.groups()}>{(item) =>
								<li>
										<GroupItem group={item}/>
								</li>
						}</For>
				</ul>
		);
}

export default GroupList;
