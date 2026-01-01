import { useState, useEffect, useCallback } from 'react';
import {
    formatarDataParaChave,
    gerarMarcacoesJornada,
    gerarMarcacoesDatasEspecificas
} from '../services/CalendarioService';
import { 
    buscarJornadaDeHoje, 
    montarPontosDoDia 
} from '../services/DashboardService';
import { listarRegistrosPonto } from '../services/RegistroPontoService';

export function useCalendarioLogic() {
    const [selected, setSelected] = useState(formatarDataParaChave(new Date()));
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS DE DADOS ---
    // Usamos o nome padrão 'pontosDoDia' para evitar confusão
    const [pontosDoDia, setPontosDoDia] = useState([]); 
    const [jornada, setJornada] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [statusDia, setStatusDia] = useState(null);

    // Estados Visuais (Cores)
    const [marcacoesJornada, setMarcacoesJornada] = useState({});
    const [marcacoesConcluidas, setMarcacoesConcluidas] = useState({});
    const [marcacoesAtrasadas, setMarcacoesAtrasadas] = useState({});
    const [marcacoesFaltas, setMarcacoesFaltas] = useState({});
    const [marcacoesRecesso, setMarcacoesRecesso] = useState({});

    const CORES = {
        jornada: '#fee760ff',   
        concluida: '#a0fc90ff', 
        atrasada: '#fc9d50ff',  
        falta: '#ff7070ff',     
        recesso: '#85efefff',   
        selecionado: '#5cc1e0ee'
    };

    // Função auxiliar para classificar o registro
    const classificarRegistro = (registro, jornadaRef) => {
        if (!registro.ponto_entrada) return 'FALTA';
        const estaCompleto = registro.ponto_entrada && registro.ponto_saida;
        
        if (!estaCompleto) {
            const dataRegistro = new Date(registro.ponto_data + 'T00:00:00');
            const hoje = new Date();
            if (dataRegistro.setHours(0,0,0,0) < hoje.setHours(0,0,0,0)) {
                return 'FALTA'; 
            }
            return 'PENDENTE';
        }

        if (jornadaRef && jornadaRef.cad_ponto_inicio) {
            const entradaMarcada = new Date(registro.ponto_entrada);
            const horaPrevistaParts = jornadaRef.cad_ponto_inicio.split(':');
            const entradaPrevista = new Date(registro.ponto_entrada);
            entradaPrevista.setHours(horaPrevistaParts[0], horaPrevistaParts[1], 0);
            const toleranciaMs = (jornadaRef.cad_ponto_tolerancia_min || 5) * 60 * 1000;

            if (entradaMarcada.getTime() > (entradaPrevista.getTime() + toleranciaMs)) {
                return 'ATRASADO';
            }
        }
        return 'CONCLUIDO';
    };

    // 1. Carrega dados iniciais (Jornada e Histórico)
    const carregarDadosCalendario = useCallback(async () => {
        setLoading(true);
        try {
            const [jornadaAtual, historicoCompleto] = await Promise.all([
                buscarJornadaDeHoje(),
                listarRegistrosPonto()
            ]);

            setJornada(jornadaAtual);
            setHistorico(historicoCompleto || []);

            // --- Lógica de Cores do Calendário ---
            const dataHoje = new Date();
            const diasConcluidos = [];
            const diasAtrasados = [];
            const diasFaltas = [];
            
            if (historicoCompleto && Array.isArray(historicoCompleto)) {
                historicoCompleto.forEach(registo => {
                    const dataRegisto = new Date(registo.ponto_data + 'T12:00:00');
                    const status = classificarRegistro(registo, jornadaAtual);

                    if (status === 'CONCLUIDO') diasConcluidos.push(dataRegisto);
                    else if (status === 'ATRASADO') diasAtrasados.push(dataRegisto);
                    else if (status === 'FALTA') diasFaltas.push(dataRegisto);
                });
            }

            const mVerdes = gerarMarcacoesDatasEspecificas(diasConcluidos, CORES.concluida);
            const mLaranjas = gerarMarcacoesDatasEspecificas(diasAtrasados, CORES.atrasada);
            const mVermelhas = gerarMarcacoesDatasEspecificas(diasFaltas, CORES.falta);
            
            const hojeFormatado = formatarDataParaChave(dataHoje);
            const excecoes = [
                ...Object.keys(mVerdes),
                ...Object.keys(mLaranjas),
                ...Object.keys(mVermelhas),
                hojeFormatado 
            ];

            let mAmarelas = {};
            if (jornadaAtual && jornadaAtual.cad_ponto_dias_semana) {
                const diasDeTrabalho = jornadaAtual.cad_ponto_dias_semana.split(',').map(Number);
                let dataInicio = new Date();
                if (jornadaAtual.cad_info_data_criacao) {
                   dataInicio = new Date(jornadaAtual.cad_info_data_criacao);
                }
                mAmarelas = gerarMarcacoesJornada(dataInicio, diasDeTrabalho, CORES.jornada, excecoes);
            }

            setMarcacoesConcluidas(mVerdes);
            setMarcacoesAtrasadas(mLaranjas);
            setMarcacoesFaltas(mVermelhas);
            setMarcacoesJornada(mAmarelas);
            
            if (!selected) {
                setSelected(hojeFormatado);
            }

        } catch (error) {
            console.error("Erro ao carregar dados do calendário:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarDadosCalendario();
    }, [carregarDadosCalendario]);

    // 2. Efeito para calcular a LISTA DE PONTOS quando o dia selecionado mudar
    useEffect(() => {
        if (!selected || !jornada) return;

        // Data selecionada
        const dataSelecionadaObj = new Date(selected + 'T12:00:00');

        // A. Gera a estrutura planejada
        const avaliacaoDia = montarPontosDoDia(jornada, dataSelecionadaObj);
        let pontosGerados = avaliacaoDia.pontosPlanejados;
        setStatusDia(avaliacaoDia.statusDia);

        // B. Tenta encontrar registro no histórico
        const registroEncontrado = historico.find(r => r.ponto_data === selected);

        // C. Mescla se houver registro
        if (registroEncontrado && pontosGerados.length > 0) {
            const mapaRegistros = {
                'Entrada': registroEncontrado.ponto_entrada,
                'Inicio Intervalo': registroEncontrado.ponto_saida_almoco,
                'Início Intervalo': registroEncontrado.ponto_saida_almoco,
                'Fim Intervalo': registroEncontrado.ponto_volta_almoco,
                'Saída': registroEncontrado.ponto_saida,
                'Saida': registroEncontrado.ponto_saida,
            };

            pontosGerados = pontosGerados.map(ponto => {
                if (mapaRegistros[ponto.tipo]) {
                    const horarioMarcadoDate = new Date(mapaRegistros[ponto.tipo]);
                    return { ...ponto, status: 'MARCADO', horarioMarcado: horarioMarcadoDate, foiAtrasado: false };
                }
                return ponto;
            });
        }

        setPontosDoDia(pontosGerados); // Atualiza a lista da tela

    }, [selected, jornada, historico]);

    const onDayPress = (day) => {
        setSelected(day.dateString);
    };

    return {
        selected,
        setSelected,
        onDayPress,
        loading,
        pontosDoDia, // <-- Aqui está a variável correta (sem 'Selecionado')
        jornada,
        statusDia,
        marcacoes: { 
            jornada: marcacoesJornada,
            concluidas: marcacoesConcluidas,
            atrasadas: marcacoesAtrasadas,
            faltas: marcacoesFaltas,
            recesso: marcacoesRecesso
        },
        CORES
    };
}