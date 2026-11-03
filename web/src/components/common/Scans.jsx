import { createResource, createSignal, onMount } from "solid-js";
import { render } from "solid-js/web";
import { scanService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";

function Scans(props) {
    const { user } = useAuth();

    const [startFilter, setStartFilter] = createSignal("");
    const [endFilter, setEndFilter] = createSignal("");
    
    const [scans] = createResource(
        () => user() && user().id,
        async () => {
            return await scanService.listStudentScans(props.id);
        },
    );
    
    return (
        <div class="search-list">
            <div class="search-list-filter">
                <label for="startDate">Aloitus päivä:</label>
                <input
                    type="date"
                    name="startDate"
                    value={startFilter()}
                    onInput={(e) => setStartFilter(e.currentTarget.value)}
                />
                <label for="endDate">Lopetus päivä:</label>
                <input
                    type="date"
                    name="endDate"
                    value={endFilter()}
                    onInput={(e) => setEndFilter(e.currentTarget.value)}
                />
            </div>
            <ErrorBoundary fallback={<p>Skannausten hakeminen epäonnistui</p>}>
                <Suspense fallback={<p>Ladataan...</p>}>
                    <Show when={scans()}>
                        <Show when={scans().length == 0}>
                            <div class="search-list-item">
                                <span>No scans</span>
                            </div>
                        </Show>
                        <For each={scans().filter((scan) => {
                                 const scanT = new Date(parseInt(scan.timestamp + "000"));
                                 if (startFilter()) {
                                     const sT = new Date(startFilter());
                                     if (endFilter()) {
                                         const eT = new Date(endFilter());
                                         return scanT > sT && scanT < eT;
                                     } else {
                                         return scanT > sT;
                                     }
                                 } else if (endFilter()) {
                                     const eT = new Date(endFilter());
                                     return scanT < eT;
                                 } else return true;
                             })}>{(item) =>
                                 <div class="search-list-item">
                                     <span>
                                        {`${item.timestamp} - ${item.newStatus === "IN" ? "Skannattiin sisään" : "Skannattiin ulos"}`}
                                    </span>
                                 </div>
                             }
												</For>
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
		const scans = [
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793010662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"OUT","timestamp":"1793020662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"IN","timestamp":"1793050662","studentId":9,"groupId":2},
				{"id":1,"uid":"de040f6c","newStatus":"OUT","timestamp":"1793080662","studentId":9,"groupId":2},
		];

		const fTime = parseInt(scans[0].timestamp) - (parseInt(scans[0].timestamp) % 3600);
		
		let startTime = fTime;
		let holding = false;
		let scale = 3;

		const tz = (new Date(fTime)).getTimezoneOffset()*60*1000;
		
		const clamp = (x, a, b) => Math.max( a, Math.min(x, b) );
		
		function render()
		{
				const ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = "green";
				
				let x = undefined;
				for (const scan of scans) {
						if (!x) {
								if (scan.newStatus === "OUT") {
										ctx.fillRect(0, 0, 123, 20);
										continue;
								}
								x = scan;
								continue;
						}
						if (x.newStatus === scan.newStatus) //TODO!!!!!
								continue;

						const w = (parseInt(scan.timestamp) - parseInt(x.timestamp)) / 1000 * scale;
						const s = (parseInt(x.timestamp) - startTime) / 1000 * scale;
						x = undefined;
						
						ctx.fillRect(s, 0, w, 25);
				}

				ctx.fillStyle = "black";
				ctx.font = "8px serif";
				
				const secondsTotal = 200 * (1000 / scale);
				const offset = ((scale < 2) ? 7200
												:(scale < 3) ? 3600
												:(scale < 5) ? 2400
												:(scale < 10) ? 1200
												: 600)
							/ (200 / scale);
				const pippeli = "kikkeli";

				const canFit = Math.ceil(200 / offset);

				// luukas.kola@gmail.com jos on kysymyksiä! :)
				for (let i = 0; i < canFit; i++) {
						const x = (((fTime - startTime) / 1000 * scale) + i * offset);
						// Loop 
						const getx = (x, dir) => {
								if (x < 0 && (dir === "SMALL" || !dir)) {
										const { xA, ia } = getx(x + (canFit * offset), "SMALL");
										return { xA: xA, ia: ia + canFit };
								} else if (x > 200 && (dir === "BIG" || !dir)) {
										const { xA, ia } = getx(x - (canFit * offset), "BIG");
										return { xA: xA, ia: ia - canFit };
								} else return { xA: x, ia: 0 };
						};
						// Adjusted
						const { xA, ia } = getx(x);
						const iA = i + ia;
						// Time stuff
						const dif = secondsTotal / 200 * (iA * offset);
						const t = new Date(((fTime + dif)*1000)+tz);
						// const daisy = t.getDate();
						const hours = t.getHours();
						const minutes = "0" + t.getMinutes();
						const str = hours + ':' + minutes.substr(-2);
						// const str = daisy + '.' + hours
						ctx.fillText(str, xA, 45);
						ctx.fillRect(xA, 30, 1, 20);
				}
		}
		
		onMount(() => {
				let frame = requestAnimationFrame(render);
		});

		return (
				<canvas ref={canvas} width="200" height="50"
								onMouseDown={() => holding = true }
								onMouseUp={() => holding = false }
								onMouseMove={(event) => {
										if (holding) {
												startTime -= event.movementX * 100;
												render();
										}
								}}
								onWheel={(event) => {
										event.preventDefault();
										const old = scale;
										scale = clamp(scale + event.deltaY / 100, 1, 20);
										// TODO: Korjaa joskus
										const dif = old - scale;
										const m = (fTime - startTime ) * dif / 10;
										console.log(m);
										startTime += m;
										render();
								}}
				></canvas>
		);
}

export default Scans;