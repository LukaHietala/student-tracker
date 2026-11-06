import { useSearchParams } from "@solidjs/router";
import skannauspisteImg from "../assets/skannauspiste.webp";

function GuidesPage() {
    const [params, setParams] = useSearchParams();
    const guide = () => String(params.guide).toString();

    return (
        <>
            <h3>Ohjeet</h3>
            <Switch
                fallback={
                    <div class="grid">
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
                                    onClick={() => setParams({ guide: "raspberry" })}
                                    href=""
                                >
                                    Raspberry PI:n käyttöönotto
                                </a>
                            </h4>
                            <p class="small">
                                Ohjeet Raspberry PI:n käyttöönottoon
                            </p>
                        </div>
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
                                Ohjeet lukija sovelluksen konfiguroimiseen
                            </p>
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
                            <p class="small">
                                Ohjeet TV sovelluksen konfiguroimiseen
                            </p>
                        </div>
                        <div class="grid-item">
                            <h4 class="grid-item-title">
                                <a href="https://github.com/LukaHietala/kpedu-student-tracker">
                                    Lähdekoodi
                                </a>
                            </h4>
                        </div>
                    </div>
                }
            >
                <Match when={guide() === "raspberry"}>
                    <RasberryGuide />
                </Match>
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

function RasberryGuide() {
    return (
        <div class="block-col">
            <h3>Rasberry PI:n käyttöönotto</h3>
            <p>Ohjelma kokonaisuutta on testattu seuraavilla laitteilla:</p>
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
                    Ohjelmat käyttää Raspberry PI:n SPI ja Linuxin KMSDRM rajapintoja, joten niiden tulee olla käytössä.
                    Voit ottaa ne käyttöön <code>raspi-config</code> ohjelman avulla tai lisäämällä{" "}
                    <code>dtparam=spi=on</code> ja ???TODO??? tiedostoon <code>/boot/firmware/config.txt</code>.
                </li>
                <li>
                    Tarkista että laite on samassa verkossa missä palvelin.
                </li>
                <li>
                    Kloonaa projektin lähdekoodi <a href="https://github.com/LukaHietala/kpedu-student-tracker" target="_blank" rel="noopener noreferrer">Githubista</a>.
                </li>
            </ol>
        </div>
    );
}

function ReaderGuide() {
    return (
        <div class="block-col">
            <h3>Lukijan käyttöönotto</h3>
            <h4>MFRC522 Lukijan Pinnikaavio (suositeltava)</h4>
            <table>
                <thead>
                    <tr>
                        <th>Signaali</th>
                        <th>Nasta</th>
                        <th>GPIO</th>
                    </tr>
                </thead>
                <tbody>
                    
                    <tr>
                        <td>3.3V</td>
                        <td>Pin 1</td>
                        <td>Power</td>
                    </tr>
                    <tr>
                        <td>GND</td>
                        <td>Pin 6</td>
                        <td>Ground</td>
                    </tr>
                    <tr>
                        <td>IRQ</td>
                        <td>Pin 18</td>
                        <td>GPIO 24</td>
                    </tr>
                    <tr>
                        <td>MISO</td>
                        <td>Pin 21</td>
                        <td>GPIO 9</td>
                    </tr>
                    <tr>
                        <td>RST</td>
                        <td>Pin 22</td>
                        <td>GPIO 25</td>
                    </tr>
                    <tr>
                        <td>SCK</td>
                        <td>Pin 23</td>
                        <td>GPIO 11</td>
                    </tr>
                    <tr>
                        <td>SDA</td>
                        <td>Pin 24</td>
                        <td>GPIO 8</td>
                    </tr>
                    <tr>
                        <td>MOSI</td>
                        <td>Pin 19</td>
                        <td>GPIO 10</td>
                    </tr>

                </tbody>
            </table>
            <h4>Lukijan asentaminen</h4>
            <ol>
                <li>
                    Asenna <a href="https://go.dev/dl/" target="_blank" rel="noopener noreferrer">Go</a> (vähintään versio 1.27.0)
                </li>
                <li>
                    Luo uusi laite ylläpito sivulta ja pistä laitteen salainen avain talteen.
                </li>
                <li>
                    Täytä kpedu-student-tracker repon <code>config.toml</code>ista palvelmien osoite,
                    sekä <code>[reader]</code> osiosta laitteen salainen avain.
                </li>
                <li>
                    Kompiloi projekti <code>go build .</code> avulla ja testaa sen pyörittämistä.
                    Voit mahdollisesti joutua säätäämään esim mitä pinnejä käytetään lukemiseen suoraan lähdekoodista.
                </li>
            </ol>
        </div>
    );
}

function SiteGuide() {
    return <p>site</p>;
}

function TVGuide() {
    return (
        <div class="block-col">
            <h3>TV-ohjelma käyttöönotto</h3>
            <ol>
                <li>
                    Täytä kpedu-student-tracker repon <code>config.toml</code>ista palvelmien osoite,
                    sekä <code>[tv]</code> osiosta ryhmän id (löytyy ylläpito sivuilta).
                </li>
                <li>
                    Siirry <code>tv</code> kansioon ja varmista, että compile vaatimukset ovat asennettu.
                    Debian pohjaisilla käyttöjärjestelmillä kuten Rasberry Pi OS:ällä ne on todennäköisesti nämä:
                    <pre style="overflow: scroll;">
                        <code>
                            sudo apt-get install build-essential git make \
                            pkg-config cmake ninja-build gnome-desktop-testing libasound2-dev libpulse-dev \
                            libaudio-dev libfribidi-dev libjack-dev libsndio-dev libx11-dev libxext-dev \
                            libxrandr-dev libxcursor-dev libxfixes-dev libxi-dev libxss-dev libxtst-dev \
                            libxkbcommon-dev libdrm-dev libgbm-dev libgl1-mesa-dev libgles2-mesa-dev \
                            libegl1-mesa-dev libdbus-1-dev libibus-1.0-dev libudev-dev libthai-dev libusb-1.0-0-dev \
                            libfreetype6-dev libharfbuzz-dev
                        </code>
                    </pre>
                    TODO VARMISTA JA VAIN MINIMI VAADITTAVAT
                </li>
                <li>
                    Compileta ohjelma pyörittämällä: <br/>
                    <code>cmake -S . -B build && cmake --build build --parallel=$(nproc)</code>
                </li>
                <li>
                    Testaa ohjelman pyörittämistä terminaalista. Sen pitäisi heti vallata koko ruutu.
                </li>
            </ol>
        </div>
    );
}

export default GuidesPage;