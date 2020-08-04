const API_KEY = '48f0f0da2e0ddb06be7e1ccfbfb7935a'; //API KEY
const MAP_NAME = 'citiesMap' //konstanta pre meno pola pre uchovanie mapy v lokalnom ulozisku
const HIS_MAP_NAME = 'favCitiesMap' //konstanta pre meno pola pre uchovanie mapy v lokalnom ulozisku 
const mapOfCities = loadMap(); //mapa do ktorej se uklada HTML s informaciami o pocasi s nazvom mesta ako kluc => {'London', '↵            <div>↵                <header>↵                    <img src="http://openweathermap.org/img/wn/10d@2x.png">↵                    <span>light rain</span>↵                </header>↵                <section>↵                    <span>London</span>↵                    <span>19.85°C</span>↵                </section>↵            </div>↵        '}
const resultsWrapper = document.getElementById('results'); //Js objekt elementu na vysledky
const notification = document.getElementById('notification'); //Js objekt elementu na errory
notification.hidden=true; //skrytie objektu (pri inicializacii) na error kym sa error neobjavi
const favouritesList = document.getElementById('list_group_fav'); //Js objekt elementu na historiu vyhladavania 
var favCount = 0; //counter poctu miest v historii
const clear_fav_cont = document.getElementById('clear_fav_cont'); //Js objekt elementu na vyprazdnenie historie vyhladavania
const mapOfFav = loadFavMap(); //mapa do ktorej sa uklada historia vyhladavania pre lokalnu pamat

//vyrenderovanie nacitanych miest z lokalneho uloziska
renderCities();

//pridanie miest z lokalneho uloziska do historie
addToHistory()

//funkcia ktora se vola pri stisku tlacitka search
function search(name) {

    let cityName = '';
    if(name == undefined)
    {
        //z js objektu inputu se vytiahne zadana hodnota    
        let searchInput = document.getElementById('search-input');   
        cityName = searchInput.value
    }
    else
    {
        //hodnota je predana do funkcie
        cityName = name;
    }

    if(mapOfCities.size < 7)
    {

        //zavola se s ni API a do parametru se da zadane mesto + API_KEY a potom se caka na odpoved
        fetch(`http://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`).then(response => {
            //kontrola ci API vratilo kod 200, tzn vsetko prebehlo v poriadku, pokial nie vyhazujem custom error, ktory se chyti v bloku catch nizsie
            if(!response.ok) {
                throw Error(`${response.status} ${response.statusText}`);
            }

            //logovanie
            console.log('Objekt odpovedi API:');
            console.log(response);

            //prevedenie tela odpovede do jsonu
            return response.json()
        }).then ( json => {
            console.log('JSON vraceny z API:');
            console.log(json);

            //vytahnutie dolezitych informacii z jsonu
            let weather = json.weather[0];
            let main = json.main;

            //poskladanie elementu, ktory se zobrazi na stranke a ulozi do lokalneho uloziska
            let element = `
                <header>
                    <img src="${getWeatherIcon(weather.icon)}">
                    <span>${weather.description}</span>
                </header>
                <section>
                    <span>${cityName}</span>
                    <span>${main.temp}°C</span>
                </section>
            `;

            //ulozenie do mapy, sluzi ako pre ukladanie do lokalneho uloziska, tak pre to, aby se nerenderovalo na stranku viackrat rovnake mesto
            //v mape moze byt len jeden unikatny kluc
            mapOfCities.set(cityName, element);

            //ulozenie do lokalneho uloziska tak, ze sa mapa prevedie na json, ktory se moze kedykolvek spatne nacitat
            localStorage.setItem(MAP_NAME, JSON.stringify(Array.from(mapOfCities.entries())));

            //prerenderovani miest a ich pocasi
            renderCities();

            //pridanie do historie vyhladavania
            addToHistory();

        }).catch(error => {
            //poskladanie erroru a jeho zobrazenie a nasledne schovanie
            notification.hidden=false;
            notification.innerText = `Fetch of weather for ${cityName} returned ${error}`;
            setTimeout(() => {
                notification.hidden=true;
            }, 5000);
        })
    }
    else
    {
        //ak mapa miest obsahuje 7 prvkov zviditelni error, vypis a schovaj error 
        notification.hidden=false;
        notification.innerText = `Maximum amount of cities reached. Please clear previous searches to continue.`;
        setTimeout(() => {
            notification.hidden=true;
        }, 5000);
    }
}

