const btnLocalizacao = document.getElementById('btnLocalizacao');
const formEndereco = document.getElementById('formEndereco');
const inputEndereco = document.getElementById('inputEndereco');
const textoStatus = document.getElementById('status');
const textoRota = document.getElementById('infoRota');

let marcador;
let marcadorDestino;
let linhaRota;
let idAcompanhamento = null;
let posicaoAtual = null;
let destino = null;
let ultimaPosicaoRota = null;

// Desafio 3: ícones personalizados para os marcadores
const iconeVoce = L.divIcon({
    className: 'icone-marcador',
    html: '<div class="icone-voce"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const iconeDestino = L.divIcon({
    className: 'icone-marcador',
    html: '<div class="icone-destino">📍</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// O mapa já começa aberto, centralizado no Brasil
const mapa = L.map('mapa').setView([-14.235, -51.925], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

// Desafio 1: watchPosition para atualizar o mapa em tempo real
btnLocalizacao.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocalização não é suportada por este navegador.");
        return;
    }

    if (idAcompanhamento === null) {
        textoStatus.textContent = "Obtendo sua localização...";
        idAcompanhamento = navigator.geolocation.watchPosition(sucesso, erro, {
            enableHighAccuracy: true
        });
        btnLocalizacao.textContent = "Parar de Acompanhar";
    } else {
        navigator.geolocation.clearWatch(idAcompanhamento);
        idAcompanhamento = null;
        textoStatus.textContent = "Acompanhamento parado.";
        btnLocalizacao.textContent = "Acompanhar Minha Localização";
    }
});

function erro() {
    textoStatus.textContent = "Não foi possível obter sua localização.";
}

function sucesso(posicao) {
    const latitude = posicao.coords.latitude;
    const longitude = posicao.coords.longitude;
    const primeiraVez = posicaoAtual === null;
    posicaoAtual = [latitude, longitude];

    if (marcador) {
        marcador.setLatLng(posicaoAtual);
    } else {
        marcador = L.marker(posicaoAtual, { icon: iconeVoce }).addTo(mapa);
        marcador.bindPopup("<b>Você está aqui!</b>").openPopup();
    }

    if (primeiraVez) mapa.setView(posicaoAtual, 15);

    textoStatus.textContent = `Localização atualizada: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} ` +
        `(precisão de ${Math.round(posicao.coords.accuracy)} m)`;

    // Só recalcula a rota se andou mais de 50 metros, pra não sobrecarregar a API
    if (destino && (!ultimaPosicaoRota || mapa.distance(ultimaPosicaoRota, posicaoAtual) > 50)) {
        tracarRota();
    }
}

// Desafio 4: geocodificação (endereço -> coordenadas) com o Nominatim
formEndereco.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const endereco = inputEndereco.value.trim();
    if (!endereco) return;

    textoRota.textContent = "Procurando endereço...";

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(endereco)}`;
        const resposta = await fetch(url);
        const resultados = await resposta.json();

        if (resultados.length === 0) {
            textoRota.textContent = "Endereço não encontrado.";
            return;
        }

        destino = [parseFloat(resultados[0].lat), parseFloat(resultados[0].lon)];

        if (marcadorDestino) marcadorDestino.setLatLng(destino);
        else marcadorDestino = L.marker(destino, { icon: iconeDestino }).addTo(mapa);
        marcadorDestino.bindPopup(`<b>Destino:</b><br>${resultados[0].display_name}`).openPopup();

        if (posicaoAtual) {
            tracarRota();
        } else {
            mapa.setView(destino, 15);
            textoRota.textContent = "Destino encontrado! Ative sua localização para traçar a rota.";
        }
    } catch (e) {
        textoRota.textContent = "Erro ao buscar o endereço.";
    }
});

// Desafio 2: API de rotas (OSRM) para traçar o caminho
async function tracarRota() {
    ultimaPosicaoRota = posicaoAtual;

    // O OSRM recebe as coordenadas na ordem longitude,latitude
    const origem = `${posicaoAtual[1]},${posicaoAtual[0]}`;
    const fim = `${destino[1]},${destino[0]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${origem};${fim}?overview=full&geometries=geojson`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.code !== 'Ok' || dados.routes.length === 0) {
            textoRota.textContent = "Não foi possível traçar uma rota até esse destino.";
            return;
        }

        const rota = dados.routes[0];
        // O GeoJSON também vem como [longitude, latitude], então invertemos para o Leaflet
        const pontos = rota.geometry.coordinates.map(c => [c[1], c[0]]);

        if (linhaRota) linhaRota.setLatLngs(pontos);
        else linhaRota = L.polyline(pontos, { color: '#1a73e8', weight: 5 }).addTo(mapa);

        mapa.fitBounds(linhaRota.getBounds(), { padding: [30, 30] });

        const km = (rota.distance / 1000).toFixed(1);
        const minutos = Math.round(rota.duration / 60);
        textoRota.textContent = `Rota de carro: ${km} km, cerca de ${minutos} min`;
    } catch (e) {
        textoRota.textContent = "Erro ao traçar a rota.";
    }
}
