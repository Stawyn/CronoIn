// src/screens/Usuario/index.jsx
import { buscarUsuarioPorId } from '../../services/UsuarioService';
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { listarUsuarios, deletarUsuario } from '../../services/UsuarioService';
import { API_BASE_URL } from '../../api/api';
import { colors, spacing, radius } from '../../theme';

export default function TabelaUsuariosScreen({ navigation }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const carregarUsuarios = useCallback(async (fromRefresh = false) => {
        try {
            if (fromRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            const data = await listarUsuarios();
            setUsuarios(data);
        } catch (err) {
            setError(err.message);
            Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
        } finally {
            if (fromRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    // useFocusEffect garante que os dados sejam recarregados sempre que a tela recebe foco
    useFocusEffect(
        useCallback(() => {
            carregarUsuarios(false);
        }, [carregarUsuarios])
    );

    const handleEditar = (usuario) => {
        navigation.navigate('CadastroUsuario', { usuario });
    };

    const handleResumo = async (usuario) => {
        try {
            const userCompleto = await buscarUsuarioPorId(usuario.usu_id);

            navigation.navigate('ResumoUsers', {
                usuario: userCompleto
            });

        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar os detalhes do usuário.");
        }
    };


    const handleDeletar = async (id) => {
        try {
            await deletarUsuario(id);
            setUsuarios((prev) => prev.filter((u) => u.usu_id !== id));
            Alert.alert('Sucesso', 'Usuário deletado com sucesso.');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível deletar o usuário.');
        }
    };

    const getPhotoUri = (foto) => {
        if (!foto) return null;
        if (foto.startsWith('http')) return foto;
        return `${API_BASE_URL}${foto}`;
    };

    const getInitials = (nome = '') => {
        if (!nome) return '?';
        return nome
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0]?.toUpperCase())
            .join('');
    };

    const renderItem = ({ item }) => {
        const photoUri = getPhotoUri(item.usu_foto_url);
        return (
            <View style={styles.card}>
                {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{getInitials(item.usu_nome)}</Text>
                    </View>
                )}
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.userName}>{item.usu_nome}</Text>
                        {item.usu_permissao ? (
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{item.usu_permissao}</Text>
                            </View>
                        ) : null}
                    </View>
                    <Text style={styles.userEmail}>{item.usu_email}</Text>
                    {item.usu_departamento ? (
                        <Text style={styles.userDepartment}>{item.usu_departamento}</Text>
                    ) : null}
                    <View style={styles.actionsRow}>
                         <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditar(item)}
                    >
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeletar(item.usu_id)}
                    >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Deletar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.resumoButton]}
                        onPress={() => handleResumo(item)}
                    >
                        <Ionicons name="document-text-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Resumo</Text>
                    </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const handleRefresh = useCallback(() => {
        carregarUsuarios(true);
    }, [carregarUsuarios]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando usuários...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Erro ao carregar dados: {error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Equipe Cadastrada</Text>
                    <Text style={styles.subtitle}>Visualize quem já possui biometria registrada.</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CadastroUsuario')}>
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Novo usuário</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={usuarios}
                renderItem={renderItem}
                keyExtractor={(item) => item.usu_id.toString()}
                contentContainerStyle={[styles.listContent, usuarios.length === 0 && styles.listEmptyContent]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={42} color={colors.muted} />
                        <Text style={styles.emptyTitle}>Nenhum usuário por aqui</Text>
                        <Text style={styles.emptySubtitle}>Adicione alguém para começar a montar a sua base de colaboradores.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.l },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.m },
    title: { fontSize: 24, fontWeight: '700', color: colors.text },
    subtitle: { color: colors.muted, marginTop: spacing.xs, maxWidth: 220 },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.m, paddingVertical: spacing.s, borderRadius: radius.m },
    addButtonText: { color: '#fff', fontWeight: '600', marginLeft: spacing.xs },
    listContent: { paddingBottom: spacing.xxl },
    listEmptyContent: { flexGrow: 1, justifyContent: 'center' },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.l, padding: spacing.m, marginBottom: spacing.m, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    avatar: { width: 72, height: 72, borderRadius: 16, marginRight: spacing.m },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 16, marginRight: spacing.m, backgroundColor: '#E3EBFF', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 24, fontWeight: '700', color: colors.primary },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userName: { fontSize: 18, fontWeight: '700', color: colors.text, flexShrink: 1, marginRight: spacing.s },
    roleBadge: { backgroundColor: '#EEF3FF', paddingHorizontal: spacing.s, paddingVertical: spacing.xs, borderRadius: radius.s },
    roleBadgeText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
    userEmail: { marginTop: spacing.xs, color: colors.muted },
    userDepartment: { marginTop: 4, fontWeight: '600', color: colors.text },
    actionsRow: { flexDirection: 'row', marginTop: spacing.m },
    actionButton: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.m, paddingVertical: spacing.s, paddingHorizontal: spacing.m, marginRight: spacing.s },
    actionButtonText: { color: '#fff', fontWeight: '600', marginLeft: spacing.xs },
    editButton: { backgroundColor: '#4c9aff' },
    deleteButton: { backgroundColor: colors.danger },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.l, backgroundColor: colors.bg },
    errorText: { color: colors.danger, fontSize: 16, textAlign: 'center', marginTop: spacing.s },
    loadingText: { marginTop: spacing.s, color: colors.muted },
    emptyState: { alignItems: 'center', textAlign: 'center', paddingHorizontal: spacing.xl },
    emptyTitle: { marginTop: spacing.m, fontSize: 18, fontWeight: '600', color: colors.text },
    emptySubtitle: { textAlign: 'center', color: colors.muted, marginTop: spacing.s },
    resumoButton: { backgroundColor: '#21808d'   // a cor padrão do seu sistema
}
});