//prerenderovanie miest z mapy do ktorej ukladame data
function renderCities() {
    //smazanie obsahu
    resultsWrapper.innerHTML = '';
    //cyklus prejde vsetky kluce, ktore se v mape nachadzaju (tzn vsechny mesta), a vezme hodnotu, coz je HTML, ktore se ma zobrazit na stranke
    //vytvori se js objekt div-u, do ktoreho se HTML vlozi a pripne se jako child nod-a do "results" div-u v index.html
    mapOfCities.forEach((value, key, map) => {
        let element = document.createElement('div');
        element.innerHTML = value;
        resultsWrapper.appendChild(element);
    });
}

//funkca, ktora dostane ikonku pocasi v zavisloti na IDcku pocasi
function getWeatherIcon(weatherId) {
    return `http://openweathermap.org/img/wn/${weatherId}@2x.png`
}

//nacitanie mapy miest z lokalneho uloziska
// pozriem sa ci je mapa ulozena, pokial ano tak ju preparsujem z jsonu do objektu mapy, pokial nie, tak vratim prazdnu mapu
function loadMap() {
    return localStorage.getItem(MAP_NAME) ? new Map(JSON.parse(localStorage.getItem(MAP_NAME))) : new Map();
}

//nacitanie mapy historie z lokalneho uloziska
// pozriem sa ci je mapa ulozena, pokial ano tak ju preparsujem z jsonu do objektu mapy, pokial nie, tak vratim prazdnu mapu
function loadFavMap() {
    return localStorage.getItem(HIS_MAP_NAME) ? new Map(JSON.parse(localStorage.getItem(HIS_MAP_NAME))) : new Map();
}

//vycisti vyhladavania z LS a mapy miest
function clearLs()
{
    localStorage.removeItem(MAP_NAME);
    mapOfCities.clear();
    renderCities();
}

//pridanie do historie vyhladavania
function addToHistory()
{
    //ak historia menej ako 10 prvkov a nie je 0 (0 --> prvy prechod)
    if(favCount < 11 && favCount != 0)
    {
        favouritesList.innerHTML='';
        const searchInput = document.getElementById('search-input');
        let cityName = searchInput.value
        mapOfFav.set(cityName, cityName);
        mapOfFav.forEach((value, key, map) => {
            let element = document.createElement('button');
            element.setAttribute("class", "list-group-item");
            element.setAttribute("value", value);
            element.setAttribute("onclick", "search(this.value)");
            element.innerHTML = value;
            favouritesList.appendChild(element);
        });
        localStorage.setItem(HIS_MAP_NAME, JSON.stringify(Array.from(mapOfFav.entries())));
        favCount++;
    } 
    //ak sa v historii nachadza aspon 1 prvok vytvor a pripnu button na vycistenie
    if(favCount == 2)
    {
        let element = document.createElement('button');
        element.setAttribute("class", "btn btn-primary btn-block");
        element.setAttribute("id", "clear_fav_btn");
        element.setAttribute("onclick", "clearHistory()");
        element.innerHTML = 'Clear history';
        clear_fav_cont.appendChild(element);
    }  
    //inkrementuj pri prvom prechode ale nepridaj prvok
    if(favCount == 0)
    {
        favCount++;
    } 
}


//vycistenie historie vyhladavania
function clearHistory()
{
    //vycisti objekt na zobrazenie historie
    favouritesList.innerHTML = "";

    //vymaz button sluziaci na cistenie
    let element1 = document.getElementById('clear_fav_btn');
    clear_fav_cont.removeChild(element1);

    //vynuluj counter poctu miest v historii
    favCount = 1;

    //vymaz mapu v LS
    localStorage.removeItem(HIS_MAP_NAME);

    //vycisti mapu historie
    mapOfFav.clear();
}