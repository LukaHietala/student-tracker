import { createResource } from "solid-js";
import { scanService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";

function Scans(props) {
		const { user } = useAuth();
		
		const [scans] = createResource(
				() => user() && user().id,
				async () => {
						return await scanService.listStudentScans(props.id);
				},
		);
		
		return (
				<>
						<ul>
								<ErrorBoundary fallback={<p>Could not fetch scans</p>}>
										<Suspense fallback={<p>Loading scans...</p>}>
												<Show when={scans() && scans().length == 0}>
														Ei skannauksia
												</Show>
												<For each={scans()}>{(item) =>
														<li>
																{JSON.stringify(item)}
														</li>
												}</For>
										</Suspense>
								</ErrorBoundary>
								
						</ul>
				</>
		);
}

export default Scans;