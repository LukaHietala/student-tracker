import { handleResponse } from ".";

const baseUrl = "/api/students";

export const studentService = {
	listAll: () => fetch(`${baseUrl}/`).then(handleResponse),

	listAllArchived: () => fetch(`${baseUrl}/archived`).then(handleResponse),

	findByID: (id) => fetch(`${baseUrl}/${id}`).then(handleResponse),

	create: (data) =>
		fetch(`${baseUrl}/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}).then(handleResponse),

	updateByID: (id, data) =>
		fetch(`${baseUrl}/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		}).then(handleResponse),

	archiveByID: (id) =>
		fetch(`${baseUrl}/${id}`, {
			method: "DELETE",
		}).then(handleResponse),
};
