export async function handleResponse(response) {
	if (response.ok) {
		if (response.status === 204) {
			return null;
		}
		return response.json();
	}

	const err = await response
		.json()
		.then((data) => data.error)
		// Should not happen
		.catch(() => `Error: ${response.status}`);

	throw new Error(err);
}

export { groupService } from "./groupService.js";
export { scanService } from "./scanService.js";
export { teacherService } from "./teacherService.js";
export { deviceService } from "./deviceService.js";
export { authService } from "./authService.js";
export { studentService } from "./studentService.js";