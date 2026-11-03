import { createResource, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { deviceService } from "../services";
import { useAuth } from "../context/AuthContext.jsx";
import DeviceList from "../components/devices/DeviceList";
import DeviceForm from "../components/devices/DeviceForm";

function DevicePage() {
	const { user } = useAuth();

	const [addingDevice, setAddingDevice] = createSignal(false);

	const [devices, { refetch }] = createResource(
		() => user() && user().id,
		async () => {
			return await deviceService.listAll();
		},
	);

	const deleteDevice = async (id) => {
		await deviceService.deleteByID(id);
		await refetch();
	};

	const addDevice = async (data) => {
		try {
			await deviceService.create(data);
		} catch (e) {
			console.error(e.message);
		}
		setAddingDevice(false);

		await refetch();
	};

	const [store, setStore] = createStore({
		device: {
			name: "",
		},
	});

	return (
		<ErrorBoundary fallback={<p>Laitteiden hakeminen epäonnistui</p>}>
			<h3>Laitteet</h3>
			<div class="stack">
				<Show
					when={addingDevice()}
					fallback={
						<div class="block-row">
							<div></div>
							<button
								class="btn-primary"
								onClick={() => setAddingDevice(true)}
							>
								Lisää laite
							</button>
						</div>
					}
				>
					<DeviceForm
                        title="Luodaan laite"
						device={() => store.device}
						onSubmit={addDevice}
						cancel={setAddingDevice(false)}
					/>
				</Show>
				<Suspense fallback={<p>Ladataan...</p>}>
					<DeviceList
						devices={devices}
						deleteDevice={deleteDevice}
					/>
				</Suspense>
			</div>
		</ErrorBoundary>
	);
}

export default DevicePage;