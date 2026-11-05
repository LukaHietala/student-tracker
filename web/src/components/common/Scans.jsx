import { createResource, createSignal, createEffect, onMount } from "solid-js";
import { render } from "solid-js/web";
import { scanService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";

function createScansURL(scans) {
    const content = scans.map((scan) => scan.timestamp + " " + (scan.newStatus === "IN" ? "Skannattu sisään" : "Skannattu ulos")).join("\n");
    const blob = new Blob([content], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    return url;
}

function Scans(props) {

    const { user } = useAuth();

    const [fullscreen, setFullscreen] = createSignal(false);

    const [scans] = createResource(
        () => user() && user().id,
        async () => {
            return await scanService.listStudentScans(props.id);
        },
    );
    
    return (
        <div class="scan-log">
            <ErrorBoundary fallback={<p>Skannausten hakeminen epäonnistui</p>}>
                <Suspense fallback={<p>Ladataan...</p>}>
                    <Show when={scans()}>
                        <div class="scan-log-header">
                                <a href={createScansURL(scans())} download="skannaus_loki.txt">Lataa</a> 
                                <button class="btn-secondary"
                                        type="button"
                                        onClick={() => setFullscreen(!fullscreen())}>
                                    Kokonäyttö
                                </button>
                        </div>
                        <Show when={scans().length == 0}>
                            <div class="scan-log-item">
                                <span>Ei skannauksia</span>
                            </div>
                        </Show>
                        <Timeline scans={scans()} fullscreen={fullscreen} setFullscreen={setFullscreen}/>
                        <Show when={fullscreen()}>
                             <div class="scan-log-item">
                                <span>asdf</span>
                            </div>
                        </Show>
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

    const scans = props.scans.map((scan) => (scan.save = scan.timestamp, scan.timestamp = (new Date(scan.timestamp)).getTime() / 1000, scan));
    let hitboxes = [];
    
    // Canvas size
    const [width, setWidth] = createSignal(800);
		const [height, setHeight] = createSignal(150);
    // Zoom
    let scale = 3;
    // Amount of seconds that fit on scree
    const secondsTotal = () => width() * (1000 / scale);
    const roundToHour = (t) => t - (t % 3600)
    // Time to start scroll at
    let fTime = roundToHour(parseInt(scans[0].timestamp) - ((secondsTotal() / width()) * (width()/2)));
    // Mouse variables
    let holding = false;
    let mouse = {x: 0, y: 0};
    // Current time scrolled to
    let startTime = fTime;
    // Timezone offset
    const tz = (new Date(fTime)).getTimezoneOffset()*60*1000;

    // Clamp function
    const clamp = (x, a, b) => Math.max(a, Math.min(x, b));

    // Get color from some elment that has it
    const colour = window.getComputedStyle(document.querySelector("button")).getPropertyValue('--primary');
    
    function render()
    {
        const ctx = canvas.getContext("2d");

				setWidth(props.fullscreen() ? window.innerWidth : 800);
				setHeight(width() * 0.1875);
				
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
            const s = (parseInt(x.timestamp) - startTime - (tz / 1000)) / 1000 * scale;
            
            hitboxes.push({x: s, w: w, start: x.save, end: scan.save, warped: warped});
            x = warped ? scan : undefined;

            if (warped)
                ctx.fillStyle = "red";
            else
                ctx.fillStyle = colour;
            ctx.fillRect(s, 0, w, height() / 2.5);
        }
        // Ongoing scan
        if (x) {
            const w = (parseInt((new Date()).getTime()) - (parseInt(x.timestamp) * 1000)) / 1000 / 1000 * scale;
            const s = (parseInt(x.timestamp) - startTime - (tz / 1000)) / 1000 * scale;
            hitboxes.push({x: s, w: w, start: x.save, warped: false});
            ctx.fillStyle = "grey";
            ctx.fillRect(s, 0, w, height() / 2.5);
        }

        const offsetSeconds = ((scale < 1) ? 86400
                               : (scale < 2) ? 43200
                               : (scale < 3) ? 18000
                               : (scale < 5) ? 14400
                               : (scale < 10) ? 7200
                               : 3600);
        const offset = offsetSeconds / 1000 * scale;
        const showDate = scale < 2;
        const canFit = Math.ceil(width() / offset);

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
                } else if (x > width() && (dir === "BIG" || !dir)) {
                    const { xA, ia } = getx(x - (canFit * offset), "BIG");
                    return { xA: xA, ia: ia - canFit };
                } else return { xA: x, ia: 0 };
            };
            // Adjusted
            const { xA, ia } = getx(x);
            const iA = i + ia;
            // Time stuff
            const dif = (secondsTotal() / width()) * (iA * offset);
            const t = new Date(((fTime + dif)*1000)+tz);
            // Show date or time string
            if (showDate) {
                const daisy = t.getDate();
                const month = t.getMonth() + 1;
                const str = daisy + '.' + month;
                ctx.fillText(str, xA - 15, height() * 0.6);
            } else {
                const hours = t.getHours();
                const minutes = "0" + t.getMinutes();
                const str = hours + ':' + minutes.substr(-2);
                ctx.fillText(str, xA - 15, height() * 0.6);
            }
            ctx.fillRect(xA, height() * 0.65, 1, height() * 0.4);
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
        for (const hb of hitboxes) {
            if (mouse.funX > hb.x && mouse.funX < hb.x + hb.w && mouse.relY < height() / 2.5) {
                popup.style.left = `${mouse.absX}px`;
                popup.style.top = `${mouse.absY + 20}px`;
                popup.style.visibility = "visible";

                if (hb.end) {
                    const timeStr = `${hb.start} - ${hb.end}`;
                    const warning = `
Tämä ajanväli sisältyy kahden samaan suuntaan kulkeneen skannauksen väliin.
Tämä tarkoittaa, että tietoja on manuaalisesti muutettu, ja on mahdotonta tietää kauanko oppilas on oikeasti ollut skannattuna sisään.`
                    popup.innerHTML = hb.warped ? `${warning}<br/>${timeStr}`
                        : timeStr;
                } else popup.innerHTML = `${hb.start} (kesken)`;
                return;
            }
            x = undefined;
        }
        popup.style.visibility = "hidden";
    }
    
    onMount(() => {
        let frame = requestAnimationFrame(render);
    });

		createEffect(() => {
				props.fullscreen();
				setTimeout(render, 0.1);
		});

    return (
        <>
            <canvas ref={canvas} width={width()} height={height()}
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
                            funX: event.offsetX * (width() / (canvas.getBoundingClientRect().right - canvas.getBoundingClientRect().left)),
                            funY: event.offsetY * (height() / (canvas.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top))
                        };
                        queryPopup();
                        if (holding) {
                            startTime -= event.movementX * 400 / (scale / 2);
                            render();
                        }
                    }}
                    onWheel={(event) => {
                        event.preventDefault();
												// Sometimes width is undefined (?)
												if (!width())
														return;
                        const oldScale = scale;
                        scale = clamp(scale + -event.deltaY / 100, 0.5, 20);

                        const center = startTime - (((secondsTotal() / width()) * mouse.funX));
                        startTime = center - (center - startTime) * (scale / oldScale);
                        render();
                    }}
                    style="background-color: white; left: 0; z-index: 50"
										style={{position: props.fullscreen() ? "fixed" : "static"}}
										style={{top: props.fullscreen() ? `${(window.innerHeight / 2) - (height() / 2)}px` : 0}}
            ></canvas>
            <div ref={popup}
                 style="position: absolute; visibility: hidden; background-color: white; z-index: 51">
            </div>
						<div style="z-index: 49; position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;"
								 style="backdrop-filter: blur(3px); background-color: rgba(0,0,0,0.2);"
								 style={{visibility: props.fullscreen() ? "visible" : "hidden"}}
								 onClick={() => props.setFullscreen(false)}
						></div>
        </>
    );
}

export default Scans;