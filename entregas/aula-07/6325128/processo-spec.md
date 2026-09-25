# Processo Spec-Driven — Reserva de Salas | Felipe Damasceno (6325128)

## 1. Como eu dividi o problema

O enunciado descreve um sistema com cinco responsabilidades distintas. Antes de
escrever qualquer código, quebrei o problema nas seguintes partes menores:

1. **Estrutura base** — subir o servidor Express com middleware de JSON e rota de
   healthcheck (`GET /`).
2. **Cadastrar sala** — `POST /salas` com validação de nome obrigatório e nome
   duplicado.
3. **Listar salas** — `GET /salas` retornando o array em memória.
4. **Criar reserva** — `POST /reservas` recebendo sala (por id ou nome),
   funcionário e horário, com detecção de conflito de horário.
5. **Cancelar reserva** — `DELETE /reservas/:id` removendo pelo id numérico.
6. **Listar reservas por funcionário** — `GET /reservas?funcionario=NOME` com
   filtro case-insensitive; sem parâmetro, retorna todas.

Separar em seis partes permitiu validar cada uma isoladamente antes de avançar.

---

## 2. Requisitos (o quê)

### O que o Kiro gerou inicialmente

O Kiro identificou os cinco casos de uso do enunciado e os transformou em
requisitos funcionais:

- RF01 — Cadastrar sala com nome obrigatório.
- RF02 — Listar todas as salas cadastradas.
- RF03 — Criar reserva informando sala, funcionário e horário.
- RF04 — Impedir duas reservas na mesma sala e mesmo horário (conflito).
- RF05 — Cancelar reserva pelo id.
- RF06 — Listar reservas filtrando por nome de funcionário.

Requisitos não-funcionais assumidos: dados em memória (sem banco), Node.js +
Express, porta 3000.

### O que precisei corrigir / adicionar

- **RF01 — nome duplicado:** o Kiro não incluiu a restrição de nome de sala
  único. Adicionei a validação com retorno HTTP 409 Conflict.
- **RF03 — sala por nome além de id:** o Kiro inicialmente aceitava apenas
  `salaId` numérico. Ampliei para aceitar também o nome da sala no campo `sala`,
  tornando a API mais amigável para testes manuais com curl.
- **RF06 — sem parâmetro:** precisei deixar explícito que `GET /reservas` sem
  query string retorna todas as reservas, não um erro.

---

## 3. Design (como)

### Proposta inicial do Kiro

O Kiro sugeriu separar o código em três arquivos: `server.js` (bootstrap),
`routes/` (rotas) e `store.js` (dados em memória). Também sugeriu usar um módulo
de validação externo (Joi).

### Simplificações que adotei

- **Arquivo único (`server.js`):** para um projeto pequeno, separar em
  módulos adicionaria complexidade sem benefício real. Tudo cabe em ~120 linhas
  sem prejudicar a leitura.
- **Sem biblioteca de validação:** as validações são simples (campo vazio,
  duplicata, conflito de horário). Implementar com `if` direto é mais transparente
  e elimina uma dependência externa.
- **IDs numéricos sequenciais:** mais simples que UUID para dados em memória,
  e suficiente para o escopo do problema.
- **Função auxiliar `encontrarSalaPorInput`:** centralizei a lógica de buscar
  sala por id numérico ou por nome em uma única função, evitando duplicação nas
  rotas de reserva.
- **Função `erroPadrao`:** padronizei o formato de resposta de erro em um único
  lugar para manter consistência entre todas as rotas.

---

## 4. Tarefas (os passos pequenos)

| # | Tarefa | Rota(s) envolvida(s) |
|---|--------|----------------------|
| T1 | Criar servidor Express com middleware JSON e rota raiz | `GET /` |
| T2 | Implementar cadastro de sala com validação de nome | `POST /salas` |
| T3 | Implementar listagem de salas | `GET /salas` |
| T4 | Implementar criação de reserva com lookup de sala | `POST /reservas` |
| T5 | Adicionar detecção de conflito de horário na criação | `POST /reservas` |
| T6 | Implementar cancelamento de reserva | `DELETE /reservas/:id` |
| T7 | Implementar listagem de reservas por funcionário | `GET /reservas` |

Cada tarefa foi implementada, o servidor foi reiniciado e os comandos curl foram
executados antes de passar para a próxima.

---

## 5. Implementação e validação

### T2 — Cadastrar sala (`POST /salas`)

**Tarefa:** criar a rota que recebe `{ "nome": "..." }` e persiste em memória,
com validação de campo obrigatório e nome duplicado.

**Teste — cadastro com sucesso:**
```bash
curl -X POST http://localhost:3000/salas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sala Azul"}'
```
Resposta esperada (`201 Created`):
```json
{ "id": 1, "nome": "Sala Azul" }
```

**Teste — nome ausente:**
```bash
curl -X POST http://localhost:3000/salas \
  -H "Content-Type: application/json" \
  -d '{}'
```
Resposta esperada (`400 Bad Request`):
```json
{ "status": 400, "mensagem": "Nome da sala é obrigatório." }
```

**Teste — nome duplicado:**
```bash
curl -X POST http://localhost:3000/salas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sala Azul"}'
```
Resposta esperada (`409 Conflict`):
```json
{ "status": 400, "mensagem": "Já existe uma sala com esse nome." }
```

**Confirmação:** os três cenários retornaram os status codes e mensagens
esperados. Validação funcionando corretamente.

