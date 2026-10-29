import { handleResponse } from ".";

const baseUrl = "/api/teachers";

export const teacherService = {
		listAll: () => fetch(`${baseUrl}/`).then(handleResponse),

		findByID: (id) => fetch(`${baseUrl}/${id}`).then(handleResponse),

		create: (data) =>
		fetch(`${baseUrl}/`, {
				method: "POST",
				headers: {
						"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
		}).then(handleResponse),

		updateByID: (data, id) =>
		fetch(`${baseUrl}/${id}`, {
				method: "PUT",
				headers: {
						"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
		}).then(handleResponse),

		deleteByID: (id) =>
		fetch(`${baseUrl}/${id}`, {
				method: "DELETE",
		}).then(handleResponse),
};