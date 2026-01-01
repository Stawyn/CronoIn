import { JORNADA_API_URL, PONTO_API_URL, USUARIO_API_URL, CURRENT_USER_ID } from '../api/api';

/**
 * Formata um objeto Date para o formato de string 'YYYY-MM-DD'.
 * @param {Date} date - O objeto de data.
 * @returns {string} A data formatada.
 */
export function formatarDataParaChave(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

/**
 * Gera o objeto de marcações para a jornada de trabalho.
 * @param {Date} dataInicio - O dia em que a jornada começa.
 * @param {number[]} diasDaSemana - Array com os números dos dias (0=Dom, 1=Seg, ... 6=Sab).
 * @param {string} cor - A cor da marcação.
 * @param {string[]} [datasDeExcecao=[]] - Array de datas ('YYYY-MM-DD') que devem ser ignoradas.
 * @returns {Object} O objeto de marcações pronto.
 */
export function gerarMarcacoesJornada(dataInicio, diasDaSemana, cor, datasDeExcecao = []) {
    const marcacoes = {};
    const data = new Date(dataInicio);
    const corPeriodo = { color: cor, textColor: '#333' };

    // 1. Crie um Set (mapa de alta velocidade) com as exceções
    const excecoesSet = new Set(datasDeExcecao);

    for (let i = 0; i < 180; i++) {
        const chaveData = formatarDataParaChave(data);
        const diaSemanaAtual = data.getDay();

        // 2. PULE este dia se ele for uma exceção (ex: já está verde ou azul)
        if (excecoesSet.has(chaveData)) {
            data.setDate(data.getDate() + 1); // Avança o dia
            continue; // Pula para a próxima iteração do loop
        }

        // Se o dia atual é um dia de trabalho (e não é uma exceção)
        if (diasDaSemana.includes(diaSemanaAtual)) {
            
            // --- Verifique o dia anterior ---
            const dataAnterior = new Date(data);
            dataAnterior.setDate(data.getDate() - 1);
            const chaveAnterior = formatarDataParaChave(dataAnterior);
            // O dia anterior era de trabalho E não era uma exceção?
            const eraDiaDeTrabalho = diasDaSemana.includes(dataAnterior.getDay()) && !excecoesSet.has(chaveAnterior);

            // --- Verifique o dia seguinte ---
            const dataSeguinte = new Date(data);
            dataSeguinte.setDate(data.getDate() + 1);
            const chaveSeguinte = formatarDataParaChave(dataSeguinte);
            // O dia seguinte é de trabalho E não é uma exceção?
            const eDiaSeguinteDeTrabalho = diasDaSemana.includes(dataSeguinte.getDay()) && !excecoesSet.has(chaveSeguinte);

            // 3. A lógica de "fechamento" agora respeita as exceções
            marcacoes[chaveData] = {
                ...corPeriodo,
                startingDay: !eraDiaDeTrabalho,
                endingDay: !eDiaSeguinteDeTrabalho
            };
        }
        // Avança para o próximo dia
        data.setDate(data.getDate() + 1);
    }
    return marcacoes;
}

/**
 * Gera marcações para um array de datas *específicas*, 
 * conectando dias sequenciais (ex: '2025-11-04' e '2025-11-05').
 * @param {Date[]} datas - Um array de objetos Date específicos a marcar.
 * @param {string} cor - A cor da marcação.
 * @returns {Object} O objeto de marcações pronto para o <Calendar>.
 */
export function gerarMarcacoesDatasEspecificas(datas, cor) {
    const marcacoes = {};
    if (!datas || datas.length === 0) {
        return marcacoes;
    }

    const corPeriodo = { color: cor, textColor: 'black' }; // Texto preto para fundo verde/amarelo

    // 1. Converte todas as datas para strings 'YYYY-MM-DD'
    const chavesData = datas.map(formatarDataParaChave).sort();
    
    // 2. Cria um Set (um "mapa" de alta velocidade) para verificar a existência
    const dataSet = new Set(chavesData);

    // 3. Itera sobre as datas específicas
    for (const chaveData of chavesData) {
        
        // 4. Verifica se o dia anterior ou seguinte TAMBÉM estão na lista
        const dataAtual = new Date(chaveData + 'T12:00:00'); // 'T12:00' evita bugs de fuso horário

        const dataAnterior = new Date(dataAtual);
        dataAnterior.setDate(dataAtual.getDate() - 1);
        const chaveAnterior = formatarDataParaChave(dataAnterior);
        
        const dataSeguinte = new Date(dataAtual);
        dataSeguinte.setDate(dataAtual.getDate() + 1);
        const chaveSeguinte = formatarDataParaChave(dataSeguinte);

        const eraDiaConcluido = dataSet.has(chaveAnterior);
        const eDiaSeguinteConcluido = dataSet.has(chaveSeguinte);

        // 5. Aplica a mesma lógica de "oval" de antes
        marcacoes[chaveData] = {
            ...corPeriodo,
            startingDay: !eraDiaConcluido,
            endingDay: !eDiaSeguinteConcluido
        };
    }
    
    return marcacoes;
}

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