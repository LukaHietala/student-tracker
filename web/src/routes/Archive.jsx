import { createResource, createSignal } from "solid-js";
import { studentService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import ArchiveList from "../components/archive/ArchiveList";

function ArchivePage() {
	const { user } = useAuth();

	const [archive] = createResource(
		() => user() && user().id,
		async () => {
			return await studentService.listAllArchived();
		},
	);

	return (
		<ErrorBoundary fallback={<p>Arkiston hakeminen epäonnistui</p>}>
			<h3>Arkisto</h3>
			<Suspense fallback={<p>Ladataan...</p>}>
				<ArchiveList archive={archive} />
			</Suspense>
		</ErrorBoundary>
	);
}

export default ArchivePage;