import { handleResponse } from ".";

const baseUrl = "/api/scans";

export const scanService = {
	listAll: () => fetch(`${baseUrl}/`).then(handleResponse),
	listStudentScans: (id) => fetch(`${baseUrl}/student/${id}`).then(handleResponse),
};