---

### T5 — Conflito de horário (`POST /reservas`)

**Tarefa:** após criar uma reserva com sucesso, tentar criar outra reserva para
a mesma sala no mesmo horário deve retornar erro 409.

**Teste — primeira reserva (deve criar):**
```bash
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{"salaId":1,"funcionario":"Ana","horario":"2026-09-25T10:00"}'
```
Resposta esperada (`201 Created`):
```json
{ "id": 1, "salaId": 1, "funcionario": "Ana", "horario": "2026-09-25T10:00" }
```

**Teste — segunda reserva no mesmo horário e sala (deve falhar):**
```bash
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{"salaId":1,"funcionario":"Bruno","horario":"2026-09-25T10:00"}'
```
Resposta esperada (`409 Conflict`):
```json
{
  "status": 409,
  "mensagem": "Já existe uma reserva para a sala \"Sala Azul\" no horário 2026-09-25T10:00."
}
```

**Confirmação:** o sistema bloqueou a segunda reserva com mensagem clara
identificando a sala e o horário conflitante.

---

### T6 + T7 — Cancelar e listar por funcionário

**Tarefa T6:** remover uma reserva existente pelo id e confirmar que uma id
inexistente retorna 404.

```bash
# Cancela reserva id=1
curl -X DELETE http://localhost:3000/reservas/1
```
Resposta esperada (`200 OK`):
```json
{
  "mensagem": "Reserva cancelada com sucesso.",
  "reserva": { "id": 1, "salaId": 1, "funcionario": "Ana", "horario": "2026-09-25T10:00" }
}
```

```bash
# Tenta cancelar id inexistente
curl -X DELETE http://localhost:3000/reservas/999
```
Resposta esperada (`404 Not Found`):
```json
{ "status": 404, "mensagem": "Reserva não encontrada." }
```

**Tarefa T7:** listar reservas filtrando por funcionário (case-insensitive).

```bash
# Cria duas reservas para funcionários diferentes
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{"salaId":1,"funcionario":"Ana","horario":"2026-09-25T14:00"}'

curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -d '{"salaId":1,"funcionario":"Bruno","horario":"2026-09-25T15:00"}'

# Filtra só as de Ana (funciona mesmo com caixa diferente)
curl "http://localhost:3000/reservas?funcionario=ana"
```
Resposta esperada: array contendo apenas as reservas da Ana.

**Confirmação:** o filtro case-insensitive funcionou corretamente; "ana", "Ana"
e "ANA" retornaram o mesmo resultado.

---

## 6. A IA errou em algum momento?

### Sugestão de complexidade desnecessária

O Kiro sugeriu inicialmente uma estrutura com três arquivos (`server.js`,
`routes/index.js`, `store.js`) e a biblioteca Joi para validação. Para o escopo
deste projeto — seis rotas com dados em memória — essa estrutura seria
prematura e dificultaria a leitura do código por quem for avaliar.

**Como percebi:** ao revisar o design proposto, identifiquei que o ganho de
separação em módulos só se justificaria se o projeto fosse crescer. Para o TF,
um arquivo único é mais claro.

**Como corrigi:** na etapa de Design, redirecionei o Kiro para implementar tudo
em `server.js`, sem dependências além do Express.

### Lookup de sala apenas por id

O Kiro gerou a rota `POST /reservas` aceitando apenas `salaId` numérico. Isso
funcionaria, mas exigiria que o cliente consultasse `GET /salas` antes para
saber o id. Para facilitar os testes manuais, adicionei o campo alternativo
`sala` (por nome) e a função auxiliar `encontrarSalaPorInput`.

**Como percebi:** ao testar com curl, perceber que precisava de um passo a mais
(buscar o id) antes de criar a reserva foi o sinal de que a experiência de uso
estava desnecessariamente complicada.

### Por que o método Spec ajudou

Ao revisar cada etapa antes da implementação, os desvios foram detectados no
momento do design — não depois de escrever código. Isso economizou retrabalho:
é muito mais rápido corrigir uma decisão de design no texto do que refatorar
código funcionando.

---

## 7. Reflexão

### O "jeito errado": pedir tudo de uma vez

Se eu tivesse pedido ao Kiro "crie uma API completa de reserva de salas com
Node.js", provavelmente teria recebido um código extenso de uma só vez. Os
problemas típicos desse caminho:

- A IA tende a adicionar camadas desnecessárias (banco de dados, autenticação,
  Docker) que não foram pedidas — alucinação por excesso.
- Erros ficam escondidos no meio de 300 linhas; difícil rastrear qual parte
  causou o problema.
- Se o output estiver errado, não há como saber em qual etapa a IA divergiu do
  que você queria.

### O que o método Spec fez de diferente

Dividir em seis partes transformou um problema complexo em uma sequência de
problemas pequenos e verificáveis. Cada tarefa tinha: um critério de sucesso
claro (qual rota, qual resposta esperada), um teste concreto (curl) e um
resultado verificável antes de avançar.

Isso mudou minha relação com a IA: em vez de "gerar tudo e torcer", passei a
"guiar passo a passo e confirmar cada avanço". A IA se torna um copiloto, não
um piloto automático.

### Aprendizado principal

IA generativa não é confiável como oráculo — é confiável como executor de
tarefas bem definidas. Quanto mais específica a instrução, mais previsível e
correto o resultado. O método Spec força essa especificidade, e é por isso que
funciona.
