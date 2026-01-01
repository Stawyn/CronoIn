// src/services/DashboardService.js
import { JORNADA_API_URL, PONTO_API_URL, USUARIO_API_URL, getUserId } from '../api/api'; // ATUALIZADO

const withCacheBuster = (url) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
};
// A URL base da API para a entidade 'jornada'
// const API_URL_JORNADA = 'http://192.168.3.44:8000/jornada'; // REMOVIDO

export const horaAtualFormatada = () => {
    const data = new Date();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
}

export const definindoFimIntervalo = (horarioInicio, minutosAdicionar) => {
    const [horas, minutos] = horarioInicio.split(':').map(Number);
    const data = new Date();
    data.setHours(horas, minutos, 0, 0);
    data.setMinutes(data.getMinutes() + minutosAdicionar);
    const novasHoras = String(data.getHours()).padStart(2, '0');
    const novosMinutos = String(data.getMinutes()).padStart(2, '0');
    return `${novasHoras}:${novosMinutos}`;
};

const normalizarHorario = (valor) => {
  if (!valor && valor !== 0) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  const partes = texto.split(':');
  if (!partes.length) return null;
  const horas = String(partes[0]).padStart(2, '0');
  const minutos = String(partes[1] ?? '00').padStart(2, '0');
  return `${horas}:${minutos}`;
};

const criarHorarioDate = (hhmm, referencia = new Date()) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const data = new Date(referencia);
  data.setHours(h, m, 0, 0);
  return data;
};

const mapearStatusCalendario = (tipo) => {
  switch (tipo) {
    case 'holiday':
      return { tipo: 'feriado', titulo: 'Feriado Corporativo', descricao: 'Regra de calendário indica feriado para hoje.' };
    case 'off':
      return { tipo: 'folga', titulo: 'Folga Programada', descricao: 'Calendário aponta dia de folga/dispensa.' };
    case 'work':
    default:
      return { tipo: 'trabalho' };
  }
};

const avaliarConfigSemanal = (jornada, dataReferencia) => {
  const dia = dataReferencia.getDay(); // 0 = Domingo
  const configSemanal = jornada?.config_semanal || {};
  const configDia = configSemanal[dia] || configSemanal[String(dia)];
  if (!configDia) {
    // fallback: verificar se dia está incluso no campo cad_ponto_dias_semana
    const diasCampo = jornada?.cad_ponto_dias_semana
      ? jornada.cad_ponto_dias_semana.split(',').map((d) => parseInt(d, 10))
      : [];
    if (diasCampo.includes(dia)) {
      const baseIntervalo = normalizarHorario(jornada?.cad_ponto_inicio_almoco) || normalizarHorario(jornada?.cad_ponto_inicio);
      const fimIntervaloAutomatico = baseIntervalo && jornada?.cad_ponto_tempo_pausa_min
        ? definindoFimIntervalo(baseIntervalo, jornada.cad_ponto_tempo_pausa_min)
        : null;
      return {
        tipo: 'trabalho',
        entry1: normalizarHorario(jornada?.cad_ponto_inicio),
        exit2: normalizarHorario(jornada?.cad_ponto_fim),
        exit1: normalizarHorario(jornada?.cad_ponto_inicio_almoco),
        entry2: jornada?.cad_ponto_pausa ? normalizarHorario(fimIntervaloAutomatico) : null,
      };
    }
    return { tipo: 'folga', titulo: 'Folga Programada', descricao: 'Nenhum horário previsto para este dia da semana.' };
  }

  const tipo = configDia?.type || (configDia?.enabled ? 'Normal' : 'Folga');
  if (!configDia.enabled || tipo !== 'Normal') {
    return {
      tipo: 'folga',
      titulo: tipo === 'Feriado' ? 'Feriado' : tipo,
      descricao: 'Configuração semanal indica ausência de expediente.',
    };
  }

  const entradaConfig = normalizarHorario(configDia.entry1) || normalizarHorario(jornada?.cad_ponto_inicio);
  const saidaConfig = normalizarHorario(configDia.exit2) || normalizarHorario(jornada?.cad_ponto_fim);
  let intervaloInicio = normalizarHorario(configDia.exit1);
  let intervaloFim = normalizarHorario(configDia.entry2);
  if ((!intervaloInicio || !intervaloFim) && jornada?.cad_ponto_pausa) {
    const baseIntervalo = intervaloInicio || normalizarHorario(jornada?.cad_ponto_inicio_almoco) || entradaConfig;
    if (baseIntervalo && !intervaloInicio) {
      intervaloInicio = baseIntervalo;
    }
    if (!intervaloFim && baseIntervalo && jornada?.cad_ponto_tempo_pausa_min) {
      intervaloFim = definindoFimIntervalo(baseIntervalo, jornada.cad_ponto_tempo_pausa_min);
    }
  }

  return {
    tipo: 'trabalho',
    entry1: entradaConfig,
    exit1: intervaloInicio,
    entry2: intervaloFim,
    exit2: saidaConfig,
  };
};

