import StudentItem from "./StudentItem.jsx";

function StudentList(props) {
		return (
				<>
						<ul>
								<For each={props.students()}>{(item) =>
										<li>
												<StudentItem student={item}/>
										</li>
								}</For>
						</ul>
				</>
		);
}

export default StudentList;