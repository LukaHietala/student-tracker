import DeviceItem from "./DeviceItem.jsx";

function DeviceList(props) {
		return (
				<div class="list">
						<For each={props.devices()}>
								{(item) => (
										<div class="item">
												<DeviceItem
														device={item}
														deleteDevice={props.deleteDevice}
												/>
										</div>
								)}
						</For>
				</div>
		);
}

export default DeviceList;
