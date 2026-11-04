import { createResource, createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { scanService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";

function Scans(props) {
    const { user } = useAuth();

    const [scans] = createResource(
        () => user() && user().id,
        async () => {
            return await scanService.listStudentScans(props.id);
        },
    );
    
    return (
        <div class="search-list">
            <ErrorBoundary fallback={<p>Skannausten hakeminen epäonnistui</p>}>
                <Suspense fallback={<p>Ladataan...</p>}>
                    <Show when={scans()}>
                        <Show when={scans().length == 0}>
                            <div class="search-list-item">
                                <span>No scans</span>
                            </div>
                        </Show>
                        <Timeline/>
                    </Show>
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

function Timeline(props)
{
		let canvas;
		let popup;
		
		const scans = [
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793010662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"OUT","timestamp":"1793020662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793050662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"OUT","timestamp":"1793080662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793100662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793200662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"OUT","timestamp":"1793230662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793400662","studentId":9,"groupId":2},
				//{"id":1,"uid":"de040f6c","newStatus":"OUT","timestamp":"1793800662","studentId":9,"groupId":2},
		];
		let hitboxes = [];

		// Time to start scroll at
		const fTime = parseInt(scans[0].timestamp) - (parseInt(scans[0].timestamp) % 3600);
		// Mouse variables
		let holding = false;
		let mouse = {x: 0, y: 0};
		// Current time scrolled to
		let startTime = fTime;
		// Zoom
		let scale = 3;
		// Canvas size
		const width = 800;
		const height = 150;
		// Timezone offsset
		const tz = (new Date(fTime)).getTimezoneOffset()*60*1000;

		// Clamp function
		const clamp = (x, a, b) => Math.max(a, Math.min(x, b));

		// Get color from some elment that has it
		const colour = window.getComputedStyle(document.querySelector("button")).getPropertyValue('--primary');
		
		function render()
		{
				const ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				
				// Render boxes
				let x = undefined;
				hitboxes = [];
				for (const scan of scans) {
						if (!x) {
								if (scan.newStatus === "OUT") {
										ctx.fillRect(0, 0, 123, 20);
										continue;
								}
								x = scan;
								continue;
						}
						// History has signs of manual tampering
						const warped = x.newStatus === scan.newStatus;
						
						const w = (parseInt(scan.timestamp) - parseInt(x.timestamp)) / 1000 * scale;
						const s = (parseInt(x.timestamp) - startTime) / 1000 * scale;
						
						hitboxes.push({x: s, w: w, start: x.timestamp, end: scan.timestamp, warped: warped});
						x = warped ? scan : undefined;

						if (warped)
								ctx.fillStyle = "red";
						else
								ctx.fillStyle = colour;
						ctx.fillRect(s, 0, w, height / 2.5);
				}
				// Ongoing scan
				if (x) {
						const w = (parseInt((new Date()).getTime() - tz) - (parseInt(x.timestamp) * 1000)) / 1000 / 1000 * scale;
						const s = (parseInt(x.timestamp) - startTime) / 1000 * scale;
						hitboxes.push({x: s, w: w, start: x.timestamp, warped: false});
						ctx.fillStyle = "grey";
						ctx.fillRect(s, 0, w, height / 2.5);
				}
				
				const secondsTotal = width * (1000 / scale);
				const offsetSeconds = ((scale < 1) ? 86400
															 : (scale < 2) ? 43200
															 : (scale < 3) ? 18000
															 : (scale < 5) ? 14400
															 : (scale < 10) ? 7200
															 : 3600);
				const offset = offsetSeconds / 1000 * scale;
				const showDate = scale < 2;
				const canFit = Math.ceil(width / offset);

				// Render time markers
				ctx.fillStyle = "black";
				ctx.font = "12px sans-serif";
				// luukas.kola@gmail.com jos on kysymyksiä! :)
				for (let i = 0; i < canFit; i++) {
						const x = (((fTime - startTime) / 1000 * scale) + i * offset);
						// Elements past the screen will loop back around
						const getx = (x, dir) => {
								if (x < 0 && (dir === "SMALL" || !dir)) {
										const { xA, ia } = getx(x + (canFit * offset), "SMALL");
										return { xA: xA, ia: ia + canFit };
								} else if (x > width && (dir === "BIG" || !dir)) {
										const { xA, ia } = getx(x - (canFit * offset), "BIG");
										return { xA: xA, ia: ia - canFit };
								} else return { xA: x, ia: 0 };
						};
						// Adjusted
						const { xA, ia } = getx(x);
						const iA = i + ia;
						// Time stuff
						const dif = (secondsTotal / width) * (iA * offset);
						const t = new Date(((fTime + dif)*1000)+tz);
						// Show date or time string
						if (showDate) {
								const daisy = t.getDate();
								const month = t.getMonth() + 1;
								const str = daisy + '.' + month;
								ctx.fillText(str, xA - 15, height * 0.6);
						} else {
								const hours = t.getHours();
								const minutes = "0" + t.getMinutes();
								const str = hours + ':' + minutes.substr(-2);
								ctx.fillText(str, xA - 15, height * 0.6);
						}
						ctx.fillRect(xA, height * 0.65, 1, height * 0.4);
				}

				// Extra info
				const t = new Date((startTime*1000)+tz);
				if (showDate) {
						const day = t.getDate();
						const month = t.getMonth() + 1;
						const year = t.getFullYear();
						ctx.fillText(`${day}.${month}.${year}`, 10, 20);
				} else {
						const hours = t.getHours();
						const minutes = "0" + t.getMinutes();
						const tstr = hours + ':' + minutes.substr(-2);;
						
						const day = t.getDate();
						const month = t.getMonth() + 1;
						ctx.fillText(`${tstr} ${day}.${month}`, 10, 20);
				}
		}

		function queryPopup()
		{
				let x = undefined;
				// Adjust mouse relative to div width being squeezed idk
				const mouseAX = mouse.relX * (width / (canvas.getBoundingClientRect().right - canvas.getBoundingClientRect().left));
				
				for (const hb of hitboxes) {
						if (mouseAX > hb.x && mouseAX < hb.x + hb.w && mouse.relY < height / 2.5) {
								popup.style.left = `${mouse.absX}px`;
								popup.style.top = `${mouse.absY + 20}px`;
								popup.style.visibility = "visible";

								const d1 = (new Date(parseInt(hb.start*1000)));
								const d1str = `${d1.toLocaleDateString()} ${d1.toLocaleTimeString()}`;
								if (hb.end) {
										const d2 = (new Date(parseInt(hb.end*1000)));
										const d2str = `${d2.toLocaleDateString()} ${d2.toLocaleTimeString()}`;
										const timeStr = `${d1} - ${d2}`;
										const warning = `
Tämä ajanväli sisältyy kahden samaan suuntaan kulkeneen skannauksen väliin.
Tämä tarkoittaa, että tietoja on manuaalisesti muutettu, ja on mahdotonta tietää kauanko oppilas on oikeasti ollut skannattuna sisään.`
										popup.innerHTML = hb.warped ? `${warning}<br/>${timeStr}`
												: timeStr;
								} else popup.innerHTML = `${d1str}`;
								return;
						}
						x = undefined;
				}
				popup.style.visibility = "hidden";
		}
		
		onMount(() => {
				let frame = requestAnimationFrame(render);
		});

		return (
				<>
						<canvas ref={canvas} width="800" height="150"
										onMouseDown={() => holding = true }
										onMouseUp={() => holding = false }
										onMouseLeave={() => {
												holding = false
												mouse = {x: null, y: null};
												queryPopup();
										}}
										onMouseMove={(event) => {
												mouse = {
														relX: event.offsetX, relY: event.offsetY,
														absX: event.pageX, absY: event.pageY,
														funX: event.offsetX * (width / (canvas.getBoundingClientRect().right - canvas.getBoundingClientRect().left)),
														funY: event.offsetY * (height / (canvas.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top))
												};
												queryPopup();
												if (holding) {
														startTime -= event.movementX * 400 / (scale / 2);
														render();
												}
										}}
										onWheel={(event) => {
												event.preventDefault();
												const oldScale = scale;
												scale = clamp(scale + -event.deltaY / 100, 0.5, 20);
												
												const secondsTotal = width * (1000 / scale);
												const center = startTime - (((secondsTotal / width) * mouse.funX));
												startTime = center - (center - startTime) * (scale / oldScale);
												render();
										}}
						></canvas>
						<div ref={popup}
								 style="position: absolute; visibility: hidden; background-color: white;">
						</div>
				</>
		);
}

export default Scans;