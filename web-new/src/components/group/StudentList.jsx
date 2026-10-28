import StudentItem from "./StudentItem.jsx";

function StudentList(props) {
		return (
				<div class="list">
                    <For each={props.students()}>{(item) =>
                            <div class="item">
                                    <StudentItem student={item}/>
                            </div>
                    }</For>
				</div>
		);
}

export default StudentList;