import { createResource, createSignal } from "solid-js";
import { scanService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";

function Scans(props) {
		const { user } = useAuth();

		const [startFilter, setStartFilter] = createSignal("");
		const [endFilter, setEndFilter] = createSignal("");
		
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
												<Show when={scans()}>
														<p>Filter results:</p>
														<input
																type="date"
																value={startFilter()}
																onInput={(e) => setStartFilter(e.currentTarget.value)}
														/>
														<input
																type="date"
																value={endFilter()}
																onInput={(e) => setEndFilter(e.currentTarget.value)}
														/> { startFilter() }
														<Show when={scans().length == 0}>
																No scans
														</Show>
														<For each={scans().filter((scan) => {
																		 const scanT = new Date(parseInt(scan.timestamp + "000"));
																		 if (startFilter()) {
																				 const sT = new Date(startFilter());
																				 if (endFilter()) {
																						 const eT = new Date(endFilter());
																						 return scanT > sT && scanT < eT;
																				 } else {
																						 return scanT > sT;
																				 }
																		 } else if (endFilter()) {
																				 const eT = new Date(endFilter());
																				 return scanT < eT;
																		 } else return true;
																 })}>{(item) =>
																		 <li>
																				 {JSON.stringify(item)}
																		 </li>
																 }</For>
												</Show>
										</Suspense>
								</ErrorBoundary>
								
						</ul>
				</>
		);
}

export default Scans;