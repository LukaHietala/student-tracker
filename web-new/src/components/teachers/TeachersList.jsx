import TeachersItem from "./TeachersItem.jsx";

function TeachersList(props) {
		return (
				<div class="list">
            <For each={props.teachers()}>{(item) =>
                <div class="item">
                    <TeachersItem teacher={item} deleteTeacher={props.deleteTeacher}/>
                </div>
            }</For>
				</div>
		);
}

export default TeachersList