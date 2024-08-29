# Projeto teste Shopper

## Como executar o projeto:

Configure o seu .env:

```
GEMINI_API_KEY=<CHAVE API>
```

### Configure o `GEMINI_API_KEY` no arquivo `docker-compose.yml`

```bash
npm run prod
```

Requisitos:

- Docker

Requisitos para desenvolvimento:

- Docker
- Node

### Comando para apagar todos os containers e imagens.

```
docker rm -f $(docker ps -aq) && docker rmi -f $(docker images -aq)
```
