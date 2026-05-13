import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';

// Dados de exemplo
const DADOS_SIMULADOS = [
    { id: '1', nome: 'João Pedro', email: 'jp@email.com' },
    { id: '2', nome: 'João Brandini', email: 'brandini@email.com' },
];

export default function TabelaUsuariosScreen({ navigation }) {
  // Função que desenha cada linha
  
const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ResumoUsuario', { userId: item.id })}>
        <View style={styles.linha}>
            <View style={styles.celulaPrincipal}>
                <Text style={styles.textoNome}>{item.nome}</Text>
                <Text style={styles.textoEmail}>{item.email}</Text>
            </View>
            <Text style={styles.textoCargo}>{item.cargo}</Text>
        </View>
    </TouchableOpacity>
);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Gerenciar Usuários</Text>

      <TouchableOpacity 
        style={styles.botaoAdicionar} 
        onPress={() => navigation.navigate('CadastroUsuario')}
      >
        <Text style={styles.textoBotao}>+ Adicionar Novo Usuário</Text>
      </TouchableOpacity>

      <FlatList
          data={DADOS_SIMULADOS}
          renderItem={renderItem}
          keyExtractor={item => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  botaoAdicionar: { backgroundColor: '#2E8B57', padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 15, marginBottom: 20 },
  textoBotao: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linha: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white', marginHorizontal: 15 },
  textoNome: { fontSize: 16, fontWeight: 'bold' },
  textoEmail: { fontSize: 14, color: 'gray' },
});