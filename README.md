# Onde Estou? 📍

Página que usa a **API de Geolocalização** do navegador para mostrar onde você está num mapa feito com [Leaflet](https://leafletjs.com/) e OpenStreetMap.

## Desafios feitos

- **Mapa em tempo real:** usa `watchPosition` para atualizar o marcador conforme você se move. O botão liga e desliga o acompanhamento (`clearWatch`).
- **Rotas:** usa a API do [OSRM](https://project-osrm.org/) para traçar o caminho de carro até o destino, mostrando a distância e o tempo. A rota é recalculada quando você anda mais de 50 m.
- **Ícones personalizados:** bolinha azul para a sua posição e 📍 para o destino, feitos com `L.divIcon`.
- **Geocodificação:** transforma o endereço digitado em coordenadas usando o [Nominatim](https://nominatim.org/).

## Como usar

1. Abra o `index.html` no navegador.
2. Clique em **Acompanhar Minha Localização** e permita o acesso quando o navegador pedir.
3. Digite um endereço e clique em **Buscar e Traçar Rota**.

## Arquivos

- `index.html`: estrutura da página
- `style.css`: estilos e ícones dos marcadores
- `script.js`: localização, geocodificação e rota
