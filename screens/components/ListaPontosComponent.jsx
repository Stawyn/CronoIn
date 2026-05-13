import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Cores e Espaçamentos (Idealmente viriam de um arquivo de tema, mas vamos fixar aqui para consistência)
const colors = {
    cardBg: '#ffffff',
    text: '#2d4150',
    subtext: '#888',
    border: '#f0f0f0',
    primary: '#26b4dfee',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30'
};

export default function ListaPontosComponent({ pontosDoDia, jornada, statusDia, virtualized = true }) {

    const renderPontoItem = ({ item }) => {
        const formatarHorario = (data) => {
            if (!data) return '--:--';
            return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        };

        let statusColor = colors.subtext;
        let iconName = "time-outline";
        let statusText = item.horario;

        if (item.status === 'MARCADO') {
            statusColor = item.foiAtrasado ? colors.warning : colors.success;
            iconName = item.foiAtrasado ? "alert-circle" : "checkmark-circle";
            statusText = `Marcado às ${formatarHorario(item.horarioMarcado)}`;
        } else if (item.status === 'PULADO') {
            statusColor = colors.warning;
            iconName = "play-skip-forward-circle";
            statusText = "Ponto pulado";
        } else if (item.status === 'cancelado') {
            statusColor = colors.subtext;
            iconName = "close-circle";
            statusText = "Cancelado";
        }

        return (
            <View style={styles.row}>
                <View style={styles.typeContainer}>
                    <View style={[styles.indicator, { backgroundColor: statusColor }]} />
                    <Text style={styles.typeText}>{item.tipo}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <Ionicons name={iconName} size={16} color={statusColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: statusColor, fontWeight: item.status === 'MARCADO' ? 'bold' : 'normal' }]}>
                        {statusText}
                    </Text>
                </View>
            </View>
        );
    };

    const mostrarLista = pontosDoDia && pontosDoDia.length > 0;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Detalhes da Jornada</Text>
                {jornada && <Text style={styles.subtitle}>{jornada.cad_ponto_nome}</Text>}
            </View>

            {mostrarLista ? (
                virtualized ? (
                    <FlatList
                        data={pontosDoDia}
                        renderItem={renderPontoItem}
                        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                        scrollEnabled={false} // Deixa o scroll para a tela principal
                    />
                ) : (
                    pontosDoDia.map((item) => (
                        <React.Fragment key={item.id}>{renderPontoItem({ item })}</React.Fragment>
                    ))
                )
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>{statusDia?.tipo === 'trabalho' ? '📋' : '🎉'}</Text>
                    <Text style={styles.emptyText}>
                        {statusDia?.tipo === 'trabalho' ? 'Nenhum ponto planejado' : statusDia?.titulo || 'Dia livre'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
        // Sombra suave estilo iOS/Android
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: colors.subtext,
        marginTop: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    typeText: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyText: {
        color: colors.subtext,
        fontSize: 14,
    }
});