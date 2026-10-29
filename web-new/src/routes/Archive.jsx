import { createResource, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import { studentService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "@solidjs/router";
import ArchiveList from "../components/archive/ArchiveList";

function ArchivePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

		const [archive, { refetch }] = createResource(
        () => user() && user().id,
        async () => {
            return await studentService.listAllArchived();
        },
    );
    
    return (
        <ErrorBoundary fallback={<p>Could not fetch archive</p>}>
            <Suspense fallback={<p>Loading archive...</p>}>
								<ArchiveList archive={archive}/>
            </Suspense>
        </ErrorBoundary>
    );
}

export default ArchivePage