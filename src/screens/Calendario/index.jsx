import React, { useState } from "react";
import { View, Text, StyleSheet,ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { colors, spacing, radius } from '../../theme';

// Imports Personalizados
import ListaPontosComponent from '../components/ListaPontosComponent';
import { useCalendarioLogic } from '../../hooks/useCalendarioLogic'; // Seu novo hook

import '../../config/calendarConfig';

export default function Calendario ({ navigation }) {
    // 1. Usamos o Hook para toda a lógica de calendário
    const { 
        selected, 
        onDayPress, 
        marcacoes, 
        CORES,
        pontosDoDia,
        jornada,
        statusDia,
    } = useCalendarioLogic();

    return (
        <View style={styles.body}>
            <ScrollView>
            <View>
                <Calendar
                    markingType={'period'}
                    onDayPress={onDayPress} // Usa a função do hook
                    markedDates={{
                        ...marcacoes.jornada,
                        ...marcacoes.concluidas,
                        ...marcacoes.atrasadas,
                        ...marcacoes.faltas,
                        ...marcacoes.recesso,
                        [selected]: {
                            startingDay: true, 
                            endingDay: true,
                            disableTouchEvent: true,
                            textColor: 'white',
                            color: CORES.selecionado
                        }
                    }}
                    theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#b6c1cd',
                        selectedDayBackgroundColor: '#00adf5',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#00adf5',
                        dayTextColor: '#2d4150',
                        textDisabledColor: '#dd99ee'
                    }}
                />
                
                {/* Legenda */}
                <View style={styles.legendaContainer}>
                    <View style={styles.legendaItem}>
                        <View style={[styles.legendaCor, {backgroundColor: CORES.jornada}]} />
                        <Text style={styles.legendaTexto}>Dia de Trabalho</Text>
                    </View>
                    <View style={styles.legendaItem}>
                        <View style={[styles.legendaCor, {backgroundColor: CORES.concluida}]} />
                        <Text style={styles.legendaTexto}>Concluída</Text>
                    </View>
                    <View style={styles.legendaItem}>
                        <View style={[styles.legendaCor, {backgroundColor: CORES.atrasada}]} />
                        <Text style={styles.legendaTexto}>Atrasada</Text>
                    </View>
                    <View style={styles.legendaItem}>
                        <View style={[styles.legendaCor, {backgroundColor: CORES.falta}]} />
                        <Text style={styles.legendaTexto}>Falta</Text>
                    </View>
                    <View style={styles.legendaItem}>
                        <View style={[styles.legendaCor, {backgroundColor: CORES.recesso}]} />
                        <Text style={styles.legendaTexto}>Recesso</Text>
                    </View>
                </View>
            </View>

            <ListaPontosComponent
                pontosDoDia={pontosDoDia}
                jornada={jornada}
            />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: spacing.m,
    },
    legendaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
        paddingHorizontal: 15,
    },
    legendaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#cbcbcbff',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 5,
        margin: 7,
    },
    legendaCor: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    legendaTexto: {
        fontSize: 12,
        color: '#333',
    },
});