// src/screens/Ponto/ResumoPonto.jsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ResumoPonto({ route, navigation }) {
  const ponto = route.params?.ponto;

  if (!ponto) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nenhum ponto selecionado.</Text>
      </View>
    );
  }

  // Mapeia os números dos dias para nomes
  const getDiaSemanaNome = (diasStr) => {
    if (!diasStr) return '';
    const mapaDias = { '1': 'Seg', '2': 'Ter', '3': 'Qua', '4': 'Qui', '5': 'Sex', '6': 'Sáb', '0': 'Dom' };
    const ordem = ['1','2','3','4','5','6','0'];
    const diasArray = diasStr.split(',');
    diasArray.sort((a,b) => ordem.indexOf(a) - ordem.indexOf(b));
    return diasArray.map(dia => mapaDias[dia] || 'Inválido').join(', ');
  };

  const Info = ({ label, value }) => (
    <View style={styles.infoLinha}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.valor}>{value}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Resumo da Jornada</Text>

      <View style={styles.card}>
        <Info label="ID" value={ponto.cad_id} />
        <Info label="Nome do Ponto" value={ponto.cad_ponto_nome} />
        <Info label="Hora Início" value={ponto.cad_ponto_inicio} />
        <Info label="Hora Fim" value={ponto.cad_ponto_fim} />
        <Info label="Pausa Habilitada" value={ponto.cad_ponto_pausa ? 'Sim' : 'Não'} />

        {ponto.cad_ponto_pausa && (
          <Info label="Tempo de Pausa (min)" value={ponto.cad_ponto_tempo_pausa_min} />
        )}

        <Info label="Tolerância (min)" value={ponto.cad_ponto_tolerancia_min} />
        <Info label="Dias da Semana" value={getDiaSemanaNome(ponto.cad_ponto_dias_semana)} />
        <Info label="Data de Criação" value={new Date(ponto.cad_info_data_criacao).toLocaleString('pt-BR')} />
      </View>

      <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.textoBotao}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5' },

  titulo: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20, 
    color: '#333' 
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  infoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  valor: { fontSize: 16, color: '#555', textAlign: 'right', flexShrink: 1 },

  botaoVoltar: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },

  textoBotao: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  errorText: { 
    fontSize: 18, 
    color: 'red', 
    textAlign: 'center', 
    marginTop: 50 
  },
});
