import GroupItem from "./GroupItem.jsx";

function GroupList(props) {
		return (
				<div class="list">
						<For each={props.groups()}>{(item) =>
								<div class="item">
										<GroupItem group={item}/>
								</div>
						}</For>
				</div>
		);
}

export default GroupList;
