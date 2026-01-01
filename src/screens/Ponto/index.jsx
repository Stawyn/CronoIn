import React, { useState, useCallback } from 'react'; // Importe useCallback
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listarPontos, deletarPonto } from '../../services/PontoService';

export default function ListaPontos({ navigation }) {
  const [pontos, setPontos] = useState([]);

  // --- CORREÇÃO 1: Estabilize a função fetchPontos com useCallback ---
  // Como ela não depende de nenhuma prop ou estado, o array de dependências é vazio [].
  const fetchPontos = useCallback(async () => {
    try {
      const data = await listarPontos();
      setPontos(data);
    } catch (error) {
      console.error("Erro ao carregar os pontos:", error);
      Alert.alert('Erro', 'Não foi possível carregar as jornadas.');
    }
  }, []); // Array de dependências vazio

  // --- CORREÇÃO 2: A função handleDelete agora depende de uma fetchPontos estável ---
  const handleDelete = useCallback(async (id) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Você tem certeza que deseja excluir esta jornada? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Agora esta parte será executada corretamente
              await deletarPonto(id);
              Alert.alert('Sucesso', 'Jornada excluída com sucesso!');
              fetchPontos(); // Chama a versão estável para atualizar a lista
            } catch (error) {
              console.error("Erro detalhado ao deletar ponto:", error);
              Alert.alert('Erro', `Não foi possível excluir a jornada: ${error.message}`);
            }
          }
        }
      ]
    );
  }, [fetchPontos]); // A dependência continua correta

  // useFocusEffect para carregar os dados quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      fetchPontos();
    }, [fetchPontos]) // Adicione fetchPontos como dependência aqui também
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 0.8 }]}>{item.cad_id}</Text>
      <Text style={[styles.cell, { flex: 2 }]}>{item.cad_ponto_nome}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.cad_ponto_inicio}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.cad_ponto_fim}</Text>

      <View style={[styles.cell, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.edit} onPress={() => navigation.navigate('CadastroPonto', { ponto: item })}>
          <Ionicons name="pencil" style={styles.buttonText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        {/* Chamada correta para a função estável handleDelete */}
        <TouchableOpacity style={styles.delete} onPress={() => handleDelete(item.cad_id)}>
          <Ionicons name="trash" style={styles.buttonText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity style={[styles.viewButton]} onPress={() => navigation.navigate('ResumoPonto', { ponto: item })}>
          <Ionicons name="alert-circle" style={styles.buttonText} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Gerenciar Jornadas</Text>
        <TouchableOpacity style={styles.novoButton} onPress={() => navigation.navigate('CadastroPonto')}>
          <Text style={styles.novoButtonText}>Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.cell, { flex: 0.8 }]}>ID</Text>
        <Text style={[styles.cell, { flex: 2 }]}>Nome</Text>
        <Text style={[styles.cell, { flex: 1 }]}>Início</Text>
        <Text style={[styles.cell, { flex: 1 }]}>Fim</Text>
        <Text style={[styles.cell, { flex: 1 }]}>Editar</Text>
        <Text style={[styles.cell, { flex: 1 }]}>Excluir</Text>
        <Text style={[styles.cell, { flex: 1 }]}>Ver</Text>
      </View>

      <FlatList
        data={pontos}
        keyExtractor={(item) => item.cad_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  novoButton: { backgroundColor: '#2ecc71', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  novoButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  header: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 5, backgroundColor: '#f9f9f9' },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  cell: { textAlign: 'center', fontSize: 14, paddingHorizontal: 2 },
  edit: { backgroundColor: '#3498db', padding: 8, borderRadius: 5, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  delete: { backgroundColor: '#e74c3c', padding: 8, borderRadius: 5, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  viewButton: { backgroundColor: '#f1c40f', padding: 8, borderRadius: 5, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});