export const montarPontosDoDia = (jornada, dataReferencia = new Date()) => {
  if (!jornada) {
    return {
      statusDia: {
        tipo: 'sem-jornada',
        titulo: 'Nenhuma jornada vinculada',
        descricao: 'Cadastre ou vincule uma jornada para liberar o ponto.',
        dataISO: dataReferencia.toISOString().split('T')[0],
      },
      pontosPlanejados: [],
    };
  }

  const dataISO = dataReferencia.toISOString().split('T')[0];
  const overrideCalendario = (jornada.calendario_aplicacao || []).find((item) => item.data === dataISO);
  if (overrideCalendario) {
    const statusCalendario = mapearStatusCalendario(overrideCalendario.tipo);
    if (statusCalendario.tipo !== 'trabalho') {
      return {
        statusDia: {
          ...statusCalendario,
          dataISO,
          descricao: statusCalendario.descricao || 'Calendário customizado bloqueia marcação neste dia.',
        },
        pontosPlanejados: [],
      };
    }
  }

  const avaliacaoSemanal = avaliarConfigSemanal(jornada, dataReferencia);
  if (avaliacaoSemanal.tipo !== 'trabalho') {
    return {
      statusDia: {
        tipo: avaliacaoSemanal.tipo,
        titulo: avaliacaoSemanal.titulo || 'Folga',
        descricao: avaliacaoSemanal.descricao || 'Dia fora da escala.',
        dataISO,
      },
      pontosPlanejados: [],
    };
  }

  const entrada = avaliacaoSemanal.entry1 || normalizarHorario(jornada?.cad_ponto_inicio);
  const saida = avaliacaoSemanal.exit2 || normalizarHorario(jornada?.cad_ponto_fim);
  let inicioIntervalo = avaliacaoSemanal.exit1;
  let fimIntervalo = avaliacaoSemanal.entry2;

  if (!inicioIntervalo && jornada?.cad_ponto_pausa && jornada?.cad_ponto_inicio_almoco) {
    inicioIntervalo = normalizarHorario(jornada.cad_ponto_inicio_almoco);
  }
  if (!fimIntervalo && inicioIntervalo && jornada?.cad_ponto_tempo_pausa_min) {
    fimIntervalo = definindoFimIntervalo(inicioIntervalo, jornada.cad_ponto_tempo_pausa_min);
  }

  const pontosPlanejados = [];
  let identificador = 1;
  if (entrada) {
    pontosPlanejados.push({ id: identificador++, horario: entrada, tipo: 'Entrada', status: 'pendente', horarioMarcado: null });
  }
  if (inicioIntervalo && fimIntervalo) {
    pontosPlanejados.push({ id: identificador++, horario: inicioIntervalo, tipo: 'Inicio Intervalo', status: 'pendente', horarioMarcado: null });
    pontosPlanejados.push({ id: identificador++, horario: fimIntervalo, tipo: 'Fim Intervalo', status: 'pendente', horarioMarcado: null });
  }
  if (saida) {
    pontosPlanejados.push({ id: identificador++, horario: saida, tipo: 'Saida', status: 'pendente', horarioMarcado: null });
  }

  pontosPlanejados.sort((a, b) => a.horario.localeCompare(b.horario));

  return {
    statusDia: {
      tipo: 'trabalho',
      titulo: jornada.cad_ponto_nome || 'Jornada do dia',
      descricao: `${entrada || '--:--'} até ${saida || '--:--'}`,
      horariosPlanejados: {
        entrada,
        saida,
        inicioIntervalo: inicioIntervalo || null,
        fimIntervalo: fimIntervalo || null,
      },
      dataISO,
    },
    pontosPlanejados,
  };
};

/**
 * --- FUNÇÃO CORRIGIDA E OTIMIZADA ---
 * Busca a jornada de trabalho cadastrada que se aplica ao dia de hoje,
 * fazendo a requisição diretamente para o endpoint otimizado do backend.
 * @returns {Promise<Object|null>} Um objeto com os dados da jornada de hoje ou null se não encontrar.
 */
export const buscarJornadaDeHoje = async () => {
    try {
        // Agora chamamos diretamente o novo endpoint /jornada/hoje
        const response = await fetch(withCacheBuster(`${JORNADA_API_URL}/hoje?usu_id=${getUserId()}`), {
          headers: { 'Cache-Control': 'no-cache' },
        });

        // O backend pode retornar 204 (No Content) ou 404 se nada for encontrado
        if (response.status === 204 || response.status === 404) {
            return null;
        }
        
        // Se a resposta for null do backend, o .json() vai dar erro.
        // Verificamos o content-length para ter certeza.
        const contentLength = response.headers.get("content-length");
        if (contentLength === "0") {
            return null;
        }
        
        const text = await response.text();
        if(!text) return null; // Retorna nulo se o corpo da resposta estiver vazio
        
        const data = JSON.parse(text);
        if (data === null) {
            return null;
        }

        if (!response.ok) {
            const erro = data;
            throw new Error(erro.detail || 'Não foi possível carregar a jornada do dia.');
        }

        return data;

    } catch (error) {
        console.error("Erro no serviço ao buscar jornada de hoje:", error);
        throw error;
    }
};

