import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';

// Vamos usar os mesmos dados simulados da outra tela para encontrar o usuário
const DADOS_SIMULADOS = [
    { id: '1', nome: 'João Pedro', email: 'jp@email.com', cargo: 'Desenvolvedor Front-end', telefone: '(24) 99999-1111', departamento: 'Tecnologia', permissao: 'Usuário' },
    { id: '2', nome: 'João Brandini', email: 'brandini@email.com', cargo: 'Desenvolvedor Back-end', telefone: '(11) 98888-2222', departamento: 'Tecnologia', permissao: 'Admin' },
    { id: '3', nome: 'Gabriel Toscano', email: 'toscano@email.com', cargo: 'Gerente de Projetos', telefone: '(21) 97777-3333', departamento: 'Gestão', permissao: 'Admin' },
    { id: '4', nome: 'Gabriel Ragazzi', email: 'ragazzi@email.com', cargo: 'Líder de Equipe', telefone: '(12) 96666-4444', departamento: 'Gestão', permissao: 'Admin' },
];

// A tela recebe `route` para acessar os parâmetros passados pela navegação
export default function ResumoUsuarioScreen({ route, navigation }) {
    const { userId } = route.params; // Pegamos o ID do usuário que foi passado

    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simula a busca do usuário específico na "API"
        setTimeout(() => {
            const usuarioEncontrado = DADOS_SIMULADOS.find(u => u.id === userId);
            setUsuario(usuarioEncontrado);
            setLoading(false);
        }, 500); // Meio segundo de loading
    }, [userId]); // Executa sempre que o userId mudar

    if (loading) {
        return <ActivityIndicator size="large" color="#2E8B57" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    if (!usuario) {
        return <View style={styles.container}><Text>Usuário não encontrado.</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.titulo}>Perfil do Usuário</Text>

            <View style={styles.card}>
                <View style={styles.infoLinha}>
                    <Text style={styles.label}>Nome:</Text>
                    <Text style={styles.valor}>{usuario.nome}</Text>
                </View>
                <View style={styles.infoLinha}>
                    <Text style={styles.label}>E-mail:</Text>
                    <Text style={styles.valor}>{usuario.email}</Text>
                </View>
                <View style={styles.infoLinha}>
                    <Text style={styles.label}>Cargo:</Text>
                    <Text style={styles.valor}>{usuario.cargo}</Text>
                </View>
                <View style={styles.infoLinha}>
                    <Text style={styles.label}>Telefone:</Text>
                    <Text style={styles.valor}>{usuario.telefone}</Text>
                </View>
                <View style={styles.infoLinha}>
                    <Text style={styles.label}>Departamento:</Text>
                    <Text style={styles.valor}>{usuario.departamento}</Text>
                </View>
                <View style={styles.infoLinha}>
                    <Text style={styles.label}>Permissão:</Text>
                    <Text style={styles.valor}>{usuario.permissao}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
                <Text style={styles.textoBotao}>Voltar para a Lista</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    card: { backgroundColor: 'white', borderRadius: 8, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    infoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    valor: { fontSize: 16, color: '#555' },
    botaoVoltar: { backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    textoBotao: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});