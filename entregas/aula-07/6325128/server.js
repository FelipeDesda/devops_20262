const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const salas = [];
const reservas = [];

let proximoIdSala = 1;
let proximoIdReserva = 1;

app.use(express.json());

function erroPadrao(mensagem, status = 400) {
  return { status, mensagem };
}

function encontrarSalaPorInput(inputSala) {
  if (inputSala === undefined || inputSala === null || inputSala === '') {
    return null;
  }

  if (typeof inputSala === 'number' || !Number.isNaN(Number(inputSala))) {
    const id = Number(inputSala);
    return salas.find((sala) => sala.id === id) || null;
  }

  const nome = String(inputSala).trim();
  if (!nome) {
    return null;
  }

  return salas.find((sala) => sala.nome.toLowerCase() === nome.toLowerCase()) || null;
}

app.get('/', (req, res) => {
  res.json({
    nome: 'API de Reserva de Salas TechNova',
    endpoints: ['/salas', '/reservas']
  });
});

app.post('/salas', (req, res) => {
  const nome = String(req.body?.nome ?? '').trim();

  if (!nome) {
    return res.status(400).json(erroPadrao('Nome da sala é obrigatório.'));
  }

  const jaExiste = salas.some(
    (sala) => sala.nome.toLowerCase() === nome.toLowerCase()
  );

  if (jaExiste) {
    return res.status(409).json(erroPadrao('Já existe uma sala com esse nome.'));
  }

  const sala = {
    id: proximoIdSala++,
    nome
  };

  salas.push(sala);
  return res.status(201).json(sala);
});

app.get('/salas', (req, res) => {
  res.json(salas);
});

app.post('/reservas', (req, res) => {
  const { salaId, sala, funcionario, horario } = req.body;

  const salaSelecionada = encontrarSalaPorInput(salaId ?? sala);

  if (!salaSelecionada) {
    return res.status(404).json(erroPadrao('Sala não encontrada.'));
  }

  const nomeFuncionario = String(funcionario ?? '').trim();
  const horarioReserva = String(horario ?? '').trim();

  if (!nomeFuncionario) {
    return res.status(400).json(erroPadrao('Nome do funcionário é obrigatório.'));
  }

  if (!horarioReserva) {
    return res.status(400).json(erroPadrao('Horário da reserva é obrigatório.'));
  }

  const conflito = reservas.some(
    (reserva) =>
      reserva.salaId === salaSelecionada.id && reserva.horario === horarioReserva
  );

  if (conflito) {
    return res.status(409).json(
      erroPadrao(
        `Já existe uma reserva para a sala "${salaSelecionada.nome}" no horário ${horarioReserva}.`,
        409
      )
    );
  }

  const reserva = {
    id: proximoIdReserva++,
    salaId: salaSelecionada.id,
    funcionario: nomeFuncionario,
    horario: horarioReserva
  };

  reservas.push(reserva);
  return res.status(201).json(reserva);
});

app.delete('/reservas/:id', (req, res) => {
  const id = Number(req.params.id);
  const indice = reservas.findIndex((reserva) => reserva.id === id);

  if (indice === -1) {
    return res.status(404).json(erroPadrao('Reserva não encontrada.', 404));
  }

  const reservaExcluida = reservas.splice(indice, 1)[0];
  return res.json({
    mensagem: 'Reserva cancelada com sucesso.',
    reserva: reservaExcluida
  });
});

app.get('/reservas', (req, res) => {
  const funcionario = String(req.query.funcionario ?? '').trim();

  if (!funcionario) {
    return res.json(reservas);
  }

  const lista = reservas.filter(
    (reserva) => reserva.funcionario.toLowerCase() === funcionario.toLowerCase()
  );

  return res.json(lista);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