export const encontrarProximoPonto = (pontosDoDia) => {
    const agora = new Date();
    const proximoPontoPendente = pontosDoDia.find(p => p.status === 'pendente');
    if (!proximoPontoPendente) {
        return null;
    }
    const [horas, minutos] = proximoPontoPendente.horario.split(':');
    const dataDoProximoPonto = new Date();
    dataDoProximoPonto.setHours(horas, minutos, 0, 0);
    return dataDoProximoPonto;
};

export const determinarStatusPonto = (diferencaMs, antecedenciaMs, toleranciaMs) => {
    if (diferencaMs > antecedenciaMs) {
        return { status: 'AGUARDANDO', podeMarcar: false };
    }
    else if (diferencaMs <= antecedenciaMs && diferencaMs > 0) {
        return { status: 'PERMITIDO', podeMarcar: true };
    }
    else if (diferencaMs <= 0 && diferencaMs > -toleranciaMs) {
        return { status: 'ATRASADO', podeMarcar: true };
    }
    else {
        return { status: 'PERDIDO', podeMarcar: false };
    }
}

export const formatarTempo = (milissegundos) => {
    const tempoAbsolutoMs = Math.abs(milissegundos);
    const horas = Math.floor(tempoAbsolutoMs / (1000 * 60 * 60));
    const minutos = Math.floor((tempoAbsolutoMs % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((tempoAbsolutoMs % (1000 * 60)) / 1000);

    return (
        `${String(horas).padStart(2, '0')}:` +
        `${String(minutos).padStart(2, '0')}:` +
        `${String(segundos).padStart(2, '0')}`
    );
};

export const dataAtual = () => {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = hoje.toLocaleString('pt-BR', { month: 'long' });
    const diaDaSemana = hoje.toLocaleString('pt-BR', { weekday: 'long' });
    return { dia, mes, diaDaSemana };
};

export const semanaAtual = () => {
    const dias = [];
    const hoje = new Date();
    // getDay() retorna 0 para Domingo, que é o início da semana visual.
    const diaDaSemanaAtual = hoje.getDay(); 

    for (let i = 0; i < 7; i++) {
        const data = new Date(hoje);
        // Calcula o dia da semana relativo ao primeiro dia (Domingo)
        data.setDate(hoje.getDate() - diaDaSemanaAtual + i);
        dias.push({
            id: i,
            dia: String(data.getDate()).padStart(2, '0'),
            nome: data.toLocaleString('pt-BR', { weekday: 'short' }).replace('.', ''),
        });
    }
    return dias;
};

/**
 * Busca a lista de TODOS os registros de ponto salvos no banco de dados.
 * Corresponde ao endpoint @app.get("/ponto/listar").
 *
 * @returns {Promise<Array>} Uma promessa que resolve para um array de objetos,
 * onde cada objeto é um registro de ponto (ex: {ponto_id: 1, ponto_data: ...}).
 */
export const listarPontos = async () => {
  try {
    const response = await fetch(withCacheBuster(`${PONTO_API_URL}/listar`), {
      headers: { 'Cache-Control': 'no-cache' },
    }); // Rota GET
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || 'Erro ao buscar registros no servidor.');
    }
    
    return await response.json(); // Retorna o array de registros [ {...}, {...} ]

  } catch (error) {
    console.error("Erro ao listar pontos:", error);
    throw error;
  }
};

/**
 * Registra uma marcação de ponto individual (Entrada, Saída, etc.) no backend.
 * O backend é responsável por gerar o carimbo de data/hora.
 *
 * @param {string} tipoPonto - O tipo de ponto a ser registrado (ex: 'Entrada', 'Início Intervalo').
 * @returns {Promise<Object>} Uma promessa que resolve para a mensagem de sucesso do backend.
 */
export const marcarPonto = async (tipoPonto) => {
  try {
    // O objeto de dados que o seu backend espera (MarcarPontoRequest)
    const dadosParaEnviar = {
      tipo: tipoPonto,
      usu_id: getUserId()
    };

    const response = await fetch(`${PONTO_API_URL}/marcar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // CORREÇÃO: O body agora envia o 'tipo', como o backend exige
      body: JSON.stringify(dadosParaEnviar),
    });

    if (!response.ok) {
      const erro = await response.json();
      // Tenta ler a mensagem de erro específica do FastAPI
      throw new Error(erro.detail || 'Erro ao marcar ponto no servidor.');
    }

    // Retorna a mensagem de sucesso, ex: {"mensagem": "Ponto de 'Entrada' registrado..."}
    return await response.json();

  } catch (error) {
    console.error("Erro ao marcar ponto:", error);
    throw error;
  }
};

export const obterDadosUsuario = async () => {
  try {
    const response = await fetch(`${USUARIO_API_URL}/listar`); // Rota GET
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.detail || 'Erro ao buscar registros no servidor.');
    }
    
    return await response.json(); // Retorna o array de registros [ {...}, {...} ]

  } catch (error) {
    console.error("Erro ao listar pontos:", error);
    throw error;
  }
}