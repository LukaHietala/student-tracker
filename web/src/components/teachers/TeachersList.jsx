import TeachersItem from "./TeachersItem.jsx";

function TeachersList(props) {
		return (
				<div class="list">
            <For each={props.teachers()}>{(item) =>
                    <TeachersItem teacher={item} editTeacher={props.editTeacher} deleteTeacher={props.deleteTeacher}/>
            }</For>
				</div>
		);
}

export default TeachersList