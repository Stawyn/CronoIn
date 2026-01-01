import React, { useCallback, useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    RefreshControl 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { useDashboardLogic } from '../hooks/useDashboardLogic';
import ListaPontosComponent from './components/ListaPontosComponent';

const formatarHoraCurta = (data) => {
    if (!data) return '--:--';
    const instancia = data instanceof Date ? data : new Date(data);
    return instancia.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const calcularHorasTrabalhadas = (registro) => {
    if (!registro?.ponto_entrada) return '--:--';
    const inicio = new Date(registro.ponto_entrada);
    const fim = registro.ponto_saida ? new Date(registro.ponto_saida) : new Date();
    const diff = Math.max(fim.getTime() - inicio.getTime(), 0);
    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

export default function Dashboard({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const {
        horaExibida,
        tempoExibido,
        podeMarcar,
        statusPonto,
        diaAtual,
        pontosDoDia,
        jornada,
        statusDia,
        loading,
        error,
        carregarDadosDashboard,
        registroDoDia,
        historico,
        ultimoRegistro,
    } = useDashboardLogic();

    useFocusEffect(
        useCallback(() => {
            carregarDadosDashboard();
        }, [carregarDadosDashboard])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await carregarDadosDashboard();
        } finally {
            setRefreshing(false);
        }
    }, [carregarDadosDashboard]);

    const horasHoje = calcularHorasTrabalhadas(registroDoDia);
    const totalPlanejado = pontosDoDia.length;
    const marcados = pontosDoDia.filter((p) => p.status === 'MARCADO').length;

    const handleOpenFlow = () => {
        navigation.navigate('ClockInFlow', {
            jornada,
            statusDia,
            pontosDoDia,
        });
    };

    const handleOpenFacialDebug = () => {
        navigation.navigate('FacialDebug');
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando jornada de hoje...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.dayTitle}>{diaAtual?.diaDaSemana}</Text>
                    <Text style={styles.daySubtitle}>{`${diaAtual?.dia} de ${diaAtual?.mes}`}</Text>
                </View>
                <View style={styles.headerActions}>
                    <View style={styles.badgeOnline}>
                        <Ionicons name="radio-button-on" size={16} color="#34C759" />
                        <Text style={styles.badgeOnlineText}>Online</Text>
                    </View>
                    <TouchableOpacity style={[styles.debugButton, styles.headerActionsSpacer]} onPress={handleOpenFacialDebug}>
                        <Ionicons name="bug" size={14} color={colors.primary} />
                        <Text style={styles.debugButtonText}>Testar IA</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.clockCard}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.clockValue}>{horaExibida}</Text>
                    <Text style={styles.clockDescriptor}>Próximo ponto em</Text>
                    <Text style={styles.clockCountdown}>{tempoExibido}</Text>
                    <Text style={styles.clockLastRecord}>
                        Último registro: {ultimoRegistro ? `${ultimoRegistro.label} às ${formatarHoraCurta(ultimoRegistro.horario)}` : 'Nenhum registro hoje'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.primaryButton, !podeMarcar && styles.primaryButtonDisabled]}
                    onPress={handleOpenFlow}
                    disabled={!podeMarcar}
                >
                    <Ionicons name="finger-print" size={24} color="#fff" />
                    <Text style={styles.primaryButtonText}>Registrar Ponto</Text>
                    <Text style={styles.buttonHelper}>{statusDia?.titulo || 'Fluxo padrão'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Horas hoje</Text>
                    <Text style={styles.summaryValue}>{horasHoje}</Text>
                    <Text style={styles.summaryHelper}>{marcados}/{totalPlanejado} marcações</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Prev. saída</Text>
                    <Text style={styles.summaryValue}>{statusDia?.horariosPlanejados?.saida || '--:--'}</Text>
                    <Text style={styles.summaryHelper}>{statusDia?.titulo || 'Sem jornada'}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Status</Text>
                    <Text style={[styles.summaryValue, styles[`status${statusPonto}`] || {}]}>{statusPonto}</Text>
                    <Text style={styles.summaryHelper}>Limite em {tempoExibido}</Text>
                </View>
            </View>

            {statusDia && (
                <View style={[styles.sectionCard, statusDia.tipo !== 'trabalho' && styles.sectionCardBlocked]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Jornada de hoje</Text>
                        <Text style={[styles.statusTag, statusDia.tipo === 'trabalho' ? styles.statusTagActive : styles.statusTagInactive]}>
                            {statusDia.tipo === 'trabalho' ? 'Ativo' : 'Bloqueado'}
                        </Text>
                    </View>
                    <Text style={styles.sectionDescription}>{statusDia.descricao}</Text>
                    {statusDia?.horariosPlanejados && (
                        <View style={styles.scheduleRow}>
                            <View style={styles.scheduleItem}>
                                <Text style={styles.scheduleLabel}>Entrada</Text>
                                <Text style={styles.scheduleValue}>{statusDia.horariosPlanejados.entrada || '--:--'}</Text>
                            </View>
                            <View style={styles.scheduleItem}>
                                <Text style={styles.scheduleLabel}>Intervalo</Text>
                                <Text style={styles.scheduleValue}>
                                    {statusDia.horariosPlanejados.inicioIntervalo
                                        ? `${statusDia.horariosPlanejados.inicioIntervalo} → ${statusDia.horariosPlanejados.fimIntervalo || '--:--'}`
                                        : '--:--'}
                                </Text>
                            </View>
                            <View style={styles.scheduleItem}>
                                <Text style={styles.scheduleLabel}>Saída</Text>
                                <Text style={styles.scheduleValue}>{statusDia.horariosPlanejados.saida || '--:--'}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

                <ListaPontosComponent
                    pontosDoDia={pontosDoDia}
                    jornada={jornada}
                    statusDia={statusDia}
                    virtualized={false}
                />

            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Últimas marcações</Text>
                    <TouchableOpacity onPress={carregarDadosDashboard}>
                        <Ionicons name="refresh" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                {historico && historico.length > 0 ? (
                    historico.slice(0, 5).map((registro) => (
                        <View key={registro.ponto_id} style={styles.historyRow}>
                            <View>
                                <Text style={styles.historyType}>{registro.ponto_tipo || registro.tipo || 'Registro'}</Text>
                                <Text style={styles.historyDate}>{formatarHoraCurta(registro.ponto_data)}</Text>
                            </View>
                            <Text style={styles.historyNsr}>NSR #{registro.ponto_id || '---'}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyHistory}>Nenhum registro disponível.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: spacing.l, paddingBottom: spacing.xxl },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    loadingText: { marginTop: spacing.m, color: colors.muted },
    errorText: { color: colors.danger, fontSize: 16, textAlign: 'center', padding: spacing.l },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l },
    headerActions: { alignItems: 'flex-end' },
    headerActionsSpacer: { marginTop: spacing.s },
    dayTitle: { fontSize: 20, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
    daySubtitle: { color: colors.muted, marginTop: 4, textTransform: 'capitalize' },
    badgeOnline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9F8EF', paddingHorizontal: spacing.m, paddingVertical: spacing.s, borderRadius: radius.m },
    badgeOnlineText: { marginLeft: spacing.s, color: colors.success, fontWeight: '600' },
    debugButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.s, paddingVertical: spacing.xs, borderRadius: radius.s, backgroundColor: '#EEF3FF' },
    debugButtonText: { marginLeft: spacing.xs, color: colors.primary, fontWeight: '600', fontSize: 12, textTransform: 'uppercase' },
    clockCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.l, padding: spacing.l, marginBottom: spacing.l, alignItems: 'center', gap: spacing.l },
    clockValue: { fontSize: 42, fontWeight: '700', color: colors.text },
    clockDescriptor: { color: colors.muted, marginTop: spacing.s },
    clockCountdown: { fontSize: 18, fontWeight: '600', color: colors.primary, marginTop: spacing.xs },
    clockLastRecord: { marginTop: spacing.m, color: colors.muted },
    primaryButton: { backgroundColor: colors.primary, padding: spacing.m, borderRadius: radius.l, alignItems: 'center', width: 170 },
    primaryButtonDisabled: { backgroundColor: colors.border },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: spacing.s },
    buttonHelper: { color: '#e0e0e0', fontSize: 12, marginTop: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryRow: { flexDirection: 'row', gap: spacing.m, marginBottom: spacing.l },
    summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: radius.m, padding: spacing.m },
    summaryLabel: { color: colors.muted, fontSize: 13, textTransform: 'uppercase' },
    summaryValue: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: spacing.s },
    summaryHelper: { color: colors.muted, marginTop: spacing.xs },
    sectionCard: { backgroundColor: '#fff', borderRadius: radius.l, padding: spacing.l, marginBottom: spacing.l },
    sectionCardBlocked: { borderWidth: 1, borderColor: colors.warning, backgroundColor: '#FFF8F0' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    sectionDescription: { color: colors.muted, flex: 1, marginLeft: spacing.s },
    statusTag: { paddingHorizontal: spacing.m, paddingVertical: spacing.xs, borderRadius: radius.s, fontSize: 12, fontWeight: '600' },
    statusTagActive: { backgroundColor: '#E8F4FF', color: colors.primary },
    statusTagInactive: { backgroundColor: '#FFECEA', color: colors.danger },
    scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.m },
    scheduleItem: { flex: 1 },
    scheduleLabel: { color: colors.muted, fontSize: 12, textTransform: 'uppercase' },
    scheduleValue: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.s, borderBottomWidth: 1, borderBottomColor: colors.border },
    historyType: { fontWeight: '600', color: colors.text },
    historyDate: { color: colors.muted },
    historyNsr: { color: colors.primary, fontWeight: '600' },
    emptyHistory: { color: colors.muted, textAlign: 'center', paddingVertical: spacing.m },
});
