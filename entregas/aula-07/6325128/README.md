# API de Reserva de Salas — TechNova

## Como rodar

1. Entre na pasta do projeto:
   ```bash
   cd /home/felip/ADS/DEVOPS/devops_20262/entregas/aula-07/6325128
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. A API estará disponível em:
   ```bash
   http://localhost:3000
   ```

## Rotas principais

- `POST /salas` — cadastrar uma sala
- `GET /salas` — listar salas cadastradas
- `POST /reservas` — criar uma reserva
- `DELETE /reservas/:id` — cancelar uma reserva
- `GET /reservas?funcionario=NOME` — listar reservas de um funcionário

## Exemplos de uso

### 1) Cadastrar sala
```bash
curl -X POST http://localhost:3000/salas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sala Azul"}'
```

### 2) Listar salas
```bash
curl http://localhost:3000/salas
```

### 3) Criar reserva
```bash
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{"salaId":1,"funcionario":"Ana","horario":"2026-09-25T10:00"}'
```

### 4) Tentar conflito de horário
```bash
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{"salaId":1,"funcionario":"Bruno","horario":"2026-09-25T10:00"}'
```

### 5) Listar reservas do funcionário
```bash
curl "http://localhost:3000/reservas?funcionario=Ana"
```

### 6) Cancelar reserva
```bash
curl -X DELETE http://localhost:3000/reservas/1
```

## Observações

- Os dados ficam em memória.
- O sistema impede duas reservas na mesma sala e no mesmo horário.
- O nome da sala é obrigatório.
