/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App.jsx";
import './index.css'

import GroupsPage from "./routes/Groups";
import GroupPage from "./routes/GroupPage";
import StudentPage from "./routes/Student";
import TeachersPage from "./routes/Teachers";
import ArchivePage from "./routes/Archive";
import LoginPage from "./routes/auth/Login";
import LogoutPage from "./routes/auth/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import AnonymousRoute from "./components/AnonymousRoute";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebsocketContext";

const root = document.getElementById("root");

render(
		() => (
				<Router root={App}>
						<Route component={AuthProvider}>
						    <Route component={WebSocketProvider}>
										<Route component={AnonymousRoute}>
												<Route
														path="/login"
														component={LoginPage}
												/>
										</Route>

										<Route component={ProtectedRoute}>
												<Route component={MainLayout}>
														<Route
																path="/"
																component={GroupsPage}
														/>
														<Route
																path="/groups/:id"
																component={GroupPage}
														/>
														<Route
																path="/students/:id"
																component={StudentPage}
														/>
														<Route
																path="/teachers"
																component={TeachersPage}
														/>
														<Route
																path="/archive"
																component={ArchivePage}
														/>
														<Route
																path="/logout"
																component={LogoutPage}
														/>
												</Route>
										</Route>
                </Route>
						</Route>
				</Router>
		),
		root,
);
