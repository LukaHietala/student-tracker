import { useSearchParams } from "@solidjs/router";
import skannauspisteImg from "../assets/skannauspiste.webp";

function GuidesPage() {
	const [params, setParams] = useSearchParams();
	const guide = () => String(params.guide).toString();
	console.log(guide);

	return (
		<>
			<h3>Ohjeet</h3>
			<Switch
				fallback={
					<div class="grid">
						<div class="grid-item">
							<h4 class="grid-item-title">
								<a
									onClick={() => setParams({ guide: "reader" })}
									href=""
								>
									Lukijan käyttöönotto
								</a>
							</h4>
							<p class="small">
								Ohjeet Raspberry PI:n käyttöönottoon ja lukija sovelluksen
								konfiguroimiseen
							</p>
						</div>
						<div class="grid-item">
							<h4 class="grid-item-title">
								<a
									onClick={() => setParams({ guide: "site" })}
									href=""
								>
									Ohjeet ylläpitosivun käyttöön
								</a>
							</h4>
							<p class="small">Ryhmien ja opiskelijoiden hallinta</p>
						</div>
						<div class="grid-item">
							<h4 class="grid-item-title">
								<a
									onClick={() => setParams({ guide: "tv" })}
									href=""
								>
									Oppilasnäkymä (skannauspiste)
								</a>
							</h4>
							<p class="small">Jaakko</p>
						</div>
						<div class="grid-item">
							<h4 class="grid-item-title">
								<a href="https://github.com/LukaHietala/kpedu-student-tracker">
									Lähdekoodi
								</a>
							</h4>
							<p class="small">Tero</p>
						</div>
					</div>
				}
			>
				<Match when={guide() === "reader"}>
					<ReaderGuide />
				</Match>
				<Match when={guide() === "tv"}>
					<TVGuide />
				</Match>
				<Match when={guide() === "site"}>
					<SiteGuide />
				</Match>
			</Switch>
		</>
	);
}

function ReaderGuide() {
	return (
		<div class="block-col">
			<h3>Lukijan käyttönotto</h3>
            <p>Lukijaa on testattu seuraavalla raudalla:</p>
            <ul>
                <li>Raspberry Pi 3 Model B+ Rev 1.3</li>
                <li>Mifare MFRC522 (rfid lukija)</li>
            </ul>
            <h4>Rasperry PI:n säätäminen</h4>
			<ol>
                <li>
                    Asenna Raspberry PI OS. Mieluiten lite versio sillä TV
        näkymä ei vaadi työpöytäympäristöä, koska se käytää suoraan KMSDRM
        rajapintaa.
                </li>
                <li>
                    Kannattaa ottaa käyttöön SSH kirjautuminen, ja luoda käyttäjä jolle kirjautua.
                </li>
				<li>
					Lukija käyttää Raspberry PI:n SPI rajapintaa, joten sen tulee olla käytössä. Voit
					ottaa sen käyttöön <code>raspi-config</code> ohjelman avulla tai lisäämällä{" "}
					<code>dtparam=spi=on</code> tiedostoon <code>/boot/firmware/config.txt</code>.
				</li>
                <li>
                    Tarkista että laite on samassa verkossa missä palvelin.
                </li>
                <li>
                    Asenna <a href="https://go.dev/dl/" target="_blank" rel="noopener noreferrer">Go</a> (vähintään versio 1.27.0)
                </li>
                 <li>
                    Kloonaa projektin lähdekoodi <a href="https://github.com/LukaHietala/kpedu-student-tracker" target="_blank" rel="noopener noreferrer">Githubista</a>. Lukija sijaitsee kansiossa <code>reader/</code>.
                </li>
                <li>
                    TODO: Config, systemd
                </li>
			</ol>
		</div>
	);
}
function SiteGuide() {
	return <p>site</p>;
}
function TVGuide() {
	return <p>tv</p>;
}

export default GuidesPage;