import { useState, useEffect, useCallback } from "react";
import { Alert } from 'react-native';
import {
    horaAtualFormatada,
    encontrarProximoPonto,
    determinarStatusPonto,
    formatarTempo,
    dataAtual,
    semanaAtual,
    buscarJornadaDeHoje,
    montarPontosDoDia,
} from "../services/DashboardService";
import { marcarPontoIndividual, buscarRegistroDeHoje, listarRegistrosPonto, obterHorarioServidor } from "../services/RegistroPontoService";

// Helper function to extract the last record (keeps it internal to the hook file or could be in service)
const extrairUltimoRegistro = (registro) => {
    if (!registro) return null;
    const campos = [
        { chave: 'ponto_saida', label: 'Saída' },
        { chave: 'ponto_volta_almoco', label: 'Volta do Intervalo' },
        { chave: 'ponto_saida_almoco', label: 'Início do Intervalo' },
        { chave: 'ponto_entrada', label: 'Entrada' },
    ];
    const valores = campos
        .filter(({ chave }) => registro[chave])
        .map(({ chave, label }) => ({
            label,
            horario: new Date(registro[chave])
        }))
        .sort((a, b) => b.horario - a.horario);
    return valores[0] || null;
};

// The Custom Hook
export function useDashboardLogic() {
    // --- UI and Clock States ---
    const [horaExibida, setHoraExibida] = useState(horaAtualFormatada());
    const [tempoExibido, setTempoExibido] = useState('');
    const [podeMarcar, setPodeMarcar] = useState(false);
    const [statusPonto, setStatusPonto] = useState('CARREGANDO');
    const [diaAtual, setDiaAtual] = useState(dataAtual());
    const [diasDaSemana, setDiasDaSemana] = useState(semanaAtual());

    // --- Data States ---
    const [pontosDoDia, setPontosDoDia] = useState([]);
    const [jornada, setJornada] = useState(null);
    const [statusDia, setStatusDia] = useState(null);
    const [registroDoDia, setRegistroDoDia] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [ultimoRegistro, setUltimoRegistro] = useState(null);
    const [serverOffsetMs, setServerOffsetMs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to get corrected server time
    const getServerNow = useCallback(() => new Date(Date.now() + serverOffsetMs), [serverOffsetMs]);

    const sincronizarHorarioServidor = useCallback(async () => {
        try {
            const resposta = await obterHorarioServidor();
            // Handle different response formats if necessary
            const iso = resposta?.server_time || resposta?.serverTime;
            if (!iso) return;
            
            const serverDate = new Date(iso);
            const offset = serverDate.getTime() - Date.now();
            setServerOffsetMs(offset);
            
            // Update displayed time immediately upon sync
            setHoraExibida(serverDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err) {
            console.warn('Não foi possível sincronizar com o horário do servidor.', err);
        }
    }, []);

    // --- Main Data Loading Logic ---
    const carregarDadosDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setStatusDia(null);
            setPontosDoDia([]);

            // Sync time first
            await sincronizarHorarioServidor();

            const [jornadaAtual, registroHoje, registros] = await Promise.all([
                buscarJornadaDeHoje(),
                buscarRegistroDeHoje(),
                listarRegistrosPonto()
            ]);

            setJornada(jornadaAtual);
            setRegistroDoDia(registroHoje);

            // Process History
            const historicoOrdenado = Array.isArray(registros)
                ? [...registros].sort((a, b) => new Date(b.ponto_data) - new Date(a.ponto_data))
                : [];
            setHistorico(historicoOrdenado.slice(0, 10));
            
            // Process Last Record
            setUltimoRegistro(extrairUltimoRegistro(registroHoje));

            if (!jornadaAtual) {
                setStatusDia({
                    tipo: 'sem-jornada',
                    titulo: 'Nenhuma jornada vinculada',
                    descricao: 'Cadastre uma jornada ou vincule o colaborador.',
                });
                setPontosDoDia([]);
                return; // Exit early if no journey
            }

            // Process Day's Points using Service logic
            const avaliacaoDia = montarPontosDoDia(jornadaAtual);
            setStatusDia(avaliacaoDia.statusDia);
            let pontosGerados = avaliacaoDia.pontosPlanejados;

            // Merge with existing records
            if (registroHoje && pontosGerados.length) {
                const mapaRegistros = {
                    'Entrada': registroHoje.ponto_entrada,
                    'Inicio Intervalo': registroHoje.ponto_saida_almoco, // Note: check casing 'Inicio' vs 'Início' consistency in your DB/Service
                    'Início Intervalo': registroHoje.ponto_saida_almoco,
                    'Fim Intervalo': registroHoje.ponto_volta_almoco,
                    'Saída': registroHoje.ponto_saida,
                    'Saida': registroHoje.ponto_saida,
                };
                
                const mapaStatus = {
                     'Entrada': registroHoje.ponto_entrada_status,
                     'Inicio Intervalo': registroHoje.ponto_saida_almoco_status,
                     'Início Intervalo': registroHoje.ponto_saida_almoco_status,
                     'Fim Intervalo': registroHoje.ponto_volta_almoco_status,
                     'Saída': registroHoje.ponto_saida_status,
                     'Saida': registroHoje.ponto_saida_status,
                };

                pontosGerados = pontosGerados.map(ponto => {
                    if (mapaRegistros[ponto.tipo]) {
                        const horarioPrevisto = new Date();
                        const [h, m] = ponto.horario.split(':');
                        horarioPrevisto.setHours(h, m, 0, 0);

                        const horarioMarcadoDate = new Date(mapaRegistros[ponto.tipo]);
                        const toleranciaMs = (jornadaAtual.cad_ponto_tolerancia_min || 0) * 60 * 1000;

                        const foiAtrasado = horarioMarcadoDate.getTime() > (horarioPrevisto.getTime() + toleranciaMs);

                        return { ...ponto, status: 'MARCADO', horarioMarcado: horarioMarcadoDate, foiAtrasado: foiAtrasado };
                    } else if ((mapaStatus[ponto.tipo] || '').toUpperCase() === 'PULADO') {
                        return { ...ponto, status: 'PULADO' };
                    }
                    return ponto;
                });
            }

            setPontosDoDia(pontosGerados);
        } catch (err) {
            setError(err.message || "Erro ao conectar com o servidor.");
        } finally {
            setLoading(false);
        }
    }, [sincronizarHorarioServidor]); // Dependency on sincronizarHorarioServidor

    // --- Effects ---

    // 1. Clock Ticker
    useEffect(() => {
        const atualizarRelogio = () => {
            const agora = getServerNow();
            setHoraExibida(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        atualizarRelogio(); // Initial call
        const timer = setInterval(atualizarRelogio, 1000);
        return () => clearInterval(timer);
    }, [getServerNow]);

    // 2. Server Sync Interval (every 60s)
    useEffect(() => {
        // Initial sync is done in carregarDadosDashboard, but we can also do one here if needed
        // sincronizarHorarioServidor(); 
        const syncInterval = setInterval(sincronizarHorarioServidor, 60000);
        return () => clearInterval(syncInterval);
    }, [sincronizarHorarioServidor]);


    // 3. Status Calculation Logic (The "Heartbeat" of the dashboard)
    useEffect(() => {
        if (loading || error) return;
        
        if (!statusDia || statusDia.tipo !== 'trabalho') {
            setStatusPonto(statusDia?.tipo === 'sem-jornada' ? 'SEM JORNADA' : 'INATIVO');
            setPodeMarcar(false);
            setTempoExibido(statusDia?.titulo || 'Sem jornada');
            return;
        }

        const timer = setInterval(() => {
            const proximoPontoConfig = encontrarProximoPonto(pontosDoDia);

            if (proximoPontoConfig && jornada) {
                const agora = getServerNow();
                const diferencaMs = proximoPontoConfig.getTime() - agora.getTime();
                const minutosTolerancia = jornada.cad_ponto_tolerancia_min || 5;
                // Assuming minutesAntecedencia is fixed or comes from somewhere. 
                // You had it as const in Dashboard.
                const minutosAntecedencia = 10; 
                
                const toleranciaMs = minutosTolerancia * 60 * 1000;
                const antecedenciaMs = minutosAntecedencia * 60 * 1000;

                const { status, podeMarcar: podeMarcarStatus } = determinarStatusPonto(diferencaMs, antecedenciaMs, toleranciaMs);

                setStatusPonto(status);
                setPodeMarcar(podeMarcarStatus);
                setTempoExibido(formatarTempo(diferencaMs > 0 ? diferencaMs : 0));
            } else {
                setTempoExibido('Jornada Finalizada');
                setStatusPonto('FINALIZADO');
                setPodeMarcar(false);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [pontosDoDia, jornada, loading, error, statusDia, getServerNow]);


    // --- Handlers ---
    const marcarPontoHandler = async () => {
        if (!statusDia || statusDia.tipo !== 'trabalho') {
            Alert.alert("Dia inativo", "Este dia está configurado como folga/feriado no cadastro de jornada.");
            return;
        }

        const pontoASerMarcado = pontosDoDia.find(p => p.status === 'pendente');
        if (!pontoASerMarcado || !jornada) {
            Alert.alert("Atenção", "Não há um próximo ponto pendente para marcar ou a jornada não foi carregada.");
            return;
        }

        const agora = getServerNow();
        const [horas, minutos] = pontoASerMarcado.horario.split(':');
        const horarioPonto = new Date();
        horarioPonto.setHours(horas, minutos, 0, 0);

        const diferencaMs = horarioPonto.getTime() - agora.getTime();
        const minutosTolerancia = jornada.cad_ponto_tolerancia_min || 5;
        const minutosAntecedencia = 10;
        const toleranciaMs = minutosTolerancia * 60 * 1000;
        const antecedenciaMs = minutosAntecedencia * 60 * 1000;

        const { status: statusNoMomentoDoClique, podeMarcar: podeMarcarNoMomentoDoClique } = determinarStatusPonto(
            diferencaMs, antecedenciaMs, toleranciaMs
        );
        
        if (!podeMarcarNoMomentoDoClique) {
            Alert.alert("Fora do Horário", "O tempo para marcar este ponto expirou.");
            setStatusPonto(statusNoMomentoDoClique); 
            setPodeMarcar(false);
            return;
        }

        try {
            // NOTE: Your new marcarPontoIndividual might take 'jornada.cad_id' now? 
            // In the code you pasted previously it took (tipo, jornadaId).
            // Checking your last pasted code: await marcarPontoIndividual(pontoASerMarcado.tipo, jornada.cad_id);
            const resultado = await marcarPontoIndividual(pontoASerMarcado.tipo, jornada.cad_id);

            const horarioDaMarcacao = getServerNow();
            const novosPontos = pontosDoDia.map(ponto => {
                if (ponto.id === pontoASerMarcado.id) {
                    return {
                        ...ponto,
                        status: 'MARCADO',
                        horarioMarcado: horarioDaMarcacao,
                        foiAtrasado: statusNoMomentoDoClique === 'ATRASADO'
                    };
                }
                return ponto;
            });

            setPontosDoDia(novosPontos);
            Alert.alert("Sucesso!", resultado.mensagem);
            
            // Optionally refresh data from server to be sure
            // carregarDadosDashboard(); 

        } catch (error) {
            Alert.alert("Erro ao Marcar Ponto", error.message);
        }
    };

    return {
        horaExibida,
        tempoExibido,
        podeMarcar,
        statusPonto,
        diaAtual,
        diasDaSemana,
        pontosDoDia,
        jornada,
        statusDia,
        loading,
        error,
        marcarPontoHandler,
        carregarDadosDashboard,
        registroDoDia,
        historico,
        ultimoRegistro,
    };
}