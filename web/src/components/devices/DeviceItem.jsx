function DeviceItem(props) {
	const device = props.device;
	return (
		<>
			<div>
				<span>{device.name}</span>
				<br />
				<span class="small">{device.secretKey}</span>
			</div>
			<div>
				<button
					class="btn-primary"
					onClick={() => props.deleteDevice(device.id)}
				>
					Poista
				</button>
			</div>
		</>
	);
}

export default DeviceItem;